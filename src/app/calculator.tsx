import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Components
import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedView from '@/components/ui/view';
import ThemedText from '@/components/ui/text';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';

// Theme
import { useTheme } from '@/contexts/theme-context';
import { ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function Calculator() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();

  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const calculate = (val1: number, val2: number, op: string): number => {
    switch (op) {
      case '+':
        return val1 + val2;
      case '-':
        return val1 - val2;
      case '×':
        return val1 * val2;
      case '÷':
        return val2 !== 0 ? val1 / val2 : 0;
      default:
        return val2;
    }
  };

  const handleOperator = (op: string) => {
    const currentValue = parseFloat(display);
    if (prevValue === null) {
      setPrevValue(currentValue);
    } else if (operator) {
      const result = calculate(prevValue, currentValue, operator);
      setDisplay(String(result));
      setPrevValue(result);
    }
    setOperator(op);
    setWaitingForOperand(true);
  };

  const handleEquals = () => {
    if (prevValue === null || operator === null) return;
    const currentValue = parseFloat(display);
    const result = calculate(prevValue, currentValue, operator);
    setDisplay(String(result));
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '⌫', '='],
  ];

  const getButtonStyle = (btn: string) => {
    const isNumber = !isNaN(parseInt(btn));
    const isOperator = ['+', '-', '×', '÷', '='].includes(btn);
    const isAction = ['C', '±', '%', '⌫'].includes(btn);

    return {
      backgroundColor: isOperator
        ? theme.colors.primary
        : isAction
        ? theme.colors.muted
        : theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      flex: btn === '0' ? 2 : 1,
      height: 72,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    };
  };

  const getTextColor = (btn: string) => {
    if (btn === '=') return theme.colors.primaryForeground;
    if (['+', '-', '×', '÷'].includes(btn)) return theme.colors.primaryForeground;
    if (['C', '⌫', '±', '%'].includes(btn)) return theme.financialColors.income;
    return theme.colors.foreground;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={{ flex: 1, padding: theme.spacing.lg }}>
        {/* Header */}
        <ThemedView style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </Button>
          <ThemedText variant="xl" weight="bold" style={{ marginLeft: theme.spacing.md }}>
            {t('calculator.title')}
          </ThemedText>
        </ThemedView>

        {/* Display */}
        <Card style={{ 
          backgroundColor: theme.colors.muted, 
          borderRadius: theme.borderRadius.xl, 
          paddingVertical: theme.spacing.xl, 
          paddingHorizontal: theme.spacing.lg, 
          marginBottom: theme.spacing.lg,
          alignItems: 'flex-end'
        }}>
          <ThemedText variant="4xl" weight="bold" style={{ marginBottom: theme.spacing.xs }}>
            {display}
          </ThemedText>
        </Card>

        {/* Buttons */}
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {buttons.map((row, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: 'row' }}>
              {row.map((btn) => (
                <TouchableOpacity
                  key={btn}
                  style={getButtonStyle(btn) as ViewStyle}
                  onPress={() => {
                    if (btn === 'C') handleClear();
                    else if (btn === '⌫') handleDelete();
                    else if (['+', '-', '×', '÷'].includes(btn)) handleOperator(btn);
                    else if (btn === '=') handleEquals();
                    else if (btn === '.') handleDecimal();
                    else if (btn === '±') setDisplay(String(-parseFloat(display)));
                    else if (btn === '%') setDisplay(String(parseFloat(display) / 100));
                    else handleNumber(btn);
                  }}
                >
                  <ThemedText 
                    variant="2xl" 
                    weight="semibold" 
                    style={{ color: getTextColor(btn) }}
                  >
                    {btn}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}
