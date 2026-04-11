export interface CurrencySettings {
  currency_name: string;
  icon_url: string;
}

export interface CurrencySettingsUpdateRequest {
  currency_name?: string;
  icon_url?: string;
}

export interface CurrencyIncomeType {
  key: string;
  name: string;
  description: string;
  is_active: boolean;
  amount: number;
}
