import React, { useEffect, useState, useMemo } from 'react';
import { View, TouchableOpacity, ActivityIndicator, FlatList, Modal, StyleSheet } from 'react-native';
import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedText from '@/components/ui/text';
import ThemedView from '@/components/ui/view';
import Card from '@/components/ui/card';
import TextInput from '@/components/ui/text-input';
import { useTheme } from '@/contexts/theme-context';
import { useAppStore } from '@/stores/app-store';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { exchangeRateService } from '@/services/exchange-rate.service';
import NetInfo from '@react-native-community/netinfo';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const CURRENCY_NAMES: Record<string, { name: string; flag: string }> = {
  XOF: { name: 'Franc CFA (BCEAO)', flag: 'CFA' },
  XAF: { name: 'Franc CFA (BEAC)', flag: 'CFA' },
  USD: { name: 'Dollar US', flag: '🇺🇸' },
  EUR: { name: 'Euro', flag: '🇪🇺' },
  GBP: { name: 'Livre Sterling', flag: '🇬🇧' },
  NGN: { name: 'Naira', flag: '🇳🇬' },
  GHS: { name: 'Cedi', flag: '🇬🇭' },
  MAD: { name: 'Dirham marocain', flag: '🇲🇦' },
  DZD: { name: 'Dinar algérien', flag: '🇩🇿' },
  TND: { name: 'Dinar tunisien', flag: '🇹🇳' },
  KES: { name: 'Shilling kényan', flag: '🇰🇪' },
  ZAR: { name: 'Rand sud-africain', flag: '🇿🇦' },
  EGP: { name: 'Livre égyptienne', flag: '🇪🇬' },
  ETB: { name: 'Birr éthiopien', flag: '🇪🇹' },
  RWF: { name: 'Franc rwandais', flag: '🇷🇼' },
  UGX: { name: 'Shilling ougandais', flag: '🇺🇬' },
  TZS: { name: 'Shilling tanzanien', flag: '🇹🇿' },
  MXN: { name: 'Peso mexicain', flag: '🇲🇽' },
  BRL: { name: 'Réal brésilien', flag: '🇧🇷' },
  INR: { name: 'Roupie indienne', flag: '🇮🇳' },
  CNY: { name: 'Yuan chinois', flag: '🇨🇳' },
  JPY: { name: 'Yen japonais', flag: '🇯🇵' },
  AED: { name: 'Dirham des EAU', flag: '🇦🇪' },
  SAR: { name: 'Riyal saoudien', flag: '🇸🇦' },
  CAD: { name: 'Dollar canadien', flag: '🇨🇦' },
  AUD: { name: 'Dollar australien', flag: '🇦🇺' },
  CHF: { name: 'Franc suisse', flag: '🇨🇭' },
};

const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'XOF', 'XAF', 'MAD', 'NGN', 'DZD'];

