import { Icon } from './Icon';
import type { Bill, Currency, Cutoff } from './planner';
import { dueOrder, formatDate, money, periodLabel, priority } from './planner';

const appearance = {
  Electricity: ['bolt', '#fff0cc', '#ad7118'], Internet: ['wifi', '#e9e8ff', '#6656c3'],
  Housing: ['home', '#e4edf9', '#426caa'], Water: ['water', '#dff2f4', '#2a8294'],
  Credit: ['card', '#fae9ea', '#af596b'], Subscription: ['play', '#f1e8fa', '#8a58ab'],
  Other: ['receipt', '#edf0f4', '#606e82'],
} as const;

const filters = ['Unpaid', 'Paid', 'All'] as const;
export type Filter = typeof filters[number];
export type Sort = 'priority' | 'amount';

interface Props {
  title: string;
  bills: Bill[];
  cutoff: Cutoff;
  today: string;
  currency: Currency;
  filter: Filter;
  sort: Sort;
  onFilter: (filter: Filter) => void;
  onToggleSort: () => void;
  onEdit: (bill: Bill) => void;
}

export function BillList({ title, bills, cutoff, today, currency, filter, sort, onFilter, onToggleSort, onEdit }: Props) {
  const visible = bills.filter(b => filter === 'All' || (filter === 'Paid' ? !!b.paidOn : !b.paidOn))
    .sort((a, b) => Number(!!a.paidOn) - Number(!!b.paidOn)
      || (sort === 'amount' ? b.amount - a.amount : 0) || dueOrder(a, b));
  return (
    <section id="bills" aria-label="Bills"><article className="list">
      <div className="list-top">
        <div><h2>{title}</h2><p>{sort === 'priority' ? 'Earliest due dates come first.' : 'Highest amounts come first.'}</p></div>
        <button className="sort" title="Change sorting" onClick={onToggleSort}><Icon name="sort" />{sort === 'priority' ? 'Due date' : 'Amount'}</button>
      </div>
      <div className="segmented" role="group" aria-label="Filter bills">
        {filters.map(item => <button key={item} aria-pressed={filter === item} className={filter === item ? 'active' : ''} onClick={() => onFilter(item)}>{item}</button>)}
      </div>
      <div className="bill-grid table-head" aria-hidden="true">
        <span>Bill name</span><span>Due date</span><span>Priority</span><span className="money" style={{ font: 'inherit' }}>Amount</span><span />
      </div>
      {visible.map(bill => {
        const [glyph, background, color] = appearance[bill.category];
        const [status, label] = priority(bill, today);
        return (
          <div key={bill.id} className="bill-grid bill-row">
            <div className="bill-identity">
              <span className="category-icon" style={{ background, color }}><Icon name={glyph} /></span>
              <div><strong>{bill.name}</strong><small>{bill.category}{bill.monthly ? ' · Monthly schedule' : bill.monthlyInstallment ? ' · Monthly installment' : ''}</small></div>
            </div>
            <span className="date">{formatDate(bill.due, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="priority"><span className={'status ' + status}>{label}</span></span>
            <span className="money">{money(bill.amount, currency)}</span>
            <button className="row-edit" aria-label={'Manage ' + bill.name} onClick={() => onEdit(bill)}><Icon name="more" /></button>
          </div>
        );
      })}
      {visible.length === 0 && <div className="empty">
        <strong>No {filter === 'All' ? '' : filter.toLowerCase() + ' '}bills</strong>
        <p>{filter === 'Paid' ? 'Bills you mark as paid will appear here.' : 'Add a bill to plan your next payment.'}</p>
      </div>}
      <div className="list-foot">{visible.length} {visible.length === 1 ? 'bill' : 'bills'} · Current cutoff {periodLabel(cutoff)}</div>
    </article></section>
  );
}
