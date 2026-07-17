import {
  DISCIPLINE_LABEL,
  WORK_MODE_LABEL,
  type JobDiscipline,
  type WorkMode,
} from "@atelier/core/jobs/types";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Window } from "../../components/Window";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/context";
import { BAUHAUS, FONT, FONT_BODY } from "../../theme";

interface Row {
  id: string;
  title: string;
  discipline: JobDiscipline;
  work_mode: WorkMode;
  location: string | null;
  compensation: string;
}

/** Read-only open positions across the platform (public select, newest first). */
export default function JobsScreen() {
  const t = useT().jobs;
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase
      .from("job_posts")
      .select("id, title, discipline, work_mode, location, compensation")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);

  return (
    <ScrollView
      testID="jobs"
      style={{ backgroundColor: BAUHAUS.paper }}
      contentContainerStyle={{ padding: 16 }}
    >
      {rows.length === 0 ? (
        <Window title={t.title} accent="blue">
          <Text style={styles.body}>{t.empty}</Text>
        </Window>
      ) : (
        rows.map((job, i) => (
          <Window
            key={job.id}
            title={job.title}
            accent={(["blue", "yellow", "red"] as const)[i % 3]}
          >
            <Text style={styles.meta}>
              {(DISCIPLINE_LABEL[job.discipline] ?? job.discipline).toUpperCase()} ·{" "}
              {(WORK_MODE_LABEL[job.work_mode] ?? job.work_mode).toUpperCase()}
              {job.location ? ` · ${job.location.toUpperCase()}` : ""} ·{" "}
              {job.compensation.toUpperCase()}
            </Text>
          </Window>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink },
  meta: { fontFamily: FONT, fontSize: 12, letterSpacing: 1, color: BAUHAUS.ink },
});
