import { Tabs } from "expo-router";
import { View } from "react-native";
import { BAUHAUS, FONT } from "../../theme";

const square = (color: string) => () => (
  <View style={{ width: 10, height: 10, backgroundColor: color }} />
);

/** Native bottom tabs — mirrors the web M1 bar. */
export default function TabsLayout() {
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
      <Tabs.Screen name="index" options={{ title: "FEED", tabBarIcon: square(BAUHAUS.red) }} />
      <Tabs.Screen name="groups" options={{ title: "GROUPS", tabBarIcon: square(BAUHAUS.blue) }} />
      <Tabs.Screen name="events" options={{ title: "EVENTS", tabBarIcon: square(BAUHAUS.yellow) }} />
      <Tabs.Screen name="account" options={{ title: "ACCOUNT", tabBarIcon: square(BAUHAUS.red) }} />
    </Tabs>
  );
}
