import { create } from 'zustand';

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
  rate: number; // multiplier against USD base
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', label: 'USD - US Dollar', rate: 1.0, flag: '🇺🇸' },
  { code: 'INR', symbol: '₹', label: 'INR - Indian Rupee', rate: 83.5, flag: '🇮🇳' },
  { code: 'EUR', symbol: '€', label: 'EUR - Euro', rate: 0.92, flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', label: 'GBP - British Pound', rate: 0.79, flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', label: 'JPY - Japanese Yen', rate: 155.0, flag: '🇯🇵' },
];

export interface DeliveryLocation {
  city: string;
  postalCode: string;
  country: string;
  flag: string;
}

export const PRESET_LOCATIONS: DeliveryLocation[] = [
  { city: 'New York', postalCode: '10001', country: 'United States', flag: '🇺🇸' },
  { city: 'Mumbai', postalCode: '400001', country: 'India', flag: '🇮🇳' },
  { city: 'London', postalCode: 'SW1A 1AA', country: 'United Kingdom', flag: '🇬🇧' },
  { city: 'Tokyo', postalCode: '100-0001', country: 'Japan', flag: '🇯🇵' },
  { city: 'Frankfurt', postalCode: '60311', country: 'Germany', flag: '🇩🇪' },
];

interface PreferencesState {
  currency: CurrencyOption;
  location: DeliveryLocation;
  setCurrency: (code: string) => void;
  setLocation: (loc: DeliveryLocation) => void;
  formatPrice: (amountInUSD: number) => string;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  currency: SUPPORTED_CURRENCIES[0],
  location: PRESET_LOCATIONS[0],
  setCurrency: (code: string) => {
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
    set({ currency: found });
  },
  setLocation: (location: DeliveryLocation) => set({ location }),
  formatPrice: (amountInUSD: number) => {
    const { currency } = get();
    const converted = amountInUSD * currency.rate;
    if (currency.code === 'JPY') {
      return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${currency.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },
}));
