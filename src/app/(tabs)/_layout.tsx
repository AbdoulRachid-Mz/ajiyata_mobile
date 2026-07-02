import { Tabs } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import ThemedText from '@/components/ui/text';

import { Animated as RNAnimated } from 'react-native';
import { useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/ui-store';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();
  const { isTabBarVisible } = useUIStore();
  const translateY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(translateY, {
      toValue: isTabBarVisible ? 0 : 150,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isTabBarVisible]);

  return (
    <RNAnimated.View style={[
      styles.tabBar, 
      { 
        backgroundColor: theme.colors.background,
        borderTopColor: 'transparent',
        transform: [{ translateY }],
        shadowColor: theme.colors.foreground,
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        let iconName = 'ellipse-outline';
        if (route.name === 'dashboard') iconName = isFocused ? 'home' : 'home-outline';
        if (route.name === 'transactions') iconName = isFocused ? 'list' : 'list-outline';
        if (route.name === 'budgets') iconName = isFocused ? 'pie-chart' : 'pie-chart-outline';
        if (route.name === 'settings') iconName = isFocused ? 'settings' : 'settings-outline';
        if (route.name === 'about') iconName = isFocused ? 'information-circle' : 'information-circle-outline';

        const color = isFocused ? theme.colors.primary : theme.colors.mutedForeground;

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
            <View style={[styles.iconContainer, isFocused && { backgroundColor: theme.colors.primary + '20', borderRadius: theme.spacing.md }]}>
              <Ionicons name={iconName as any} size={24} color={color} />
            </View>
            <ThemedText 
              style={{ fontSize: 10, color: color, marginTop: 4, fontWeight: isFocused ? '600' : '400' }}
            >
              {label as string}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </RNAnimated.View>
  );
}

export default function TabsLayout() {
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
          title: 'Accueil',
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'À propos',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 70 : 65,
    paddingBottom: Platform.OS === 'ios' ? 10 : 5,
    borderTopWidth: 0,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 25,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  }
});
