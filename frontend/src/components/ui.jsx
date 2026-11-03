export function Card({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {title && <div className="card-title">{title}</div>}
      {children}
    </div>
  );
}

export function StatGrid({ items }) {
  return (
    <div className="stats stats-3">
      {items.map((it, i) => (
        <div className="stat" key={i}>
          <div className="stat-label">{it.label}</div>
          <div className="stat-value">{it.value}</div>
          {it.note && <div className="stat-note" style={it.noteStyle}>{it.note}</div>}
          {it.bar !== undefined && (
            <div className="prog-outer">
              <div className="prog-inner" style={{ width: `${it.bar}%`, background: it.barColor || 'var(--green)' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function Badge({ tone = 'gray', children }) {
  const cls = { green: 'b-green', amber: 'b-amber', red: 'b-red', blue: 'b-blue', gray: 'b-gray' }[tone] || 'b-gray';
  return <span className={`badge ${cls}`}>{children}</span>;
}

export function Notice({ tone = 'blue', children }) {
  const cls = { green: 'notice-green', red: 'notice-red', amber: 'notice-amber', blue: 'notice-blue' }[tone] || 'notice-blue';
  return <div className={`notice ${cls}`}>{children}</div>;
}

export function Spinner() {
  return <span className="spinner" />;
}

export function Avatar({ name, size = 'md' }) {
  const initials = (name || '')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return <div className={`av ${size === 'lg' ? 'av-lg' : ''}`}>{initials || '--'}</div>;
}

export function ProgressBar({ pct, color = 'var(--green)' }) {
  return (
    <div className="prog-outer">
      <div className="prog-inner" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// A plain date input, but constrained to "today through 30 days from now"
// so nobody can accidentally book a session in the past or too far out.
export function DateField({ value, onChange, label = 'Date' }) {
  const today = new Date();
  const max = new Date();
  max.setDate(max.getDate() + 30);
  const toIso = (d) => d.toISOString().slice(0, 10);
  return (
    <div className="field">
      <label className="label">{label}</label>
      <input
        className="input"
        type="date"
        min={toIso(today)}
        max={toIso(max)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Bookable up to 30 days ahead.</div>
    </div>
  );
}

// Reusable free/busy slot grid used by Mentee/Mentor booking & reschedule flows.
export function SlotGrid({ slots, selected, onPick }) {
  return (
    <div className="slot-grid">
      {slots.map((slot) => {
        const isSelected = selected && selected.time === slot.time;
        const cls = slot.busy ? 'slot busy' : `slot free${isSelected ? ' selected' : ''}`;
        return (
          <div key={slot.time} className={cls} onClick={() => !slot.busy && onPick(slot)}>
            <b>{slot.label}</b>
            <span>{slot.busy ? 'Busy' : 'Both free'}</span>
          </div>
        );
      })}
    </div>
  );
}

// 5-star clickable rating row.
export function StarRow({ value, onChange }) {
  return (
    <div className="star-rate">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={i < value ? 'lit' : ''} onClick={() => onChange(i + 1)}>
          ★
        </span>
      ))}
    </div>
  );
}

// 6-digit OTP entry with auto-advance.
export function OtpBoxes({ value, onChange }) {
  const digits = value.split('');
  while (digits.length < 6) digits.push('');
  function handleChange(i, v) {
    const next = digits.slice();
    next[i] = v.slice(-1);
    onChange(next.join('').slice(0, 6));
    if (v && i < 5) {
      const el = document.getElementById(`otp-box-${i + 1}`);
      if (el) el.focus();
    }
  }
  return (
    <div className="otp-boxes">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-box-${i}`}
          className="otp-box"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
        />
      ))}
    </div>
  );
}
