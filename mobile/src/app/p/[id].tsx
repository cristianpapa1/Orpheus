import { formatPostDate } from "@atelier/core/posts/types";
import { localizedCategoryLabel, localizedStyleLabel } from "@atelier/core/taxonomy/i18n";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Window } from "../../components/Window";
import { mediaUrl, supabase } from "../../lib/supabase";
import { useFavorites } from "../../lib/favorites";
import { useI18n, useT } from "../../lib/i18n/context";
import { BAUHAUS, FONT, FONT_BODY } from "../../theme";

const CARD_W = Dimensions.get("window").width - 64;

interface Author {
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
}
interface Post {
  id: string;
  caption: string;
  category: string;
  subcategory: string | null;
  media_type: "image" | "video" | "audio" | "text";
  image_path: string | null;
  images: string[] | null;
  original_path: string | null;
  body: string | null;
  tags: string[] | null;
  created_at: string;
  author_id: string;
  author: Author | null;
}
interface Comment {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_handle: string;
  author_name: string;
}
interface Support {
  count: number;
  mine: boolean;
}

const imgsOf = (p: Post): string[] =>
  p.images?.length ? p.images : p.image_path ? [p.image_path] : [];

/** Post detail — the work in full, plus the curator conversation beneath it.
 *  Comments are curator-only to write (RLS enforces); any member may support
 *  a comment with ▲; the author or an admin may delete one. */
