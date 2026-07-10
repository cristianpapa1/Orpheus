import {
  formatEventDate,
  groupEventsByMonth,
  splitEvents,
  type EventItem,
} from "@atelier/core/events/types";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Window } from "../../components/Window";
import { supabase } from "../../lib/supabase";
import { BAUHAUS, FONT, FONT_BODY } from "../../theme";

/** Global upcoming events — grouped by month via @atelier/core (M0 payoff). */
export default function EventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  useEffect(() => {
    supabase
      .from("events")
      .select("id, profile_id, title, description, starts_at, location, location_type, ticket_url")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .then(({ data }) => setEvents((data as EventItem[]) ?? []));
  }, []);

  const { upcoming } = splitEvents(events, new Date(0).toISOString());
  const groups = groupEventsByMonth(upcoming);

  return (
    <ScrollView
      testID="events"
      style={{ backgroundColor: BAUHAUS.paper }}
      contentContainerStyle={{ padding: 16 }}
    >
      {groups.length === 0 ? (
        <Window title="Events" accent="yellow">
          <Text style={styles.body}>Nothing upcoming.</Text>
        </Window>
      ) : (
        groups.map((g) => (
          <Window key={g.label} title={g.label} accent="yellow">
            {g.events.map((e) => (
              <Text key={e.id} style={styles.body}>
                <Text style={styles.strong}>{e.title}</Text>
                {"\n"}
                {formatEventDate(e.starts_at)}
                {e.location ? ` · ${e.location}` : ""}
                {"\n"}
              </Text>
            ))}
          </Window>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: FONT_BODY, fontSize: 15, color: BAUHAUS.ink, marginBottom: 6 },
  strong: { fontFamily: FONT },
});
