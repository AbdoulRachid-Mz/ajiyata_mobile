// src/app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { useTheme } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import ThemedText from "@/components/ui/text";
import { useDailyReminders } from "@/hooks/use-daily-reminders";
import { Animated as RNAnimated } from "react-native";
import { useEffect, useRef } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useTranslation } from "react-i18next";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();
  const { isTabBarVisible } = useUIStore();
  const { t } = useTranslation();
  const translateY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(translateY, {
      toValue: isTabBarVisible ? 0 : 150,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isTabBarVisible]);

  // Mapping des noms de routes vers les clés de traduction
  const routeToKey: Record<string, string> = {
    dashboard: "tabs.home",
    transactions: "tabs.transactions",
    budgets: "tabs.budgets",
    goals: "tabs.goals",
    settings: "tabs.settings",
    about: "tabs.about",
  };

  // Mapping des noms de routes vers les icônes
  const routeToIcon: Record<string, { focused: string; unfocused: string }> = {
    dashboard: { focused: "home", unfocused: "home-outline" },
    transactions: { focused: "list", unfocused: "list-outline" },
    budgets: { focused: "pie-chart", unfocused: "pie-chart-outline" },
    goals: { focused: "trophy", unfocused: "trophy-outline" },
    settings: { focused: "settings", unfocused: "settings-outline" },
    about: { focused: "information-circle", unfocused: "information-circle-outline" },
  };

  return (
    <RNAnimated.View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.background,
          borderTopColor: "transparent",
          transform: [{ translateY }],
          shadowColor: theme.colors.foreground,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        const iconData = routeToIcon[route.name] || { focused: "ellipse", unfocused: "ellipse-outline" };
        const iconName = isFocused ? iconData.focused : iconData.unfocused;
        const label = routeToKey[route.name] ? t(routeToKey[route.name]) : route.name;

        const color = isFocused
          ? theme.colors.primary
          : theme.colors.mutedForeground;

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={(options as any).tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <View
              style={[
                styles.iconContainer,
                isFocused && {
                  backgroundColor: theme.colors.primary + "20",
                  borderRadius: theme.spacing.md,
                },
              ]}
            >
              <Ionicons name={iconName as any} size={24} color={color} />
            </View>
            <ThemedText
              weight={isFocused ? "semibold" : "medium"}
              style={{
                fontSize: 10,
                color: color,
                marginTop: 4,
              }}
            >
              {label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </RNAnimated.View>
  );
}

export default function TabsLayout() {
  // Appeler les hooks ici une seule fois
  useDailyReminders();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "tabs.home",
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "tabs.transactions",
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "tabs.budgets",
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "tabs.goals",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "tabs.settings",
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "tabs.about",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 90 : 85,
    paddingBottom: Platform.OS === "ios" ? 10 : 5,
    borderTopWidth: 0,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 8,
  },
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
});