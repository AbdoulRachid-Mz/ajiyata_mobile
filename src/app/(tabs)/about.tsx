// src/app/(tabs)/about.tsx

import { Image } from "@/components/ui";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Drawer from "@/components/ui/drawer";
import SafeAreaView from "@/components/ui/safe-area-view";
import ScrollView from "@/components/ui/scroll-view";
import ThemedText from "@/components/ui/text";
import { useTheme } from "@/contexts/theme-context";
import { useUIStore } from "@/stores/ui-store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Clipboard,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Share,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION || "2.0.0";

export default function AboutScreen() {
  const { theme } = useTheme();
  const { setTabBarVisible } = useUIStore();
  const { t } = useTranslation();
  const lastScrollY = useRef(0);
  const router = useRouter();

  const [isSupportDrawerOpen, setIsSupportDrawerOpen] = useState(false);

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
    Linking.openURL("mailto:rashwrightmz@gmail.com");
  };

  const handleOpenContact = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleCopyNumber = (num: string) => {
    Clipboard.setString(num);
    Toast.show({
      type: "success",
      text1: t("about.support_copied"),
    });
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: "Découvrez Ajiya Ta - L'application de gestion financière personnelle simple et puissante !",
        title: "Ajiya Ta",
      });
    } catch (e) {
      console.error("Error sharing app:", e);
    }
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
          <Image
            source={require("@/assets/primary.png")}
            style={{ width: "100%", height: 215, borderRadius: 12 }}
          />
          <ThemedText variant="sm" color="mutedForeground" style={{ marginTop: 8 }}>
            {t("about.version")} {APP_VERSION}
          </ThemedText>
        </View>

        {/* Description App */}
        <Card
          style={{ padding: theme.spacing.md, marginBottom: theme.spacing.lg }}
        >
          <ThemedText
            variant="lg"
            weight="semibold"
            style={{ marginBottom: theme.spacing.sm }}
          >
            {t("about.app_description_title")}
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            {t("about.app_description")}
          </ThemedText>
        </Card>


        {/* Développeur */}
        <Card
          style={{ padding: theme.spacing.md, marginBottom: theme.spacing.lg }}
        >
          <ThemedText
            variant="lg"
            weight="semibold"
            style={{ marginBottom: theme.spacing.sm }}
          >
            {t("about.developer")}
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
                {t("about.developer_role")}
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
            onPress={() => handleOpenContact("+22796021553")}
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

                {/* Bouton Nous soutenir (Support Us CTA) */}
        <Card
          style={{
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
            backgroundColor: theme.colors.primary + "15",
            borderColor: theme.colors.primary + "40",
            borderWidth: 1,
          }}
        >
          <View style={{ flexDirection: "row",justifyContent: "center", alignItems: "center", marginBottom: theme.spacing.xs }}>
            <Ionicons name="heart" size={24} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <ThemedText variant="lg" weight="bold" style={{ color: theme.colors.primary }}>
              {t("about.support_button")}
            </ThemedText>
          </View>
          <ThemedText variant="sm" color="mutedForeground" style={{ marginBottom: theme.spacing.md }}>
            {t("about.support_desc")}
          </ThemedText>
          <Button
            variant="default"
            size="md"
            isFullWidth
            onPress={() => setIsSupportDrawerOpen(true)}
            style={{ borderRadius: theme.borderRadius.lg }}
          >
            <Ionicons name="heart-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <ThemedText weight="bold" style={{ color: "#fff" }}>
              {t("about.support_button")}
            </ThemedText>
          </Button>
        </Card>

        {/* Legal */}
        <Card
          style={{ padding: theme.spacing.md, marginBottom: theme.spacing.lg }}
        >
          <ThemedText
            variant="lg"
            weight="semibold"
            style={{ marginBottom: theme.spacing.md }}
          >
            {t("about.legal")}
          </ThemedText>

          <TouchableOpacity
            onPress={() => router.push("/privacy")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: theme.spacing.sm,
            }}
          >
            <ThemedText>{t("about.privacy_policy")}</ThemedText>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={theme.colors.mutedForeground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/terms")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: theme.spacing.sm,
            }}
          >
            <ThemedText>{t("about.terms_of_use")}</ThemedText>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={theme.colors.mutedForeground}
            />
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Drawer Nous Soutenir */}
      <Drawer
        visible={isSupportDrawerOpen}
        onClose={() => setIsSupportDrawerOpen(false)}
      >
        <View style={{ padding: theme.spacing.lg }}>
          <View style={{ alignItems: "center", marginBottom: theme.spacing.md }}>
            <Ionicons name="heart-circle" size={56} color={theme.colors.primary} />
            <ThemedText variant="xl" weight="bold" style={{ marginTop: 8 }}>
              {t("about.support_title")}
            </ThemedText>
            <ThemedText
              variant="sm"
              color="mutedForeground"
              style={{ textAlign: "center", marginTop: 4, paddingHorizontal: 16 }}
            >
              {t("about.support_desc")}
            </ThemedText>
          </View>

          {/* Option Mobile Money */}
          <Card
            style={{
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
              backgroundColor: theme.colors.muted + "40",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <ThemedText weight="semibold" variant="base">
                  {t("about.support_mobile_money")}
                </ThemedText>
                <ThemedText variant="xs" color="mutedForeground">
                  {t("about.support_mobile_money_desc")}
                </ThemedText>
                <ThemedText weight="bold" style={{ marginTop: 6, color: theme.colors.primary, fontSize: 16 }}>
                  +227 96 02 15 53
                </ThemedText>
              </View>
              <Button
                variant="outline"
                size="sm"
                onPress={() => handleCopyNumber("+22796021553")}
              >
                <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
              </Button>
            </View>
          </Card>

          {/* Option Partage */}
          <TouchableOpacity
            onPress={handleShareApp}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.lg,
              backgroundColor: theme.colors.muted + "20",
              marginBottom: theme.spacing.lg,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="share-social-outline" size={22} color={theme.colors.primary} style={{ marginRight: 12 }} />
              <ThemedText weight="semibold">
                {t("about.support_share_app")}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedForeground} />
          </TouchableOpacity>

          <ThemedText
            variant="xs"
            color="mutedForeground"
            style={{ textAlign: "center", fontStyle: "italic" }}
          >
            {t("about.support_thanks")}
          </ThemedText>
        </View>
      </Drawer>
    </SafeAreaView>
  );
}
