import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const RATES_CACHE_KEY = 'exchange_rates_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface RatesCache {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string; // ISO string
}

export class ExchangeRateService {
  private static instance: ExchangeRateService;

  private constructor() {}

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  // Fetch from API and save to cache
  async fetchAndCache(baseCurrency: string): Promise<RatesCache | null> {
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.result === 'success') {
        const cacheData: RatesCache = {
          base: baseCurrency,
          rates: data.rates,
          fetchedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(`${RATES_CACHE_KEY}_${baseCurrency}`, JSON.stringify(cacheData));
        return cacheData;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      return null;
    }
  }

  // Load from cache
  async loadFromCache(baseCurrency: string): Promise<RatesCache | null> {
    try {
      const cachedString = await AsyncStorage.getItem(`${RATES_CACHE_KEY}_${baseCurrency}`);
      if (cachedString) {
        return JSON.parse(cachedString) as RatesCache;
      }
      return null;
    } catch (error) {
      console.error('Failed to load exchange rates from cache:', error);
      return null;
    }
  }

  // Main method: load cache, if stale or missing fetch from API
  async getRates(baseCurrency: string): Promise<RatesCache | null> {
    const cachedData = await this.loadFromCache(baseCurrency);
    const now = new Date().getTime();

    if (cachedData) {
      const fetchedAt = new Date(cachedData.fetchedAt).getTime();
      const isStale = now - fetchedAt > CACHE_TTL_MS;

      if (!isStale) {
        return cachedData;
      }
    }

    // If cache is missing or stale, try to fetch
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      const newData = await this.fetchAndCache(baseCurrency);
      if (newData) return newData;
    }

    // Fallback to stale cache if offline or fetch failed
    return cachedData;
  }

  // Refresh only if online
  async refreshIfOnline(baseCurrency: string): Promise<void> {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      await this.fetchAndCache(baseCurrency);
    }
  }

  // Convert amount from one currency to another
  convert(amount: number, from: string, to: string, rates: Record<string, number>): number {
    if (from === to) return amount;
    
    // If 'from' is the base currency (rates are relative to 'from')
    if (rates[to]) {
        return amount * rates[to];
    }
    
    // If we need to cross-calculate (this requires rates based on a common denominator,
    // usually if this happens it means 'rates' are base USD or similar. But since we fetch based on 'from',
    // rates[to] should exist. Just in case it's not base 'from':
    if (rates[from] && rates[to]) {
        const amountInBase = amount / rates[from];
        return amountInBase * rates[to];
    }

    return amount; // Fallback
  }

  // Get all available currency codes from rates
  getCurrencies(rates: Record<string, number>): string[] {
    return Object.keys(rates).sort();
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();
