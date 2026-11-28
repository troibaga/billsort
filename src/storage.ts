import { categories, currencies, frequencies, shift, today } from './planner';
import type { Bill, Category, Plan, Settings } from './planner';

export function planStorageKey(userId: string) {
  return 'billsort.plan.v1.user.' + userId;
}

function sample(): Plan {
  const now = today();
  const entries: [string, Category, number, number][] = [
    ['Electricity bill', 'Electricity', 2450, 0], ['Home internet', 'Internet', 1699, 1],
    ['Water bill', 'Water', 680, 3], ['Credit card', 'Credit', 3200, 5],
    ['Apartment rent', 'Housing', 7000, 8], ['Streaming plan', 'Subscription', 399, 11],
  ];
  return {
    settings: { salary: 1800000, currency: 'PHP', frequency: 'twice', first: 15, second: 31, anchor: now },
    bills: entries.map(([name, category, amount, days], i) => ({
      id: 'sample-' + i, name, category, amount: amount * 100, due: shift(now, days), paidOn: null,
    })),
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function date(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function payday(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 31;
}

function validSettings(s: unknown): s is Settings {
  return record(s) && typeof s.salary === 'number' && Number.isSafeInteger(s.salary) && s.salary >= 0
    && (s.incomeSources === undefined || (Array.isArray(s.incomeSources) && s.incomeSources.every(source =>
      record(source) && typeof source.id === 'string' && typeof source.name === 'string' && source.name.trim() !== ''
      && typeof source.amount === 'number' && Number.isSafeInteger(source.amount) && source.amount > 0)))
    && typeof s.currency === 'string' && Object.hasOwn(currencies, s.currency)
    && typeof s.frequency === 'string' && Object.hasOwn(frequencies, s.frequency)
    && payday(s.first) && payday(s.second) && date(s.anchor);
}

function validBill(b: unknown): b is Bill {
  return record(b) && typeof b.id === 'string' && typeof b.name === 'string'
    && categories.some(c => c === b.category) && typeof b.amount === 'number' && Number.isSafeInteger(b.amount)
    && date(b.due) && (b.paidOn === null || date(b.paidOn))
    && (b.monthly === undefined || (record(b.monthly) && payday(b.monthly.day)
      && typeof b.monthly.seriesId === 'string'
      && (b.monthly.until === undefined || date(String(b.monthly.until) + '-01'))));
}

export function loadPlan(storageKey: string): Plan {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw !== null) {
      const data: unknown = JSON.parse(raw);
      if (record(data) && validSettings(data.settings) && Array.isArray(data.bills) && data.bills.every(validBill)) {
        return { settings: data.settings, bills: data.bills };
      }
    }
  } catch { /* Storage may be unavailable in private browsing. */ }
  return sample();
}
