import { useEffect, useLayoutEffect, useState } from 'react';
import { BillList } from './BillList';
import type { Filter, Sort } from './BillList';
import { Overview, ScheduleDetails } from './CutoffSummary';
import { BillEditor, ScheduleEditor } from './Editors';
import { Icon } from './Icon';
import { calculate, formatDate, installments, period, today } from './planner';
import type { Bill, Plan } from './planner';
import { loadPlan, planStorageKey } from './storage';
import { lockPlannerZoom } from './plannerViewport';

const pages = {
  overview: ['Overview', 'Your paycheck and upcoming bills at a glance.'],
  bills: ['All bills', 'Manage due dates, amounts, and payments.'],
  schedule: ['Pay schedule', 'Set the paydays that fund your bills.'],
} as const;

function currentPage(): keyof typeof pages {
  const name = location.hash.slice(1);
  return name === 'bills' || name === 'schedule' ? name : 'overview';
}

type Editor = { type: 'bill'; bill?: Bill } | { type: 'schedule' } | null;

export function App({ userId }: { userId: string }) {
  useLayoutEffect(lockPlannerZoom, []);
  const storageKey = planStorageKey(userId);
  const [plan, setPlan] = useState(() => loadPlan(storageKey));
  const [page, setPage] = useState(currentPage);
  const [on, setOn] = useState(today);
  const [editor, setEditor] = useState<Editor>(null);
  const [filter, setFilter] = useState<Filter>('Unpaid');
  const [sort, setSort] = useState<Sort>('priority');
  const [notice, setNotice] = useState<{ text: string } | null>(null);

  useEffect(() => {
    function navigate() { setPage(currentPage()); window.scrollTo(0, 0); }
    const refreshDate = () => setOn(today());
    window.addEventListener('hashchange', navigate);
    window.addEventListener('focus', refreshDate);
    return () => {
      window.removeEventListener('hashchange', navigate);
      window.removeEventListener('focus', refreshDate);
    };
  }, []);

  // Anchor the sample bill dates on the first visit, even before the user edits them.
  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === null) localStorage.setItem(storageKey, JSON.stringify(plan));
    } catch { /* Keep the plan available in memory. */ }
  }, [plan, storageKey]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3900);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const { settings } = plan;
  const bills = installments(plan.bills, period(settings, on).next);
  const cutoff = calculate({ settings, bills }, on);
  const editSchedule = () => setEditor({ type: 'schedule' });
  const editBill = (bill: Bill) => setEditor({ type: 'bill', bill });

  function commit(next: Plan, message: string) {
    setPlan(next);
    setEditor(null);
    setOn(today());
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice({ text: message });
    } catch {
      setNotice({ text: 'Changes apply to this session. Browser storage is unavailable.' });
    }
  }

  function saveBill(bill: Bill) {
    const exists = bills.some(b => b.id === bill.id);
    const updated = exists ? bills.map(b => b.id === bill.id ? bill : b) : [...bills, bill];
    if (!exists) setFilter('Unpaid');
    commit({ settings, bills: updated }, exists ? 'Bill updated.' : 'Bill added.');
  }

  function togglePaid(bill: Bill) {
    const paidOn = bill.paidOn ? null : today();
    const updated = bills.map(b => b.id === bill.id ? { ...b, paidOn } : b);
    commit({ settings, bills: updated }, paidOn ? 'Bill marked as paid.' : 'Bill marked as unpaid.');
  }

  return (
    <>
      <header><div className="bar">
        <a className="brand" href="#overview" aria-label="BillWise overview"><img width="42" height="42" src="/icons/billsort-192.png" alt="" />BillWise</a>
        <nav aria-label="Main navigation">
          {Object.entries(pages).map(([name, [title]]) =>
            <a key={name} href={'#' + name} aria-current={page === name ? 'page' : undefined}>{title}</a>)}
          <a href="#account">Account</a>
        </nav>
        <span className="today"><Icon name="calendar" />{formatDate(on, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div></header>
      <main key={page} className="page-enter">
        <div className="heading">
          <div><h1>{pages[page][0]}</h1><p>{pages[page][1]}</p></div>
          <button className="primary" onClick={() => setEditor({ type: 'bill' })}><Icon name="plus" />Add bill</button>
        </div>
        {page === 'overview' && <Overview settings={settings} cutoff={cutoff} onEdit={editSchedule} />}
        {page === 'schedule'
          ? <ScheduleDetails settings={settings} cutoff={cutoff} onEdit={editSchedule} />
          : <BillList title={page === 'overview' ? 'Bill queue' : 'Bill list'} bills={bills} cutoff={cutoff} currency={settings.currency}
              today={on} filter={filter} sort={sort} onEdit={editBill} onFilter={setFilter}
              onToggleSort={() => setSort(previous => previous === 'priority' ? 'amount' : 'priority')} />}
      </main>
      {editor?.type === 'schedule' && <ScheduleEditor settings={settings} onClose={() => setEditor(null)}
        onSave={updated => commit({ bills, settings: updated }, 'Pay schedule updated.')} />}
      {editor?.type === 'bill' && <BillEditor bill={editor.bill} today={on} cutoff={cutoff} currency={settings.currency}
        onSave={saveBill} onClose={() => setEditor(null)} onTogglePaid={togglePaid}
        onDelete={bill => commit({ settings, bills: bills.filter(b => b.id !== bill.id) }, 'Bill deleted.')} />}
      <div id="toast" role="status">{notice?.text}</div>
    </>
  );
}
