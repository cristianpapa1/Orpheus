import { Tabs } from "expo-router";
import { View } from "react-native";
import { BAUHAUS, FONT } from "../../theme";
import { useT } from "../../lib/i18n/context";

const square = (color: string) => {
  const TabSquare = () => (
    <View style={{ width: 10, height: 10, backgroundColor: color }} />
  );
  TabSquare.displayName = "TabSquare";
  return TabSquare;
};

/** Native bottom tabs — mirrors the web M1 bar. */
export default function TabsLayout() {
  const t = useT().tabs;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: BAUHAUS.paper },
        headerTitleStyle: { fontFamily: FONT, letterSpacing: 2 },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: BAUHAUS.paper,
          borderTopWidth: 2,
          borderTopColor: BAUHAUS.ink,
        },
        tabBarActiveTintColor: BAUHAUS.ink,
        tabBarLabelStyle: { fontFamily: FONT, fontSize: 11, letterSpacing: 1 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.feed.toUpperCase(), tabBarIcon: square(BAUHAUS.red) }} />
      <Tabs.Screen name="groups" options={{ title: t.groups.toUpperCase(), tabBarIcon: square(BAUHAUS.blue) }} />
      <Tabs.Screen name="events" options={{ title: t.events.toUpperCase(), tabBarIcon: square(BAUHAUS.yellow) }} />
      <Tabs.Screen name="jobs" options={{ title: t.jobs.toUpperCase(), tabBarIcon: square(BAUHAUS.blue) }} />
      <Tabs.Screen name="account" options={{ title: t.account.toUpperCase(), tabBarIcon: square(BAUHAUS.red) }} />
    </Tabs>
  );
}
