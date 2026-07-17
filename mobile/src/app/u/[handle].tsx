import { formatPostDate } from "@atelier/core/posts/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Window } from "../../components/Window";
import { mediaUrl, supabase } from "../../lib/supabase";
import { useFavorites } from "../../lib/favorites";
import { useT } from "../../lib/i18n/context";
import { BAUHAUS, FONT, FONT_BODY } from "../../theme";

const CARD_W = Dimensions.get("window").width - 64;

interface Profile {
  id: string;
  handle: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  claimed_at: string | null;
  quality_stamp: boolean | null;
}
interface Post {
  id: string;
  caption: string;
  category: string;
  media_type: "image" | "video" | "audio" | "text";
  image_path: string | null;
  images: string[] | null;
  body: string | null;
  created_at: string;
}
const imgsOf = (p: Post): string[] =>
  p.images?.length ? p.images : p.image_path ? [p.image_path] : [];

/** Public profile — identity, badges, follower count, Follow, and their work. */
export default function ProfileScreen() {
  const t = useT().profile;
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState(0);
  const [curator, setCurator] = useState(false);
  const [following, setFollowing] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const { favSet, toggle } = useFavorites(posts.map((p) => p.id));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) setUid(user?.id ?? null);

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, handle, display_name, bio, avatar_url, claimed_at, quality_stamp")
        .eq("handle", handle)
        .maybeSingle();
      if (cancelled) return;
      if (!prof) {
        setProfile(null);
        return;
      }
      setProfile(prof as Profile);

      const [{ count }, curatorRes, followsRes, postsRes] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", prof.id),
        supabase.rpc("is_curator", { uid: prof.id }),
        user
          ? supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("followee_id", prof.id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("posts")
          .select("id, caption, category, media_type, image_path, images, body, created_at")
          .eq("author_id", prof.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (cancelled) return;
      setFollowers(count ?? 0);
      setCurator(Boolean(curatorRes.data));
      setFollowing(Boolean(followsRes.data));
      setPosts((postsRes.data as Post[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const toggleFollow = async () => {
    if (!uid || !profile) return;
    const next = !following;
    setFollowing(next);
    setFollowers((n) => n + (next ? 1 : -1));
    if (next) await supabase.from("follows").insert({ follower_id: uid, followee_id: profile.id });
    else await supabase.from("follows").delete().eq("follower_id", uid).eq("followee_id", profile.id);
  };

  if (profile === null) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.pad}>
        <Stack.Screen options={{ title: "" }} />
        <Window title="Atelier" accent="red">
          <Text style={styles.body}>{t.notFound}</Text>
        </Window>
      </ScrollView>
    );
  }

  const name = profile?.display_name ?? profile?.handle ?? "…";
  const isSelf = uid && profile?.id === uid;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.pad}>
      <Stack.Screen options={{ title: name }} />
      <Window title={t.posts} accent="blue">
        <View style={styles.idRow}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name.toUpperCase()}</Text>
            {profile?.handle ? <Text style={styles.handle}>@{profile.handle}</Text> : null}
          </View>
        </View>

        <View style={styles.badges}>
          {profile?.claimed_at ? <Text style={styles.badge}>✓ {t.verified.toUpperCase()}</Text> : null}
          {profile?.quality_stamp ? <Text style={styles.badge}>✦ {t.quality.toUpperCase()}</Text> : null}
          {curator ? <Text style={styles.badge}>♺ {t.curator.toUpperCase()}</Text> : null}
        </View>

        <Text style={styles.count}>
          {followers} {followers === 1 ? t.follower : t.followers}
        </Text>

        {!isSelf ? (
          <Pressable style={[styles.follow, following && styles.followOn]} onPress={toggleFollow}>
            <Text style={[styles.followText, following && styles.followTextOn]}>
              {(following ? t.following : t.follow).toUpperCase()}
            </Text>
          </Pressable>
        ) : null}

        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </Window>

      {posts.length === 0 ? (
        <Window title={t.posts} accent="yellow">
          <Text style={styles.body}>{t.noPosts}</Text>
        </Window>
      ) : (
        posts.map((p, i) => (
          <Window key={p.id} title={p.category} accent={(["red", "blue", "yellow"] as const)[i % 3]}>
            {p.media_type !== "text" && imgsOf(p).length ? (
              <View>
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ width: CARD_W }}>
                  {imgsOf(p).map((path, k) => (
                    <Image key={k} source={{ uri: mediaUrl(path) }} style={[styles.image, { width: CARD_W }]} resizeMode="cover" />
                  ))}
                </ScrollView>
                {imgsOf(p).length > 1 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.badgeText}>⊞ {imgsOf(p).length}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            <Text style={styles.meta}>{formatPostDate(p.created_at)}</Text>
            {p.caption ? <Text style={styles.body}>{p.caption}</Text> : null}
            {p.media_type === "text" && p.body ? <Text style={styles.body}>{p.body}</Text> : null}
            <Pressable onPress={() => toggle(p.id)} hitSlop={8} style={styles.favRow}>
              <Text style={[styles.heart, favSet.has(p.id) && styles.heartOn]}>
                {favSet.has(p.id) ? "♥" : "♡"}
              </Text>
            </Pressable>
          </Window>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BAUHAUS.paper },
  pad: { padding: 16 },
  idRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 56, height: 56, borderWidth: 2, borderColor: BAUHAUS.ink },
  avatarFallback: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    backgroundColor: BAUHAUS.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: BAUHAUS.paper, fontFamily: FONT, fontSize: 24 },
  name: { fontFamily: FONT, fontSize: 18, letterSpacing: 1, color: BAUHAUS.ink },
  handle: { fontFamily: FONT, fontSize: 12, letterSpacing: 1, color: BAUHAUS.ink, marginTop: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  badge: {
    fontFamily: FONT,
    fontSize: 11,
    letterSpacing: 1,
    color: BAUHAUS.ink,
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  count: { fontFamily: FONT, fontSize: 12, letterSpacing: 1, color: BAUHAUS.ink, marginTop: 12 },
  follow: {
    marginTop: 12,
    backgroundColor: BAUHAUS.ink,
    paddingVertical: 10,
    alignItems: "center",
  },
  followOn: { backgroundColor: BAUHAUS.paper, borderWidth: 2, borderColor: BAUHAUS.ink },
  followText: { fontFamily: FONT, letterSpacing: 2, color: BAUHAUS.paper },
  followTextOn: { color: BAUHAUS.ink },
  bio: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink, marginTop: 12 },
  image: { width: "100%", aspectRatio: 4 / 3, borderWidth: 2, borderColor: BAUHAUS.ink },
  meta: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, marginTop: 8, color: BAUHAUS.ink },
  body: { fontFamily: FONT_BODY, fontSize: 15, marginTop: 6, color: BAUHAUS.ink },
  favRow: { marginTop: 10, alignSelf: "flex-start" },
  heart: { fontSize: 22, color: BAUHAUS.ink },
  heartOn: { color: BAUHAUS.red },
  countBadge: {
    position: "absolute",
    right: 6,
    top: 6,
    backgroundColor: BAUHAUS.paper,
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: { fontFamily: FONT, fontSize: 10, letterSpacing: 1, color: BAUHAUS.ink },
});
