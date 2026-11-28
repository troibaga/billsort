import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { categories, currencies, frequencies, shortDate } from './planner';
import type { Bill, Category, Currency, Cutoff, Frequency, Settings } from './planner';

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog ref={ref} aria-labelledby="dialogTitle" onCancel={event => { event.preventDefault(); onClose(); }}>
      <div className="dialog-heading">
        <h2 id="dialogTitle">{title}</h2>
        <button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose}>×</button>
      </div>
      {children}
    </dialog>
  );
}

interface BillEditorProps {
  bill?: Bill;
  today: string;
  currency: Currency;
  cutoff: Cutoff;
  onClose: () => void;
  onSave: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
  onTogglePaid: (bill: Bill) => void;
}

function fundingHint(bill: Bill, cutoff: Cutoff) {
  if (bill.paidOn) return 'Paid on ' + shortDate(bill.paidOn) + '.';
  if (bill.due >= cutoff.next) return 'Due in a later cutoff.';
  return cutoff.covered.has(bill.id) ? 'Covered by this cutoff’s income.' : 'This cutoff has insufficient funds for this bill.';
}

export function BillEditor({ bill, today, currency, cutoff, onClose, onSave, onDelete, onTogglePaid }: BillEditorProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [monthly, setMonthly] = useState(Boolean(bill?.monthly));
  const [due, setDue] = useState(bill?.due ?? today);
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name')).trim();
    if (!name) { setError('Enter a bill name.'); return; }
    onSave({
      id: bill?.id ?? crypto.randomUUID(), name, paidOn: bill?.paidOn ?? null,
      category: data.get('category') as Category, due: String(data.get('due')),
      amount: Math.round(Number(data.get('amount')) * 100),
      monthlyInstallment: bill?.monthlyInstallment,
      monthly: monthly ? {
        seriesId: bill?.monthly?.seriesId ?? crypto.randomUUID(),
        day: bill?.monthly && due === bill.due ? bill.monthly.day : Number(due.slice(-2)),
        until: String(data.get('until') || '') || undefined,
      } : undefined,
    });
  }
  if (confirmDelete && bill) return (
    <Dialog title="Delete bill?" onClose={onClose}>
      <p>Remove {bill.name}{bill.monthly ? ' and its future monthly installments' : ''} from your plan?</p>
      <div className="action-row">
        <button className="secondary" onClick={onClose}>Cancel</button>
        <button className="danger" onClick={() => onDelete(bill)}>Delete bill</button>
      </div>
    </Dialog>
  );
  return (
    <Dialog title={bill ? 'Manage bill' : 'Add bill'} onClose={onClose}>
      <form onSubmit={submit}>
        <label>Bill name<input required name="name" maxLength={80} placeholder="e.g. Home internet" defaultValue={bill?.name} /></label>
        <label>Amount ({currency})<input required name="amount" type="number" min="0.01" max="999999999" step="0.01" inputMode="decimal" defaultValue={bill ? bill.amount / 100 : ''} /></label>
        {bill?.monthlyInstallment && <p className="fieldhint">Changes apply to this installment. Edit the latest scheduled installment to change future bills.</p>}
        <label>Bill schedule<select disabled={bill?.monthlyInstallment} value={monthly ? 'monthly' : 'once'} onChange={e => setMonthly(e.target.value === 'monthly')}>
          <option value="once">{bill?.monthlyInstallment ? 'Single monthly installment' : 'One time · specific month'}</option>
          <option value="monthly">Every month</option>
        </select></label>
        <label>{monthly ? 'First due date' : 'Due date'}<input required name="due" type="date" value={due} onChange={e => setDue(e.target.value)} /></label>
        {monthly && <>
          <label>Last month (optional)<input type="month" name="until" min={due.slice(0, 7)} defaultValue={bill?.monthly?.until} /></label>
          <p className="fieldhint">Repeats on the same day, or the last day of shorter months. Leave the last month empty to keep repeating.</p>
        </>}
        <label>Category<select name="category" defaultValue={bill?.category ?? 'Other'}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        {bill && <p className="fieldhint">{fundingHint(bill, cutoff)}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="action-row">
          {bill ? <>
            <button type="button" className="danger" onClick={() => setConfirmDelete(true)}>Delete</button>
            <button type="button" className="secondary" onClick={() => onTogglePaid(bill)}>{bill.paidOn ? 'Mark unpaid' : 'Mark paid'}</button>
          </> : <button type="button" className="secondary" onClick={onClose}>Cancel</button>}
          <button className="primary">{bill ? 'Save changes' : 'Add bill'}</button>
        </div>
      </form>
    </Dialog>
  );
}

