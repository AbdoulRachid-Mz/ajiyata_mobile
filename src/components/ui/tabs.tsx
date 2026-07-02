// @/components/ui/tabs.tsx
import { lightTheme } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
// import { useTheme } from '@/constants/theme';

// Types for Tabs component
interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
  tabs: string[];
  registerTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
};

// Tabs Root Component
interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export const Tabs = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className = "",
}: TabsProps) => {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const [tabs, setTabs] = useState<string[]>([]);

  const activeTab = value !== undefined ? value : internalTab;
  const setActiveTab = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalTab(newValue);
    }
  };

  const registerTab = (tabValue: string) => {
    setTabs((prev) => {
      if (prev.indexOf(tabValue) === -1) {
        return [...prev, tabValue];
      }
      return prev;
    });
  };

  return (
    <TabsContext.Provider
      value={{ activeTab, setActiveTab, tabs, registerTab }}
    >
      <View style={{ flex: 1 }} className={className}>
        {children}
      </View>
    </TabsContext.Provider>
  );
};

// TabsList Component
interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export const TabsList = ({ children, className = "" }: TabsListProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      style={[styles.tabsList, { backgroundColor: theme.colors.secondary }]}
      className={className}
    >
      {children}
    </View>
  );
};

// TabsTrigger Component
interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export const TabsTrigger = ({
  value,
  children,
  disabled = false,
  className = "",
}: TabsTriggerProps) => {
  const { activeTab, setActiveTab, registerTab } = useTabs()!;
  const { theme } = useTheme();
  const isActive = activeTab === value;
  const [anim] = useState(new Animated.Value(isActive ? 1 : 0));

  // Register tab on mount
  useEffect(() => {
    registerTab(value);
  }, [value]);

  // Animate when active state changes
  useEffect(() => {
    Animated.spring(anim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
  }, [isActive]);

  const handlePress = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  const styles = createStyles(theme);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[styles.tabTrigger, disabled && { opacity: 0.5 }]}
      className={className}
    >
      <Animated.View
        style={[
          styles.activeIndicator,
          {
            backgroundColor: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ["transparent", theme.colors.primary],
            }),
            transform: [
              {
                scaleX: anim,
              },
            ],
          },
        ]}
      />
      <Animated.Text
        style={[
          styles.triggerText,
          {
            color: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [
                theme.colors.mutedForeground,
                theme.colors.primaryForeground,
              ],
            }),
            fontWeight: isActive ? "600" : "400",
          },
        ]}
      >
        {children}
      </Animated.Text>
    </Pressable>
  );
};

// TabsContent Component
interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const TabsContent = ({
  value,
  children,
  className = "",
}: TabsContentProps) => {
  const { activeTab } = useTabs()!;
  const isActive = activeTab === value;
  const { theme } = useTheme();

  if (!isActive) return null;

  const styles = createStyles(theme);

  return (
    <View style={styles.tabsContent} className={className}>
      {children}
    </View>
  );
};

// Styles creator
const createStyles = (theme: typeof lightTheme) =>
  StyleSheet.create({
    tabsList: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.xs,
    },
    tabTrigger: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      position: "relative",
      overflow: "hidden",
    },
    activeIndicator: {
      position: "absolute",
      bottom: 2,
      left: "10%",
      right: "10%",
      height: 3,
      borderRadius: theme.borderRadius.full,
    },
    triggerText: {
      fontSize: theme.typography.sm,
      textAlign: "center",
    },
    tabsContent: {
      padding: theme.spacing.sm,
      flex: 1,
    },
  });