export default function PostDetailScreen() {
  const dict = useT();
  const t = dict.post;
  const router = useRouter();
  const { dir, locale } = useI18n();
  const align = dir === "rtl" ? "right" : "left";
  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [supports, setSupports] = useState<Record<string, Support>>({});
  const [supportsOn, setSupportsOn] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [canComment, setCanComment] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const { favSet, toggle } = useFavorites(post ? [post.id] : []);

  const loadConversation = useCallback(async (postId: string) => {
    const { data } = await supabase
      .from("post_comments")
      // Explicit FK: comment_supports also links post_comments↔profiles, so a bare
      // `profiles` embed is ambiguous (PGRST201). Disambiguate to the author FK.
      .select("id, body, created_at, author_id, author:profiles!post_comments_author_id_fkey(handle, display_name)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(200);
    const rows = (data as unknown as {
      id: string;
      body: string;
      created_at: string;
      author_id: string;
      author: { handle: string | null; display_name: string | null } | null;
    }[]) ?? [];
    const list: Comment[] = rows.map((c) => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      author_id: c.author_id,
      author_handle: c.author?.handle ?? "",
      author_name: c.author?.display_name ?? c.author?.handle ?? "Unnamed",
    }));
    setComments(list);

    if (list.length === 0) {
      setSupports({});
      return;
    }
    const { data: sup, error } = await supabase
      .from("comment_supports")
      .select("comment_id, profile_id")
      .in("comment_id", list.map((c) => c.id));
    if (error) {
      setSupportsOn(false); // table missing → feature off
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const map: Record<string, Support> = {};
    for (const c of list) map[c.id] = { count: 0, mine: false };
    for (const r of sup ?? []) {
      const e = map[r.comment_id];
      if (!e) continue;
      e.count += 1;
      if (user && r.profile_id === user.id) e.mine = true;
    }
    setSupports(map);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) setUid(user?.id ?? null);

      if (user) {
        const [{ data: cur }, { data: me }] = await Promise.all([
          supabase.rpc("is_curator", { uid: user.id }),
          supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle(),
        ]);
        if (!cancelled) {
          setCanComment(Boolean(cur));
          setIsAdmin(Boolean(me?.is_admin));
        }
      }

      const { data: p } = await supabase
        .from("posts")
        .select(
          "id, caption, category, subcategory, media_type, image_path, images, original_path, body, tags, created_at, author_id, author:profiles!posts_author_id_fkey(handle, display_name, avatar_url)",
        )
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (!p) {
        setPost(null);
        return;
      }
      setPost(p as unknown as Post);
      await loadConversation(p.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, loadConversation]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !uid || !post) return;
    setPosting(true);
    try {
      const { error } = await supabase
        .from("post_comments")
        .insert({ post_id: post.id, author_id: uid, body });
      if (error) {
        Alert.alert("", t.failed);
        return;
      }
      // Best-effort notification to the author (never blocks the comment).
      if (post.author_id !== uid) {
        await supabase
          .from("notifications")
          .insert({
            recipient_id: post.author_id,
            actor_id: uid,
            type: "comment",
            subject_type: "post",
            subject_id: post.id,
          })
          .then(
            () => {},
            () => {},
          );
      }
      setDraft("");
      await loadConversation(post.id);
    } finally {
      setPosting(false);
    }
  };

  const toggleSupport = async (commentId: string) => {
    if (!uid) return;
    const cur = supports[commentId] ?? { count: 0, mine: false };
    setSupports((s) => ({
      ...s,
      [commentId]: { count: cur.count + (cur.mine ? -1 : 1), mine: !cur.mine },
    }));
    if (cur.mine) {
      await supabase.from("comment_supports").delete().eq("comment_id", commentId).eq("profile_id", uid);
    } else {
      await supabase.from("comment_supports").insert({ comment_id: commentId, profile_id: uid });
    }
  };

  const removeComment = (commentId: string) => {
    Alert.alert(t.deleteTitle, t.deleteMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          await supabase.from("post_comments").delete().eq("id", commentId);
          if (post) await loadConversation(post.id);
        },
      },
    ]);
  };

  if (post === null) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.pad}>
        <Stack.Screen options={{ title: "" }} />
        <Window title="Atelier" accent="red">
          <Text style={styles.body}>{t.notFound}</Text>
        </Window>
      </ScrollView>
    );
  }
  if (!post) {
    return <View style={styles.screen} />;
  }

  const pics = imgsOf(post);
  const orig = post.original_path;
  const authorName = post.author?.display_name ?? post.author?.handle ?? "Unnamed";
  const openAuthor = () =>
    post.author?.handle &&
    router.push({ pathname: "/u/[handle]", params: { handle: post.author.handle } });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: localizedCategoryLabel(post.category, locale) }} />

      <Window title={localizedCategoryLabel(post.category, locale)} accent="red">
        {post.media_type === "text" ? (
          <>
            {post.caption ? <Text style={styles.heading}>{post.caption}</Text> : null}
            {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
          </>
        ) : pics.length ? (
          <>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ width: CARD_W }}>
              {pics.map((p, i) => (
                <Image key={i} source={{ uri: mediaUrl(p) }} style={[styles.image, { width: CARD_W }]} resizeMode="cover" />
              ))}
            </ScrollView>
            {orig ? (
              <Pressable style={styles.fullBtn} onPress={() => Linking.openURL(mediaUrl(orig))}>
                <Text style={styles.fullBtnText}>{t.viewFull}</Text>
              </Pressable>
            ) : null}
            {post.caption ? <Text style={styles.body}>{post.caption}</Text> : null}
          </>
        ) : null}
        <Pressable onPress={() => toggle(post.id)} hitSlop={8} style={styles.favRow}>
          <Text style={[styles.heart, favSet.has(post.id) && styles.heartOn]}>
            {favSet.has(post.id) ? "♥" : "♡"}
          </Text>
        </Pressable>
      </Window>

      <Window title={t.about} accent="blue">
        <Pressable style={styles.idRow} onPress={openAuthor} disabled={!post.author?.handle}>
          {post.author?.avatar_url ? (
            <Image source={{ uri: post.author.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{authorName.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{authorName.toUpperCase()}</Text>
            {post.author?.handle ? <Text style={styles.handle}>@{post.author.handle}</Text> : null}
          </View>
        </Pressable>

        {post.tags?.length ? (
          <View style={styles.tags}>
            {post.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>#{tag}</Text>
            ))}
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>{t.category.toUpperCase()}</Text>
          <Text style={styles.metaVal}>{localizedCategoryLabel(post.category, locale)}</Text>
        </View>
        {post.subcategory ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>{t.style.toUpperCase()}</Text>
            <Text style={styles.metaVal}>{localizedStyleLabel(post.category, post.subcategory, locale)}</Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>{t.published.toUpperCase()}</Text>
          <Text style={styles.metaVal}>{formatPostDate(post.created_at)}</Text>
        </View>
      </Window>

      <Window title={`${t.conversation} (${comments.length})`} accent="yellow">
        {comments.length === 0 ? (
          <Text style={styles.bodyDim}>{t.noComments}</Text>
        ) : (
          comments.map((c) => {
            const s = supports[c.id];
            const mine = uid === c.author_id || isAdmin;
            return (
              <View key={c.id} style={styles.comment}>
                <View style={styles.commentHead}>
                  <Pressable
                    disabled={!c.author_handle}
                    onPress={() =>
                      c.author_handle &&
                      router.push({ pathname: "/u/[handle]", params: { handle: c.author_handle } })
                    }
                  >
                    <Text style={styles.commentAuthor}>
                      {c.author_name.toUpperCase()}
                      {c.author_handle ? ` · @${c.author_handle}` : ""}
                    </Text>
                  </Pressable>
                  <Text style={styles.commentDate}>{c.created_at.slice(0, 10)}</Text>
                </View>
                <Text style={styles.commentBody}>{c.body}</Text>
                <View style={styles.commentActions}>
                  {supportsOn ? (
                    <Pressable
                      onPress={() => toggleSupport(c.id)}
                      hitSlop={8}
                      style={[styles.support, s?.mine && styles.supportOn]}
                    >
                      <Text style={[styles.supportText, s?.mine && styles.supportTextOn]}>
                        ▲ {s?.count ?? 0}
                      </Text>
                    </Pressable>
                  ) : null}
                  {mine ? (
                    <Pressable onPress={() => removeComment(c.id)} hitSlop={8} style={styles.deleteBtn}>
                      <Text style={styles.deleteText}>{t.delete.toUpperCase()}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        {!uid ? (
          <Text style={styles.note}>{t.signInNote}</Text>
        ) : canComment ? (
          <View style={styles.form}>
            <Text style={styles.label}>{t.addComment.toUpperCase()}</Text>
            <TextInput
              style={[styles.input, styles.multiline, { textAlign: align }]}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={2000}
              placeholder={t.placeholder}
              placeholderTextColor="#8a877c"
            />
            <Pressable
              style={[styles.btn, (posting || !draft.trim()) && styles.btnDim]}
              disabled={posting || !draft.trim()}
              onPress={send}
            >
              <Text style={styles.btnText}>{(posting ? t.sending : t.send).toUpperCase()}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.noteBox}>
            <Text style={styles.noteBoxText}>{t.curatorNote}</Text>
          </View>
        )}
      </Window>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BAUHAUS.paper },
  pad: { padding: 16 },
  heading: { fontFamily: FONT, fontSize: 20, letterSpacing: 0.5, color: BAUHAUS.ink, marginBottom: 10 },
  image: { width: "100%", aspectRatio: 4 / 3, borderWidth: 2, borderColor: BAUHAUS.ink },
  fullBtn: { alignSelf: "flex-start", borderWidth: 2, borderColor: BAUHAUS.ink, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  fullBtnText: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.ink },
  body: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink, marginTop: 8 },
  bodyDim: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink, opacity: 0.6 },
  favRow: { marginTop: 12, alignSelf: "flex-start" },
  heart: { fontSize: 24, color: BAUHAUS.ink },
  heartOn: { color: BAUHAUS.red },

  idRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderWidth: 2, borderColor: BAUHAUS.ink },
  avatarFallback: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    backgroundColor: BAUHAUS.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: BAUHAUS.paper, fontFamily: FONT, fontSize: 20 },
  name: { fontFamily: FONT, fontSize: 16, letterSpacing: 1, color: BAUHAUS.ink },
  handle: { fontFamily: FONT, fontSize: 12, letterSpacing: 1, color: BAUHAUS.ink, marginTop: 2 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tag: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.blue },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderColor: BAUHAUS.ink,
    paddingTop: 6,
    marginTop: 8,
  },
  metaKey: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.ink },
  metaVal: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.ink },

  comment: { borderWidth: 2, borderColor: BAUHAUS.ink, padding: 10, marginBottom: 10 },
  commentHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  commentAuthor: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.ink },
  commentDate: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.ink, opacity: 0.6 },
  commentBody: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink, marginTop: 6 },
  commentActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  support: { borderWidth: 2, borderColor: BAUHAUS.ink, paddingHorizontal: 8, paddingVertical: 2 },
  supportOn: { backgroundColor: BAUHAUS.ink },
  supportText: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.ink },
  supportTextOn: { color: BAUHAUS.paper },
  deleteBtn: { borderWidth: 2, borderColor: BAUHAUS.ink, paddingHorizontal: 8, paddingVertical: 2 },
  deleteText: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.red },

  form: { marginTop: 14 },
  label: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.ink, marginBottom: 6 },
  input: {
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    padding: 10,
    fontFamily: FONT_BODY,
    color: BAUHAUS.ink,
    backgroundColor: BAUHAUS.paper,
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  btn: { backgroundColor: BAUHAUS.ink, paddingVertical: 10, alignItems: "center", marginTop: 10 },
  btnDim: { opacity: 0.5 },
  btnText: { fontFamily: FONT, letterSpacing: 2, color: BAUHAUS.paper },
  note: { fontFamily: FONT, fontSize: 12, letterSpacing: 1, color: BAUHAUS.ink, marginTop: 14 },
  noteBox: { borderWidth: 2, borderColor: BAUHAUS.ink, backgroundColor: BAUHAUS.yellow, padding: 10, marginTop: 14 },
  noteBoxText: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.ink },
});