interface ScheduleEditorProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export function ScheduleEditor({ settings, onSave, onClose }: ScheduleEditorProps) {
  const [frequency, setFrequency] = useState(settings.frequency);
  const [sources, setSources] = useState(settings.incomeSources ?? []);
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const first = Number(data.get('first') ?? settings.first);
    const second = Number(data.get('second') ?? settings.second);
    if (frequency === 'twice' && first >= second) {
      setError('Choose a second payday later than the first.');
      return;
    }
    const incomeSources = sources.map(({ id }) => ({
      id,
      name: String(data.get('source-name-' + id)).trim(),
      amount: Math.round(Number(data.get('source-amount-' + id)) * 100),
    }));
    if (incomeSources.some(source => !source.name)) {
      setError('Enter a name for each income source.');
      return;
    }
    onSave({
      incomeSources, frequency, first, second, anchor: String(data.get('anchor') ?? settings.anchor),
      currency: data.get('currency') as Currency, salary: Math.round(Number(data.get('salary')) * 100),
    });
  }
  return (
    <Dialog title="Edit pay schedule" onClose={onClose}>
      <form onSubmit={submit}>
        <label>Primary take-home salary per cutoff<input required name="salary" type="number" min="0" max="999999999" step="0.01" defaultValue={settings.salary / 100} /></label>
        <section className="other-income" aria-labelledby="other-income-title">
          <h3 id="other-income-title">Other income</h3>
          <p className="fieldhint">Add income you receive every cutoff.</p>
          {sources.map((source, index) => <fieldset key={source.id}>
            <legend>Income source {index + 1}</legend>
            <label>Source name<input name={'source-name-' + source.id} defaultValue={source.name}
              maxLength={80} placeholder="e.g. Tutoring" required /></label>
            <label>Amount per cutoff<input name={'source-amount-' + source.id} type="number" inputMode="decimal"
              min="0.01" max="999999999" step="0.01" required defaultValue={source.amount ? source.amount / 100 : ''} /></label>
            <button type="button" className="secondary" aria-label={'Remove income source ' + (index + 1)}
              onClick={() => setSources(current => current.filter(item => item.id !== source.id))}>Remove</button>
          </fieldset>)}
          <button type="button" className="secondary" onClick={() => setSources(current =>
            [...current, { id: crypto.randomUUID(), name: '', amount: 0 }])}>Add income source</button>
        </section>
        <label>Currency<select name="currency" defaultValue={settings.currency}>
          {Object.entries(currencies).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <label>Pay frequency<select name="frequency" value={frequency} onChange={e => setFrequency(e.target.value as Frequency)}>
          {Object.entries(frequencies).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        {frequency === 'weekly' || frequency === 'biweekly'
          ? <label>A known payday<input required name="anchor" type="date" defaultValue={settings.anchor} /></label>
          : <>
            <label>{frequency === 'twice' ? 'First payday of month' : 'Payday of month'}
              <input required name="first" type="number" min="1" max="31" defaultValue={settings.first} />
            </label>
            {frequency === 'twice' && <label>Second payday of month<input required name="second" type="number" min="1" max="31" defaultValue={settings.second} /></label>}
            <p className="fieldhint">Use 31 for the last day of each month.</p>
          </>}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="action-row">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary">Save schedule</button>
        </div>
      </form>
    </Dialog>
  );
}
