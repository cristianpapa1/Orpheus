import { CATEGORY_LABEL, POST_CATEGORIES, type PostCategory } from "@atelier/core/posts/types";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Window } from "../components/Window";
import { supabase } from "../lib/supabase";
import { useI18n, useT } from "../lib/i18n/context";
import { BAUHAUS, FONT, FONT_BODY } from "../theme";

const ATELIER_URL = "https://atelier.aunflaneur.com";
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};
const rand = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

/** Create a post — the mobile composer. Approved creators only (DB RLS enforces
 *  the same). Image posts upload the picked photo; text posts carry a body. */
export default function ComposeScreen() {
  const t = useT().compose;
  const { dir } = useI18n();
  const align = dir === "rtl" ? "right" : "left";
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [approved, setApproved] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const [mediaType, setMediaType] = useState<"image" | "text">("image");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<PostCategory | "">("");
  const [altText, setAltText] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUid(user?.id ?? null);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("creator_status")
          .eq("id", user.id)
          .maybeSingle();
        setApproved(data?.creator_status === "approved");
      }
      setReady(true);
    })();
  }, []);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) setImage(res.assets[0]);
  };

  const publish = async () => {
    setError(null);
    if (!category) return setError(t.needCategory);
    if (mediaType === "text" && !body.trim()) return setError(t.needBody);
    if (mediaType === "image" && (!image || !image.base64)) return setError(t.needImage);
    if (!uid) return;

    setBusy(true);
    try {
      // Publish goes through the moderate-post Edge Function: it runs the same
      // Claude first-line filter as the web, then inserts as the caller (RLS
      // still enforces the creator gate). We just upload the image first.
      let payload: Record<string, unknown>;
      if (mediaType === "image" && image?.base64) {
        const ext = EXT[image.mimeType ?? ""] ?? "jpg";
        const path = `${uid}/originals/${rand()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("media")
          .upload(path, decode(image.base64), {
            contentType: image.mimeType ?? "image/jpeg",
            upsert: true,
          });
        if (upErr) {
          setError(t.failed);
          return;
        }
        payload = {
          media_type: "image",
          caption,
          category,
          images: [path],
          image_width: image.width,
          image_height: image.height,
          alt_text: altText,
        };
      } else {
        payload = { media_type: "text", caption, category, body };
      }

      const { data, error: fnErr } = await supabase.functions.invoke("moderate-post", {
        body: payload,
      });
      if (fnErr) {
        setError(t.failed);
        return;
      }
      if (!data?.ok) {
        setError(typeof data?.error === "string" ? data.error : t.failed);
        return;
      }
      router.back();
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <View style={styles.screen} />;
  }

  if (!approved) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.pad}>
        <Stack.Screen options={{ title: t.title }} />
        <Window title={t.creatorsOnly} accent="yellow">
          <Text style={styles.body}>{t.creatorsOnlyBody}</Text>
          <Pressable
            style={styles.btn}
            onPress={() => Linking.openURL(`${ATELIER_URL}/creator/apply`)}
          >
            <Text style={styles.btnText}>{t.becomeCreator.toUpperCase()}</Text>
          </Pressable>
        </Window>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t.title }} />
      <Window title={t.title} accent="red">
        <View style={styles.chips}>
          {(["image", "text"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMediaType(m)}
              style={[styles.chip, mediaType === m && styles.chipOn]}
            >
              <Text style={[styles.chipText, mediaType === m && styles.chipTextOn]}>
                {(m === "image" ? t.image : t.text).toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {mediaType === "image" ? (
          <View style={styles.section}>
            {image ? <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" /> : null}
            <Pressable style={styles.btnAlt} onPress={pick}>
              <Text style={styles.btnAltText}>
                {(image ? t.changeImage : t.pickImage).toUpperCase()}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>{t.body.toUpperCase()}</Text>
            <TextInput
              style={[styles.input, styles.multiline, { textAlign: align }]}
              value={body}
              onChangeText={setBody}
              multiline
              placeholder={t.body}
              placeholderTextColor="#8a877c"
            />
          </View>
        )}

        <Text style={styles.label}>{t.caption.toUpperCase()}</Text>
        <TextInput
          style={[styles.input, { textAlign: align }]}
          value={caption}
          onChangeText={setCaption}
          placeholder={t.caption}
          placeholderTextColor="#8a877c"
        />

        {mediaType === "image" ? (
          <>
            <Text style={styles.label}>{t.altText.toUpperCase()}</Text>
            <TextInput
              style={[styles.input, { textAlign: align }]}
              value={altText}
              onChangeText={setAltText}
              placeholder={t.altText}
              placeholderTextColor="#8a877c"
            />
          </>
        ) : null}

        <Text style={styles.label}>{t.category.toUpperCase()}</Text>
        <View style={styles.chips}>
          {POST_CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, category === c && styles.chipOn]}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextOn]}>
                {CATEGORY_LABEL[c].toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.btn, busy && styles.btnDim]} disabled={busy} onPress={publish}>
          <Text style={styles.btnText}>{(busy ? t.publishing : t.publish).toUpperCase()}</Text>
        </Pressable>
      </Window>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BAUHAUS.paper },
  pad: { padding: 16 },
  section: { marginBottom: 8 },
  label: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.ink, marginTop: 12, marginBottom: 6 },
  body: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink },
  input: {
    borderWidth: 2,
    borderColor: BAUHAUS.ink,
    padding: 10,
    fontFamily: FONT_BODY,
    color: BAUHAUS.ink,
    backgroundColor: BAUHAUS.paper,
  },
  multiline: { minHeight: 120, textAlignVertical: "top" },
  preview: { width: "100%", aspectRatio: 4 / 3, borderWidth: 2, borderColor: BAUHAUS.ink, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { borderWidth: 2, borderColor: BAUHAUS.ink, paddingHorizontal: 12, paddingVertical: 6 },
  chipOn: { backgroundColor: BAUHAUS.ink },
  chipText: { fontFamily: FONT, fontSize: 11, letterSpacing: 1, color: BAUHAUS.ink },
  chipTextOn: { color: BAUHAUS.paper },
  btn: { backgroundColor: BAUHAUS.ink, paddingVertical: 12, alignItems: "center", marginTop: 16 },
  btnDim: { opacity: 0.5 },
  btnText: { fontFamily: FONT, letterSpacing: 2, color: BAUHAUS.paper },
  btnAlt: { borderWidth: 2, borderColor: BAUHAUS.ink, paddingVertical: 10, alignItems: "center" },
  btnAltText: { fontFamily: FONT, letterSpacing: 2, color: BAUHAUS.ink },
  error: { fontFamily: FONT, fontSize: 12, color: BAUHAUS.red, marginTop: 12 },
});
