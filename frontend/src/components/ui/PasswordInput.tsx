import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  hint?: string;
  status?: 'default' | 'ok' | 'error';
};

const statusBorder = {
  default: 'border-line focus:border-brand focus:ring-brand/20',
  ok: 'border-emerald-300 focus:border-ok focus:ring-ok/20',
  error: 'border-red-300 focus:border-danger focus:ring-danger/20',
};

export function PasswordInput({
  label,
  hint,
  status = 'default',
  className = '',
  id,
  ...props
}: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = id || props.name || label;

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-11 text-ink outline-none transition focus:ring-2 ${statusBorder[status]} ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:bg-paper hover:text-ink"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
