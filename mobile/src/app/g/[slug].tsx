import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Window } from "../../components/Window";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/context";
import { BAUHAUS, FONT, FONT_BODY } from "../../theme";

interface Group {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_private: boolean;
}
type Relation = "owner" | "member" | "requested" | "follower" | "none";

/** Group detail — about, counts, and Follow / Request-to-join. */
export default function GroupScreen() {
  const t = useT().group;
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [group, setGroup] = useState<Group | null | undefined>(undefined);
  const [members, setMembers] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [relation, setRelation] = useState<Relation>("none");
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) setUid(user?.id ?? null);

      const { data: g } = await supabase
        .from("groups")
        .select("id, slug, name, description, is_private")
        .eq("slug", slug)
        .maybeSingle();
      if (cancelled) return;
      if (!g) {
        setGroup(null);
        return;
      }
      setGroup(g as Group);

      const [mCount, fCount, mem, req, fol] = await Promise.all([
        supabase.from("group_members").select("*", { count: "exact", head: true }).eq("group_id", g.id),
        supabase.from("group_followers").select("*", { count: "exact", head: true }).eq("group_id", g.id),
        user
          ? supabase.from("group_members").select("role").eq("group_id", g.id).eq("profile_id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        user
          ? supabase.from("group_join_requests").select("group_id").eq("group_id", g.id).eq("requester_id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        user
          ? supabase.from("group_followers").select("group_id").eq("group_id", g.id).eq("profile_id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setMembers(mCount.count ?? 0);
      setFollowers(fCount.count ?? 0);
      const role = (mem.data as { role?: string } | null)?.role;
      if (role === "owner") setRelation("owner");
      else if (role) setRelation("member");
      else if (req.data) setRelation("requested");
      else if (fol.data) setRelation("follower");
      else setRelation("none");
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const followGroup = async () => {
    if (!uid || !group) return;
    setRelation("follower");
    setFollowers((n) => n + 1);
    await supabase.from("group_followers").insert({ group_id: group.id, profile_id: uid });
  };
  const unfollowGroup = async () => {
    if (!uid || !group) return;
    setRelation("none");
    setFollowers((n) => Math.max(0, n - 1));
    await supabase.from("group_followers").delete().eq("group_id", group.id).eq("profile_id", uid);
  };
  const requestToJoin = async () => {
    if (!uid || !group) return;
    setRelation("requested");
    await supabase.from("group_join_requests").insert({ group_id: group.id, requester_id: uid });
  };

  if (group === null) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.pad}>
        <Stack.Screen options={{ title: "" }} />
        <Window title="Atelier" accent="blue">
          <Text style={styles.body}>{t.notFound}</Text>
        </Window>
      </ScrollView>
    );
  }

  const name = group?.name ?? "…";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.pad}>
      <Stack.Screen options={{ title: name }} />
      <Window title={t.about} accent="blue">
        <Text style={styles.name}>{name.toUpperCase()}</Text>
        {group?.is_private ? <Text style={styles.badge}>{t.private.toUpperCase()}</Text> : null}
        <Text style={styles.count}>
          {members} {t.members} · {followers} {t.followers}
        </Text>
        {group?.description ? <Text style={styles.bio}>{group.description}</Text> : null}

        <View style={styles.actions}>
          {relation === "owner" || relation === "member" ? (
            <Text style={styles.badge}>{t.member.toUpperCase()}</Text>
          ) : relation === "requested" ? (
            <Text style={styles.badge}>{t.requested.toUpperCase()}</Text>
          ) : (
            <>
              {relation === "follower" ? (
                <Pressable style={styles.btnAlt} onPress={unfollowGroup}>
                  <Text style={styles.btnAltText}>{t.following.toUpperCase()}</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.btn} onPress={followGroup}>
                  <Text style={styles.btnText}>{t.follow.toUpperCase()}</Text>
                </Pressable>
              )}
              <Pressable style={styles.btnAlt} onPress={requestToJoin}>
                <Text style={styles.btnAltText}>{t.requestJoin.toUpperCase()}</Text>
              </Pressable>
            </>
          )}
        </View>
      </Window>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BAUHAUS.paper },
  pad: { padding: 16 },
  name: { fontFamily: FONT, fontSize: 18, letterSpacing: 1, color: BAUHAUS.ink },
  badge: {
    fontFamily: FONT,
    fontSize: 11,
    letterSpacing: 1,
    color: BAUHAUS.ink,
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  count: { fontFamily: FONT, fontSize: 12, letterSpacing: 1, color: BAUHAUS.ink, marginTop: 12 },
  bio: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink, marginTop: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  btn: { backgroundColor: BAUHAUS.ink, paddingHorizontal: 16, paddingVertical: 10 },
  btnText: { fontFamily: FONT, letterSpacing: 2, color: BAUHAUS.paper },
  btnAlt: { borderWidth: 2, borderColor: BAUHAUS.ink, paddingHorizontal: 16, paddingVertical: 10 },
  btnAltText: { fontFamily: FONT, letterSpacing: 2, color: BAUHAUS.ink },
  body: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink },
});
