import SafeAreaView from "@/components/ui/safe-area-view";
import ScrollView from "@/components/ui/scroll-view";
import ThemedText from "@/components/ui/text";
import Card from "@/components/ui/card";
import { useTheme } from "@/contexts/theme-context";
import {
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUIStore } from "@/stores/ui-store";
import { useRef } from "react";

export default function AboutScreen() {
  const { theme } = useTheme();
  const { setTabBarVisible } = useUIStore();
  const lastScrollY = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    if (currentScrollY < 0) return;
    if (currentScrollY > lastScrollY.current + 10) {
      setTabBarVisible(false);
    } else if (currentScrollY < lastScrollY.current - 10) {
      setTabBarVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const handleOpenEmail = () => {
    Linking.openURL("mailto:rashwrightmz@gmail.com"); // Using the email from settings
  };

  const handleOpenTwitter = () => {
    Linking.openURL("https://twitter.com/"); // Fallback twitter URL
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: 120,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View
          style={{
            alignItems: "center",
            marginBottom: theme.spacing.xl,
            marginTop: theme.spacing.lg,
          }}
        >
          <LinearGradient
            colors={[theme.colors.primary + "20", theme.colors.primary + "05"]}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: theme.spacing.md,
            }}
          >
            <Ionicons name="wallet" size={50} color={theme.colors.primary} />
          </LinearGradient>
          <ThemedText variant="2xl" weight="bold">
            Ajiya Ta
          </ThemedText>
          <ThemedText variant="sm" color="mutedForeground">
            Version 1.0.0
          </ThemedText>
        </View>

        <Card
          style={{ padding: theme.spacing.md, marginBottom: theme.spacing.lg }}
        >
          <ThemedText
            variant="lg"
            weight="semibold"
            style={{ marginBottom: theme.spacing.sm }}
          >
            À propos de l'application
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Ajiya Ta est votre assistant financier personnel, conçu pour vous
            aider à gérer vos revenus, vos dépenses, et à atteindre vos
            objectifs d'épargne. L'application est construite avec une
            philosophie "offline-first" pour vous assurer un accès à vos données
            à tout moment.
          </ThemedText>
        </Card>

        <Card
          style={{ padding: theme.spacing.md, marginBottom: theme.spacing.lg }}
        >
          <ThemedText
            variant="lg"
            weight="semibold"
            style={{ marginBottom: theme.spacing.sm }}
          >
            Développeur
          </ThemedText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons
              name="person-circle-outline"
              size={40}
              color={theme.colors.primary}
              style={{ marginRight: 12 }}
            />
            <View>
              <ThemedText weight="semibold" variant="base">
                Abdoul Rachid
              </ThemedText>
              <ThemedText variant="sm" color="mutedForeground">
                Developpeur web & mobile
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleOpenEmail}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 8,
            }}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={theme.colors.primary}
              style={{ marginRight: 12 }}
            />
            <ThemedText>rashwrightmz@gmail.com</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 8,
            }}
          >
            <Ionicons
              name="call-outline"
              size={20}
              color={theme.colors.primary}
              style={{ marginRight: 12 }}
            />
            <ThemedText>+227 96021553</ThemedText>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