export default function CurrencyConverter() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  
  const defaultCurrency = currentAccount?.currency || 'XOF';
  
  const [sourceCurrency, setSourceCurrency] = useState(defaultCurrency);
  const [targetCurrency, setTargetCurrency] = useState(defaultCurrency === 'EUR' ? 'USD' : 'EUR');
  
  const [amount, setAmount] = useState('100');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Picker state
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'source' | 'target'>('source');

  const fetchRates = async (base: string) => {
    setIsLoading(true);
    const state = await NetInfo.fetch();
    setIsOffline(!state.isConnected);
    
    const data = await exchangeRateService.getRates(base);
    if (data) {
      setRates(data.rates);
      setAvailableCurrencies(exchangeRateService.getCurrencies(data.rates));
      setLastUpdated(new Date(data.fetchedAt));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRates(sourceCurrency);
  }, [sourceCurrency]);

  const handleSwap = () => {
    setSourceCurrency(targetCurrency);
    setTargetCurrency(sourceCurrency);
  };

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setAmount('0');
    } else if (key === 'DEL') {
      setAmount(amount.length > 1 ? amount.slice(0, -1) : '0');
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount(amount + '.');
    } else {
      setAmount(amount === '0' ? key : amount + key);
    }
  };

  const filteredCurrencies = useMemo(() => {
    const list = availableCurrencies.length > 0 ? availableCurrencies : Object.keys(CURRENCY_NAMES);
    return list.filter(c => {
      const name = CURRENCY_NAMES[c]?.name || c;
      return c.toLowerCase().includes(searchQuery.toLowerCase()) || name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [availableCurrencies, searchQuery]);

  const convertedAmount = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const result = exchangeRateService.convert(numAmount, sourceCurrency, targetCurrency, rates);
    return result.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [amount, sourceCurrency, targetCurrency, rates]);

  const openPicker = (target: 'source' | 'target') => {
    setPickerTarget(target);
    setIsPickerVisible(true);
  };

  const selectCurrency = (currency: string) => {
    if (pickerTarget === 'source') {
      if (currency === targetCurrency) handleSwap();
      else setSourceCurrency(currency);
    } else {
      if (currency === sourceCurrency) handleSwap();
      else setTargetCurrency(currency);
    }
    setIsPickerVisible(false);
  };

  const renderKey = (key: string) => (
    <TouchableOpacity
      key={key}
      style={{
        flex: 1,
        aspectRatio: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        margin: 2,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
      onPress={() => handleKeyPress(key)}
    >
      <ThemedText style={{ fontSize: 24, fontWeight: '600' }}>
        {key === 'DEL' ? <Ionicons name="backspace-outline" size={24} color={theme.colors.foreground} /> : key}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <ThemedView style={{ flexDirection: 'row', alignItems: 'center', padding: theme.spacing.lg, justifyContent: 'space-between' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.card,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        <ThemedText variant="lg" weight="bold">Conversion</ThemedText>
        <TouchableOpacity
          onPress={() => fetchRates(sourceCurrency)}
          disabled={isLoading}
          style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons name="refresh" size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </ThemedView>

      <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>
        {/* Status bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
          {isOffline && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.destructive + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Ionicons name="cloud-offline" size={14} color={theme.colors.destructive} style={{ marginRight: 4 }} />
              <ThemedText style={{ fontSize: 12, color: theme.colors.destructive }}>Hors ligne</ThemedText>
            </View>
          )}
          {lastUpdated && (
             <ThemedText style={{ fontSize: 12, color: theme.colors.mutedForeground }}>
             Mis à jour {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: fr })}
           </ThemedText>
          )}
        </View>

        {/* Conversion Card */}
        <Card style={{ padding: theme.spacing.md, marginBottom: theme.spacing.md }}>
          {/* Source */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <TouchableOpacity 
              onPress={() => openPicker('source')}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.muted, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}
            >
              <ThemedText style={{ fontSize: 18, marginRight: 8 }}>{CURRENCY_NAMES[sourceCurrency]?.flag || '🌍'}</ThemedText>
              <ThemedText weight="bold" style={{ fontSize: 18, marginRight: 4 }}>{sourceCurrency}</ThemedText>
              <Ionicons name="chevron-down" size={16} color={theme.colors.foreground} />
            </TouchableOpacity>
            
            
            <ThemedText 
              weight="bold" 
              style={{ fontSize: 28, color: theme.colors.foreground, flex: 1, textAlign: 'right', marginLeft: 8 }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {amount}
            </ThemedText>
          </View>

          {/* Divider with Swap */}
          <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={handleSwap}
              style={{ 
                position: 'absolute',
                backgroundColor: theme.colors.primary, 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                justifyContent: 'center', 
                alignItems: 'center',
                borderWidth: 3,
                borderColor: theme.colors.card
              }}
            >
              <Ionicons name="swap-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Target */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm }}>
            <TouchableOpacity 
              onPress={() => openPicker('target')}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.muted, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}
            >
              <ThemedText style={{ fontSize: 18, marginRight: 8 }}>{CURRENCY_NAMES[targetCurrency]?.flag || '🌍'}</ThemedText>
              <ThemedText weight="bold" style={{ fontSize: 18, marginRight: 4 }}>{targetCurrency}</ThemedText>
              <Ionicons name="chevron-down" size={16} color={theme.colors.foreground} />
            </TouchableOpacity>
            
            <ThemedText 
              weight="bold" 
              style={{ fontSize: 28, color: theme.colors.primary, flex: 1, textAlign: 'right', marginLeft: 8 }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {isLoading ? '...' : convertedAmount}
            </ThemedText>
          </View>
        </Card>

        {/* Popular currencies */}
        <ThemedText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>Populaires</ThemedText>
        <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md }}>
          <FlatList 
            horizontal
            showsHorizontalScrollIndicator={false}
            data={POPULAR_CURRENCIES}
            keyExtractor={item => item}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => setTargetCurrency(item)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: item === targetCurrency ? theme.colors.primary : theme.colors.card,
                  borderRadius: 20,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: item === targetCurrency ? theme.colors.primary : theme.colors.border,
                }}
              >
                <ThemedText style={{ 
                  color: item === targetCurrency ? '#fff' : theme.colors.foreground,
                  fontWeight: item === targetCurrency ? 'bold' : 'normal'
                }}>
                  {item}
                </ThemedText>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Keyboard */}
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: theme.spacing.md }}>
          <View style={{ flexDirection: 'row' }}>
            {['7', '8', '9'].map(renderKey)}
          </View>
          <View style={{ flexDirection: 'row' }}>
            {['4', '5', '6'].map(renderKey)}
          </View>
          <View style={{ flexDirection: 'row' }}>
            {['1', '2', '3'].map(renderKey)}
          </View>
          <View style={{ flexDirection: 'row' }}>
            {['C', '0', '.'].map(renderKey)}
          </View>
          <View style={{ flexDirection: 'row', marginTop: 2 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                aspectRatio: 3,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.colors.destructive,
                margin: 2,
                borderRadius: theme.borderRadius.lg,
              }}
              onPress={() => handleKeyPress('DEL')}
            >
              <Ionicons name="backspace-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Currency Picker Modal */}
      <Modal
        visible={isPickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
            <ThemedText variant="lg" weight="bold">Choisir une devise</ThemedText>
            <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
              <Ionicons name="close-circle" size={28} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm }}>
            <TextInput
              style={{
                backgroundColor: theme.colors.muted,
                color: theme.colors.foreground,
                padding: theme.spacing.sm,
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
              }}
              placeholder="Rechercher une devise..."
              placeholderTextColor={theme.colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={filteredCurrencies}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  selectCurrency(item);
                  setSearchQuery('');
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <ThemedText style={{ fontSize: 20, marginRight: 12, width: 24, textAlign: 'center' }}>
                  {CURRENCY_NAMES[item]?.flag || '🌍'}
                </ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText weight="bold" style={{ fontSize: 14 }}>{item}</ThemedText>
                  <ThemedText style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>
                    {CURRENCY_NAMES[item]?.name || item}
                  </ThemedText>
                </View>
                {(item === sourceCurrency || item === targetCurrency) && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
