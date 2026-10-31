import { useEffect, useId, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

export function Card({ title, subtitle, icon, actions, children, className }: {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('rounded-2xl border border-slate-200 bg-surface shadow-sm', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            {icon && <div className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-600">{icon}</div>}
            <div>
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Hint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <Info className="h-3.5 w-3.5 cursor-help text-slate-400" aria-label={text} />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-60 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal leading-snug text-slate-50 shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  );
}

function Label({ htmlFor, label, hint }: { htmlFor: string; label: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {hint && <Hint text={hint} />}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-400';

const parse = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'));

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  prefix,
  suffix,
  hint,
  disabled,
  compact,
  className,
  ariaLabel,
}: {
  label?: ReactNode;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const id = useId();
  const [text, setText] = useState(String(value));
  const [error, setError] = useState<string | null>(null);

  // Sincroniza cuando el valor cambia desde afuera (cargar ejemplo, cambiar tipo...).
  useEffect(() => {
    if (parse(text) !== value) {
      setText(String(value));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handle = (raw: string) => {
    setText(raw);
    if (raw.trim() === '') {
      setError('Requerido');
      return;
    }
    const n = parse(raw);
    if (!Number.isFinite(n)) return setError('Número inválido');
    if (min !== undefined && n < min) return setError(`Mínimo ${min}`);
    if (max !== undefined && n > max) return setError(`Máximo ${max}`);
    setError(null);
    onChange(n);
  };

  return (
    <div className={className}>
      {label && <Label htmlFor={id} label={label} hint={hint} />}
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>}
        <input
          id={id}
          aria-label={ariaLabel}
          inputMode="decimal"
          type="text"
          value={text}
          disabled={disabled}
          step={step}
          onChange={(e) => handle(e.target.value)}
          onBlur={() => {
            if (error) {
              setText(String(value));
              setError(null);
            }
          }}
          className={cx(
            inputCls,
            compact && 'px-2 py-1.5 text-right',
            prefix && (prefix.length > 2 ? 'pl-12' : 'pl-8'),
            suffix && 'pr-12',
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300',
          )}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder, type = 'text', hint, className }: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} label={label} hint={hint} />
      <input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cx(inputCls, 'border-slate-300')} />
    </div>
  );
}

export function TextArea({ label, value, onChange, rows = 3, placeholder, className }: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} label={label} />
      <textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cx(inputCls, 'border-slate-300')} />
    </div>
  );
}

export function Select<T extends string>({ value, onChange, options, ariaLabel, className }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value as T)} className={cx(inputCls, 'border-slate-300 py-1.5', className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Segmented<T extends string>({ value, onChange, options, size = 'md' }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string; disabled?: boolean }[];
  size?: 'sm' | 'md';
}) {
  return (
    <div role="radiogroup" className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.hint}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
            value === o.value ? 'bg-surface text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function OptionCards<T extends string>({ value, onChange, options, columns = 'sm:grid-cols-4' }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint: string; extra?: string }[];
  columns?: string;
}) {
  return (
    <div className={cx('grid grid-cols-2 gap-2', columns)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cx(
            'rounded-xl border p-3 text-left transition',
            value === o.value ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-900">{o.label}</span>
            {o.extra && <span className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">{o.extra}</span>}
          </div>
          <p className="mt-1 text-xs leading-snug text-slate-500">{o.hint}</p>
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-5 w-9 shrink-0 rounded-full transition', checked ? 'bg-indigo-600' : 'bg-slate-300')}
      >
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition', checked ? 'left-[18px]' : 'left-0.5')} />
      </button>
      <span className="flex items-center gap-1.5">
        {label}
        {hint && <Hint text={hint} />}
      </span>
    </label>
  );
}

export function Button({ children, onClick, variant = 'secondary', icon, className, type = 'button', title }: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  title?: string;
}) {
  const styles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-surface text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'text-rose-600 hover:bg-rose-50',
  }[variant];
  return (
    <button type={type} title={title} onClick={onClick} className={cx('inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition', styles, className)}>
      {icon}
      {children}
    </button>
  );
}

export function Stat({ label, value, sub, tone = 'default', icon }: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'indigo' | 'emerald' | 'amber';
  icon?: ReactNode;
}) {
  const tones = {
    default: 'bg-surface',
    indigo: 'bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-700 text-white border-transparent',
    emerald: 'bg-surface',
    amber: 'bg-surface',
  }[tone];
  const dark = tone === 'indigo';
  return (
    <div className={cx('rounded-2xl border border-slate-200 p-4 shadow-sm', tones)}>
      <div className={cx('flex items-center gap-2 text-xs font-medium uppercase tracking-wide', dark ? 'text-indigo-100' : 'text-slate-500')}>
        {icon}
        {label}
      </div>
      <div className={cx('mt-2 text-2xl font-bold tabular-nums', dark ? 'text-white' : 'text-slate-900')}>{value}</div>
      {sub && <div className={cx('mt-1 text-xs', dark ? 'text-indigo-100' : 'text-slate-500')}>{sub}</div>}
    </div>
  );
}
