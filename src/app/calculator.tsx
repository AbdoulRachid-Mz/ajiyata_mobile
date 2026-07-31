import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

// Components
import SafeAreaView from "@/components/ui/safe-area-view";
import ThemedView from "@/components/ui/view";
import ThemedText from "@/components/ui/text";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

// Contexts & Hooks
import { useTheme } from "@/contexts/theme-context";
import { useLocalStorage } from "@/hooks/use-local-storage"; // Ton hook local storage

interface CalculationHistory {
  id: string;
  expression: string;
  result: string;
  date: string;
}

export default function Calculator() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();

  // Storage local pour conserver l'historique
  const { storedValue: storedHistory, setValue: setStoredHistory } =
    useLocalStorage<CalculationHistory[]>("calc_history", []);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Équations & Affichages
  const [expression, setExpression] = useState("");
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  useEffect(() => {
    if (storedHistory) {
      setHistory(storedHistory);
    }
  }, [storedHistory]);

  const saveToHistory = (expr: string, res: string) => {
    const newItem: CalculationHistory = {
      id: Date.now().toString(),
      expression: expr,
      result: res,
      date: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Garde uniquement les 5 derniers calculs
    const updatedHistory = [newItem, ...history].slice(0, 5);
    setHistory(updatedHistory);
    setStoredHistory(updatedHistory);
  };

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setExpression("");
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const calculate = (val1: number, val2: number, op: string): number => {
    switch (op) {
      case "+":
        return val1 + val2;
      case "-":
        return val1 - val2;
      case "×":
        return val1 * val2;
      case "÷":
        return val2 !== 0 ? val1 / val2 : 0;
      default:
        return val2;
    }
  };

  const handleOperator = (op: string) => {
    const currentValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(currentValue);
      setExpression(`${currentValue} ${op}`);
    } else if (operator && !waitingForOperand) {
      const result = calculate(prevValue, currentValue, operator);
      setDisplay(String(result));
      setPrevValue(result);
      setExpression(`${result} ${op}`);
    } else {
      setExpression(`${prevValue} ${op}`);
    }

    setOperator(op);
    setWaitingForOperand(true);
  };

  const handlePercent = () => {
    const currentValue = parseFloat(display);
    if (prevValue !== null && operator) {
      // Pourcentage relatif (Ex: 200 - 15% calculé en 200 - (200 * 0.15))
      const percentVal = (prevValue * currentValue) / 100;
      setDisplay(String(percentVal));
    } else {
      // Pourcentage simple (Ex: 50% = 0.5)
      setDisplay(String(currentValue / 100));
    }
  };

  const handleEquals = () => {
    if (prevValue === null || operator === null) return;
    const currentValue = parseFloat(display);
    const result = calculate(prevValue, currentValue, operator);

    const fullExpression = `${prevValue} ${operator} ${currentValue}`;
    const resultStr = String(Number(result.toFixed(6))); // Évite les imprécisions JS (ex: 0.1+0.2)

    setExpression(`${fullExpression} =`);
    setDisplay(resultStr);

    // Sauvegarde de l'historique
    saveToHistory(fullExpression, resultStr);

    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleSelectHistoryItem = (item: CalculationHistory) => {
    setDisplay(item.result);
    setExpression(item.expression);
    setWaitingForOperand(true);
    setShowHistory(false);
  };

  const buttons = [
    ["C", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "⌫", "="],
  ];

  const getButtonStyle = (btn: string) => {
    const isOperator = ["+", "-", "×", "÷", "="].includes(btn);
    const isAction = ["C", "±", "%", "⌫"].includes(btn);

    return {
      backgroundColor: isOperator
        ? theme.colors.primary
        : isAction
          ? theme.colors.muted
          : theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      flex: 1,
      height: 68,
      justifyContent: "center",
      alignItems: "center",
      margin: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    };
  };

  const getTextColor = (btn: string) => {
    if (["+", "-", "×", "÷", "="].includes(btn))
      return theme.colors.primaryForeground;
    if (["C", "⌫", "±", "%"].includes(btn)) return theme.financialColors.income;
    return theme.colors.foreground;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={{ flex: 1, padding: theme.spacing.md }}>
        {/* Header avec action Historique */}
        <ThemedView
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: theme.spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.foreground}
              />
            </Button>
            <ThemedText
              variant="xl"
              weight="bold"
              style={{ marginLeft: theme.spacing.xs }}
            >
              {t("calculator.title")}
            </ThemedText>
          </View>

          <Button
            variant="ghost"
            size="sm"
            onPress={() => setShowHistory(true)}
          >
            <Ionicons
              name="time-outline"
              size={24}
              color={theme.colors.foreground}
            />
          </Button>
        </ThemedView>

        {/* Écran d'affichage Pro (Expression + Résultat) */}
        <Card
          style={{
            backgroundColor: theme.colors.muted,
            borderRadius: theme.borderRadius.xl,
            paddingVertical: theme.spacing.lg,
            paddingHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.md,
            alignItems: "flex-end",
            minHeight: 120,
            justifyContent: "center",
          }}
        >
          {/* Ligne supérieur : Expression tapée (3 + 4) */}
          <ThemedText
            variant="sm"
            style={{
              marginBottom: 4,
              height: 20,
              color: theme.colors.foreground,
            }}
          >
            {expression}
          </ThemedText>

          {/* Ligne inférieure : Grand Résultat */}
          <ThemedText
            variant="4xl"
            weight="bold"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {display}
          </ThemedText>
        </Card>

        {/* Clavier Numérique */}
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {buttons.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              {row.map((btn) => (
                <TouchableOpacity
                  key={btn}
                  activeOpacity={0.7}
                  style={getButtonStyle(btn) as any}
                  onPress={() => {
                    if (btn === "C") handleClear();
                    else if (btn === "⌫") handleDelete();
                    else if (["+", "-", "×", "÷"].includes(btn))
                      handleOperator(btn);
                    else if (btn === "=") handleEquals();
                    else if (btn === ".") handleDecimal();
                    else if (btn === "±")
                      setDisplay(String(-parseFloat(display)));
                    else if (btn === "%") handlePercent();
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

        {/* Modal d'historique (5 derniers calculs) */}
        <Modal
          visible={showHistory}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowHistory(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText variant="lg" weight="bold">
                  Historique Récent
                </ThemedText>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.foreground}
                  />
                </TouchableOpacity>
              </View>

              {history.length === 0 ? (
                <View
                  style={{ padding: theme.spacing.xl, alignItems: "center" }}
                >
                  <ThemedText
                    style={{ color: theme.colors.muted }}
                    variant="sm"
                  >
                    Aucun calcul récent
                  </ThemedText>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 300 }}>
                  {history.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.historyItem,
                        { borderBottomColor: theme.colors.border },
                      ]}
                      onPress={() => handleSelectHistoryItem(item)}
                    >
                      <View>
                        <ThemedText
                          variant="xs"
                          style={{ color: theme.colors.muted }}
                        >
                          {item.date}
                        </ThemedText>
                        <ThemedText variant="sm">{item.expression}</ThemedText>
                      </View>
                      <ThemedText
                        variant="lg"
                        weight="bold"
                        style={{ color: theme.colors.primary }}
                      >
                        = {item.result}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {history.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  style={{ marginTop: theme.spacing.md }}
                  onPress={() => {
                    setHistory([]);
                    setStoredHistory([]);
                  }}
                >
                  Effacer l'historique
                </Button>
              )}
            </View>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});
