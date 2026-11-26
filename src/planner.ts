export const frequencies = {
  twice: 'Twice a month', monthly: 'Monthly', weekly: 'Weekly', biweekly: 'Every two weeks',
};
export const currencies = {
  PHP: 'Philippine peso (₱)', USD: 'US dollar ($)', EUR: 'Euro (€)', GBP: 'British pound (£)',
};
export const categories = ['Electricity', 'Internet', 'Housing', 'Water', 'Credit', 'Subscription', 'Other'] as const;
export type Category = typeof categories[number];
export type Frequency = keyof typeof frequencies;
export type Currency = keyof typeof currencies;

export interface Settings {
  salary: number; // Amounts are stored in the currency's minor unit.
  currency: Currency;
  frequency: Frequency;
  first: number;
  second: number;
  anchor: string;
}

export interface Bill {
  id: string;
  name: string;
  category: Category;
  amount: number;
  due: string;
  paidOn: string | null;
}

export interface Plan {
  settings: Settings;
  bills: Bill[];
}

const dayMs = 86_400_000;
const iso = (date: Date) => date.toISOString().slice(0, 10);
const dateOf = (value: string) => new Date(value + 'T00:00:00Z');

export function today() {
  const d = new Date();
  return iso(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
}

export function shift(value: string, days: number) {
  return iso(new Date(dateOf(value).getTime() + days * dayMs));
}

function distance(a: string, b: string) {
  return Math.round((dateOf(b).getTime() - dateOf(a).getTime()) / dayMs);
}

export function period(settings: Settings, on: string) {
  if (settings.frequency === 'weekly' || settings.frequency === 'biweekly') {
    const interval = settings.frequency === 'weekly' ? 7 : 14;
    const offset = ((distance(settings.anchor, on) % interval) + interval) % interval;
    const start = shift(on, -offset);
    return { start, next: shift(start, interval) };
  }

  const base = dateOf(on);
  const days = settings.frequency === 'twice' ? [settings.first, settings.second] : [settings.first];
  const dates: string[] = [];
  for (const offset of [-1, 0, 1]) {
    const month = base.getUTCMonth() + offset;
    const year = base.getUTCFullYear();
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    for (const day of days) dates.push(iso(new Date(Date.UTC(year, month, Math.min(day, last)))));
  }
  dates.sort();
  const boundary = dates.findIndex(date => date > on);
  return { start: dates[boundary - 1], next: dates[boundary] };
}

export function dueOrder(a: Bill, b: Bill) {
  return a.due.localeCompare(b.due) || a.id.localeCompare(b.id);
}

export function calculate({ settings, bills }: Plan, on: string) {
  const cycle = period(settings, on);
  const paid = bills.filter(b => b.paidOn && b.paidOn >= cycle.start && b.paidOn < cycle.next)
    .reduce((sum, bill) => sum + bill.amount, 0);
  const queue = bills.filter(b => !b.paidOn && b.due < cycle.next).sort(dueOrder);
  const budget = Math.max(0, settings.salary - paid);
  let available = budget;
  let required = 0;
  const covered = new Set<string>();
  for (const bill of queue) {
    required += bill.amount;
    if (bill.amount <= available) {
      available -= bill.amount;
      covered.add(bill.id);
    }
  }
  return { ...cycle, paid, queue, covered, required, available, allocated: budget - available };
}

export type Cutoff = ReturnType<typeof calculate>;

export function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return dateOf(date).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
}

export const shortDate = (d: string) => formatDate(d, { month: 'short', day: 'numeric' });
export const periodLabel = (c: Cutoff) => shortDate(c.start) + ' – ' + shortDate(shift(c.next, -1));

export function money(cents: number, currency: Currency) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency, minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2,
  }).format(cents / 100);
}

function ordinal(day: number) {
  return day + (day >= 11 && day <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][day % 10] ?? 'th'));
}

export function scheduleText(s: Settings) {
  if (s.frequency === 'twice') return ordinal(s.first) + ' & ' + (s.second === 31 ? 'month-end' : ordinal(s.second));
  if (s.frequency === 'monthly') return s.first === 31 ? 'Month-end' : ordinal(s.first) + ' of each month';
  return frequencies[s.frequency] + ' · ' + formatDate(s.anchor, { weekday: 'short' });
}

export function priority(bill: Bill, on: string) {
  if (bill.paidOn) return ['paid', 'Paid'] as const;
  const days = distance(on, bill.due);
  if (days < 0) return ['urgent', 'Overdue'] as const;
  if (days === 0) return ['urgent', 'Due today'] as const;
  if (days <= 2) return ['urgent', 'Urgent'] as const;
  if (days <= 7) return ['soon', 'Due soon'] as const;
  return ['later', 'Upcoming'] as const;
}
