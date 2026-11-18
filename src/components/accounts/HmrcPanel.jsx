import React from 'react';
import { Button, Card } from '@/components/ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2026-07-01` → `1 Jul 2026` (fixed month names: locales disagree on September). */
const day = (iso) => {
  if (!iso) return '';
  const [year, month, date] = iso.slice(0, 10).split('-').map(Number);
  return `${date} ${MONTHS[month - 1]} ${year}`;
};

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/London' }) : '');

const STATUS = {
  accepted: 'Accepted by HMRC',
  rejected: 'Refused by HMRC',
  unknown: 'No clear answer',
  sending: 'Sending',
};

const CONFIRM = {
  record_hmrc: "Yes, record HMRC's figures and lock the months",
  close: 'Yes, close this attempt',
};

/** Staff settle an attempt with no clear answer: record what HMRC holds, or close it. Both need a second click. */
const Resolve = ({ row, busy, onResolve }) => {
  const [reason, setReason] = React.useState('');
  const [confirming, setConfirming] = React.useState(null);
  const ready = !busy && reason.trim().length > 0;
  const act = (action) => {
    if (confirming !== action) {
      setConfirming(action);
      return;
    }
    setConfirming(null);
    onResolve(row.id, action, reason.trim());
  };
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1">
        Reason
        <input
          className="rounded border border-gray-300 px-2 py-1"
          value={reason}
          maxLength={300}
          onChange={(event) => {
            setReason(event.target.value);
            setConfirming(null);
          }}
        />
      </label>
      <Button disabled={!ready} onClick={() => act('record_hmrc')}>
        {confirming === 'record_hmrc' ? CONFIRM.record_hmrc : "Record HMRC's figures"}
      </Button>
      <Button variant="secondary" disabled={!ready} onClick={() => act('close')}>
        {confirming === 'close' ? CONFIRM.close : 'Close this attempt'}
      </Button>
      {confirming && (
        <Button variant="secondary" onClick={() => setConfirming(null)}>
          Not yet
        </Button>
      )}
    </div>
  );
};

const Submission = ({ row, isStaff, busy, onCheck, onResolve }) => (
  <li className="border-t border-gray-200 py-2 first:border-t-0">
    <span className="font-medium">{row.period_key}</span> ·{' '}
    {row.error_code === 'CLOSED' ? 'Closed by staff' : (STATUS[row.status] ?? row.status)} ·{' '}
    <span className="text-gray-600">{when(row.submitted_at)}</span>
    {row.status === 'accepted' && (
      <p>
        Form bundle {row.form_bundle_number}
        {row.processing_date && `, processed ${when(row.processing_date)}`}
        {row.charge_ref_number && `, charge reference ${row.charge_ref_number}`}. Its months are locked.
        {row.error_code === 'RECORDED_FROM_HMRC' && ` ${row.error_message}`}
      </p>
    )}
    {row.status === 'rejected' && row.error_message && <p className="text-red-700">{row.error_message}</p>}
    {row.status === 'unknown' && (
      <div className="text-amber-800">
        <p className="flex flex-wrap items-center gap-2">
          {['FIGURES_DIFFER', 'NOT_RECORDED'].includes(row.error_code)
            ? row.error_message
            : 'HMRC may or may not have this return. Nothing is locked until HMRC confirms it.'}
          {isStaff && (
            <Button variant="secondary" disabled={busy} onClick={() => onCheck(row.id)}>
              Check with HMRC
            </Button>
          )}
        </p>
        {isStaff && <Resolve row={row} busy={busy} onResolve={onResolve} />}
      </div>
    )}
  </li>
);

/**
 * Filing the VAT return with HMRC (G56): connect the company, pick an open obligation (its dates fill the period
 * above, so the boxes shown are what is sent), tick the declaration and submit (a second click confirms).
 */
const HmrcPanel = ({
  status,
  obligations = [],
  submissions = [],
  isStaff,
  busy = false,
  error = null,
  onConnect,
  onDisconnect,
  onPick,
  onSubmit,
  onCheck,
  onResolve,
  period = null,
}) => {
  const [picked, setPicked] = React.useState(null);
  const [declared, setDeclared] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const open = obligations.filter((row) => row.status === 'O' && !row.filed_in_iq);
  // The boxes shown are the page's period: a pick only counts while the period is still exactly the obligation's.
  const chosen = picked && (!period || (period.start === picked.start && period.end === picked.end)) ? picked : null;

  const pick = (row) => {
    setPicked(row);
    setDeclared(false);
    setConfirming(false);
    onPick(row.start, row.end);
  };
  const submit = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onSubmit(chosen.periodKey, chosen.start, chosen.end);
  };

  return (
    <Card className="space-y-3 p-4 text-sm">
      <h3 className="text-base font-semibold">HMRC (Making Tax Digital)</h3>
      {!status.connected ? (
        <div className="flex flex-wrap items-center gap-2">
          <span>Not connected to HMRC.</span>
          {isStaff && (
            <Button disabled={busy} onClick={onConnect}>
              Connect to HMRC
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Connected: VRN {status.vrn} ({status.environment})
          </span>
          {isStaff && (
            <Button variant="secondary" disabled={busy} onClick={onDisconnect}>
              Disconnect
            </Button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {status.connected && (
        <div className="space-y-2">
          <p className="font-medium">Open VAT periods</p>
          {open.length === 0 && <p className="text-gray-600">HMRC has no open period to file.</p>}
          <ul className="flex flex-wrap gap-2">
            {open.map((row) => (
              <li key={row.periodKey} className="flex items-center gap-2">
                <Button
                  variant={chosen?.periodKey === row.periodKey ? 'primary' : 'secondary'}
                  aria-pressed={chosen?.periodKey === row.periodKey}
                  onClick={() => pick(row)}
                >
                  {day(row.start)} to {day(row.end)}
                </Button>
                <span className="text-gray-600">due {day(row.due)}</span>
              </li>
            ))}
          </ul>
          {chosen && isStaff && (
            <div className="space-y-2">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={declared}
                  onChange={(event) => {
                    setDeclared(event.target.checked);
                    setConfirming(false);
                  }}
                />
                <span>
                  When you submit this VAT information you are making a legal declaration that the information is true
                  and complete. A false declaration can result in prosecution.
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Button disabled={busy || !declared} onClick={submit}>
                  {confirming ? `Yes, submit to HMRC for ${day(chosen.start)} to ${day(chosen.end)}` : 'Submit to HMRC'}
                </Button>
                {confirming && (
                  <Button variant="secondary" onClick={() => setConfirming(false)}>
                    Not yet
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {submissions.length > 0 && (
        <div>
          <p className="font-medium">Submissions</p>
          <ul>
            {submissions.map((row) => (
              <Submission
                key={row.id}
                row={row}
                isStaff={isStaff}
                busy={busy}
                onCheck={onCheck}
                onResolve={onResolve}
              />
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default HmrcPanel;
