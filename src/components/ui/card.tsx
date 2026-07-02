// @/components/ui/card.tsx
import { createContext, useContext } from 'react';
import { View, ViewStyle, StyleSheet, TouchableOpacity, TouchableOpacityProps, TextStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { useTheme } from "@/contexts/theme-context";
import ThemedText from "@/components/ui/text";

// Card Context to maintain composition pattern
interface CardContextType {
  theme: ReturnType<typeof useTheme>['theme'];
  isDark: boolean;
}

const CardContext = createContext<CardContextType | undefined>(undefined);

const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('Card compound components must be used within a Card parent component');
  }
  return context;
};

// Base Card Props
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: TouchableOpacityProps['onPress'];
  disabled?: boolean;
  activeOpacity?: number;
  animateEntry?: boolean;
  entryDelay?: number;
}

// Main Card Component
const CardRoot = ({ 
  children, 
  style, 
  onPress, 
  disabled = false,
  activeOpacity = 0.7,
  animateEntry = true,
  entryDelay = 0
}: CardProps) => {
  const { theme, isDark } = useTheme();
  
  // Animation values for smooth entry and press interactions
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Trigger entrance animation
  if (animateEntry) {
    setTimeout(() => {
      progress.value = withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      });
    }, entryDelay);
  } else {
    progress.value = 1;
  }

  const handlePressIn = () => {
    if (!disabled && onPress) {
      scale.value = withSpring(0.98, { 
        damping: 15, 
        stiffness: 300 
      });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { 
      damping: 15, 
      stiffness: 300 
    });
  };

  // Animated styles combining all animations
  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [15, 0]);
    const opacity = progress.value;
    
    return {
      opacity,
      transform: [
        { translateY },
        { scale: scale.value }
      ]
    };
  });

  const cardStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      shadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: isDark ? 4 : 3,
    },
  });

  // Use Animated.createAnimatedComponent to add animation support
  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
  const AnimatedView = Animated.createAnimatedComponent(View);

  const Container = onPress ? AnimatedTouchableOpacity : AnimatedView;
  const containerProps = onPress ? { 
    onPress, 
    disabled, 
    activeOpacity,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut
  } : {};

  return (
    <CardContext.Provider value={{ theme, isDark }}>
      <Container 
        style={[cardStyles.container, style, animatedStyle]} 
        {...containerProps}
      >
        {children}
      </Container>
    </CardContext.Provider>
  );
};

// Card Header Component
interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardHeader = ({ children, style }: CardHeaderProps) => {
  const { theme } = useCardContext();
  
  const headerStyles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });

  return <View style={[headerStyles.container, style]}>{children}</View>;
};

// Card Title Component
interface CardTitleProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

const CardTitle = ({ children, style }: CardTitleProps) => {
  const { theme } = useCardContext();
  
  return (
    <ThemedText 
      style={[
        { 
          fontSize: theme.typography.xl,
          fontWeight: '600',
          color: theme.colors.cardForeground,
        },
        style as TextStyle
      ]}
    >
      {children}
    </ThemedText>
  );
};

// Card Description Component
interface CardDescriptionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardDescription = ({ children, style }: CardDescriptionProps) => {
  const { theme } = useCardContext();
  
  return (
    <ThemedText 
      style={[
        { 
          fontSize: theme.typography.sm,
          color: theme.colors.mutedForeground,
          marginTop: theme.spacing.xs,
        },
        style as TextStyle 
      ]}
    >
      {children}
    </ThemedText>
  );
};

// Card Content Component
interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardContent = ({ children, style }: CardContentProps) => {
  const { theme } = useCardContext();
  
  const contentStyles = StyleSheet.create({
    container: {
      paddingVertical: theme.spacing.sm,
    },
  });

  return <View style={[contentStyles.container, style]}>{children}</View>;
};

// Card Footer Component
interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardFooter = ({ children, style }: CardFooterProps) => {
  const { theme } = useCardContext();
  
  const footerStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });

  return <View style={[footerStyles.container, style]}>{children}</View>;
};

type CardComponent = typeof CardRoot & {
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Description: typeof CardDescription;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
};

const Card = CardRoot as CardComponent;

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
