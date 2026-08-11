import { Check, Circle, X } from 'lucide-react';
import {
  getPasswordStrength,
  strengthMeta,
  type PasswordStrength,
} from '../../lib/password';

type Props = {
  password: string;
  confirm: string;
};

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={`inline-flex items-center gap-1.5 text-xs transition ${
        ok ? 'text-ok' : 'text-muted'
      }`}
    >
      {ok ? <Check size={13} /> : <Circle size={13} />}
      {label}
    </li>
  );
}

export function PasswordHints({ password, confirm }: Props) {
  const strength: PasswordStrength = getPasswordStrength(password);
  const hasMin = password.length >= 6;
  const hasConfirm = confirm.length > 0;
  const match = hasConfirm && password === confirm;

  return (
    <div className="space-y-3 rounded-2xl border border-line/80 bg-paper/70 p-3.5">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted">Força da senha</span>
          {strength !== 'empty' ? (
            <span
              className={`text-xs font-semibold ${
                strength === 'strong'
                  ? 'text-ok'
                  : strength === 'medium'
                    ? 'text-accent'
                    : 'text-danger'
              }`}
            >
              {strengthMeta[strength].label}
            </span>
          ) : (
            <span className="text-xs text-muted">Digite a senha</span>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              strength === 'empty' ? 'w-0' : strengthMeta[strength].bar
            } ${strength === 'empty' ? '' : strengthMeta[strength].width}`}
          />
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        <Rule ok={hasMin} label="Mínimo 6 caracteres" />
        <Rule ok={/[A-Z]/.test(password) && /[a-z]/.test(password)} label="Maiúsculas e minúsculas" />
        <Rule ok={/\d/.test(password)} label="Número" />
      </ul>

      {hasConfirm ? (
        <p
          className={`inline-flex items-center gap-1.5 text-xs font-semibold transition ${
            match ? 'text-ok' : 'text-danger'
          }`}
        >
          {match ? <Check size={14} /> : <X size={14} />}
          {match ? 'As senhas coincidem' : 'As senhas não coincidem'}
        </p>
      ) : (
        <p className="text-xs text-muted">Confirme a senha para validar.</p>
      )}
    </div>
  );
}
