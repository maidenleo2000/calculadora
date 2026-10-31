import { createContext, useContext } from 'react';
import type { Currency, CurrencySettings } from '../types';
import { convert } from './calc';

export interface Money {
  /** Moneda en la que se muestran los resultados. */
  currency: Currency;
  /** Formatea un monto expresado en moneda base. */
  fmt: (baseAmount: number, decimals?: number) => string;
  /** Formatea un monto en una moneda específica (sin convertir). */
  raw: (amount: number, currency: Currency, decimals?: number) => string;
  toDisplay: (baseAmount: number) => number;
}

export function formatCurrency(amount: number, currency: Currency, decimals = 0) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(n: number, decimals = 1) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: decimals }).format(Number.isFinite(n) ? n : 0);
}

export function makeMoney(c: CurrencySettings): Money {
  const converted = convert(1, c.base, c.display, c.arsPerUsd);
  // Si falta la cotización se muestra en moneda base.
  const currency = converted === null ? c.base : c.display;
  const toDisplay = (v: number) => (converted === null ? v : v * converted);
  return {
    currency,
    toDisplay,
    fmt: (v, d = 0) => formatCurrency(toDisplay(v), currency, d),
    raw: (v, cur, d = 0) => formatCurrency(v, cur, d),
  };
}

export const MoneyContext = createContext<Money>(makeMoney({ base: 'USD', display: 'USD', arsPerUsd: null, rateNote: '' }));
export const useMoney = () => useContext(MoneyContext);
