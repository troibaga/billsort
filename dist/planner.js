const Planner = (() => {
  const dayMs = 86400000;
  const iso = date => date.toISOString().slice(0, 10);
  const dateOf = value => new Date(value + 'T00:00:00Z');
  const shift = (value, days) => iso(new Date(+dateOf(value) + days * dayMs));
  const distance = (a, b) => Math.round((dateOf(b) - dateOf(a)) / dayMs);
  function today() {
    const d = new Date();
    return iso(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
  }
  function period(settings, on) {
    if (['weekly', 'biweekly'].includes(settings.frequency)) {
      const interval = settings.frequency === 'weekly' ? 7 : 14;
      const offset = ((distance(settings.anchor, on) % interval) + interval) % interval;
      const start = shift(on, -offset);
      return {start, next: shift(start, interval)};
    }
    const base = dateOf(on);
    const days = settings.frequency === 'twice' ? [settings.first, settings.second] : [settings.first];
    const dates = [];
    for (const offset of [-1, 0, 1]) {
      const month = base.getUTCMonth() + offset;
      const year = base.getUTCFullYear();
      const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      days.forEach(day => dates.push(iso(new Date(Date.UTC(year, month, Math.min(day, last))))));
    }
    dates.sort();
    return {start: dates.filter(d => d <= on).pop(), next: dates.find(d => d > on)};
  }
  function calculate(settings, bills, on) {
    const cycle = period(settings, on);
    const paid = bills.filter(b => b.paidOn && b.paidOn >= cycle.start && b.paidOn < cycle.next).reduce((sum, b) => sum + b.amount, 0);
    const queue = bills.filter(b => !b.paidOn && b.due < cycle.next).sort((a,b) => a.due.localeCompare(b.due) || a.id.localeCompare(b.id));
    let available = Math.max(0, settings.salary - paid);
    const covered = new Set();
    let required = 0;
    for (const bill of queue) {
      required += bill.amount;
      if (bill.amount <= available) {
        available -= bill.amount;
        covered.add(bill.id);
      }
    }
    return {...cycle, paid, queue, covered, required, available, allocated: Math.max(0, settings.salary - paid) - available};
  }
  return {today, shift, distance, dateOf, period, calculate};
})();
