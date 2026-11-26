import { Fragment } from 'react';
import { formatDate, frequencies, money, periodLabel, scheduleText, shortDate } from './planner';
import type { Cutoff, Settings } from './planner';
import { Icon } from './Icon';

interface SummaryProps {
  cutoff: Cutoff;
  settings: Settings;
  onEdit: () => void;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

export function Overview({ cutoff, settings, onEdit }: SummaryProps) {
  return (
    <section id="summary" aria-label="Cutoff overview">
      <div className="overview-grid">
        <article className="balance">
          <div className="art" aria-hidden="true">
            <i className="wallet-back" /><i className="note" /><i className="note second" />
            <i className="wallet-front" /><i className="clasp" />
          </div>
          <div className="balance-label"><Icon name="wallet" />Cutoff balance</div>
          <div className="amount">{money(cutoff.available, settings.currency)}</div>
          <small>Available after planned bills</small>
          <div className="metrics">
            <Metric label="Cutoff salary" value={money(settings.salary, settings.currency)} />
            <Metric label="Planned payments" value={money(cutoff.allocated, settings.currency)} />
            <Metric label="Bills covered" value={cutoff.covered.size + ' of ' + cutoff.queue.length} />
          </div>
        </article>
        <article className="period">
          <div className="panel-top">
            <h2>Pay schedule</h2>
            <button className="icon-btn" aria-label="Edit pay schedule" onClick={onEdit}><Icon name="edit" /></button>
          </div>
          <div className="payday">
            <div className="date-tile" aria-hidden="true">
              <b>{formatDate(cutoff.next, { month: 'short' }).toUpperCase()}</b><strong>{Number(cutoff.next.slice(-2))}</strong>
            </div>
            <div><small>Next payday</small><h3>{formatDate(cutoff.next, { month: 'long', day: 'numeric' })}</h3></div>
          </div>
          <div className="period-line"><span>{frequencies[settings.frequency]}</span><span>{scheduleText(settings)}</span></div>
        </article>
      </div>
    </section>
  );
}

export function ScheduleDetails({ cutoff, settings, onEdit }: SummaryProps) {
  const rows = [
    ['Salary per cutoff', money(settings.salary, settings.currency)], ['Pay frequency', frequencies[settings.frequency]],
    ['Paydays', scheduleText(settings)], ['Current cutoff', periodLabel(cutoff)], ['Next payday', shortDate(cutoff.next)],
    ['Already paid this cutoff', money(cutoff.paid, settings.currency)], ['Unpaid bills due before payday', money(cutoff.required, settings.currency)],
    ['Amount still unfunded', money(cutoff.required - cutoff.allocated, settings.currency)],
  ];
  return (
    <section id="schedule" aria-label="Pay schedule"><article className="schedule-detail">
      <div className="panel-top"><h2>Salary settings</h2><button className="secondary" onClick={onEdit}><Icon name="edit" />Edit schedule</button></div>
      <dl>{rows.map(([label, value]) => <Fragment key={label}><dt>{label}</dt><dd>{value}</dd></Fragment>)}</dl>
    </article></section>
  );
}
