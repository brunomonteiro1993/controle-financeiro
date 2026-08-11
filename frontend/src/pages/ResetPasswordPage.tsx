import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { PasswordInput } from '../components/ui/PasswordInput';
import { PasswordHints } from '../components/ui/PasswordHints';
import { passwordsMatch } from '../lib/password';

export function ResetPasswordPage() {
  const { session, loading, isPasswordRecovery, updatePassword, clearPasswordRecovery } =
    useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const match = useMemo(
    () => passwordsMatch(password, confirm),
    [password, confirm]
  );
  const canSubmit = password.length >= 6 && match && !submitting;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Validando link de recuperação…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/recuperar-senha" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!match) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      clearPasswordRecovery();
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível atualizar a senha.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const confirmStatus =
    confirm.length === 0 ? 'default' : match ? 'ok' : 'error';

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <p className="font-display text-4xl font-bold text-brand">SISFIN</p>
        <p className="mt-2 text-muted">Defina sua nova senha com segurança.</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl border border-line bg-white/90 p-6 shadow-lg shadow-teal-900/5"
      >
        {!isPasswordRecovery ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-accent">
            Você já está autenticado. Pode alterar a senha abaixo.
          </p>
        ) : null}

        <PasswordInput
          label="Nova senha"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Crie uma nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordInput
          label="Confirmar nova senha"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Digite a senha novamente"
          value={confirm}
          status={confirmStatus}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <PasswordHints password={password} confirm={confirm} />

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {submitting ? 'Salvando…' : 'Salvar nova senha'}
        </Button>

        <p className="text-center text-sm text-muted">
          <Link className="font-semibold text-brand hover:underline" to="/login">
            Voltar ao login
          </Link>
        </p>
      </form>
    </div>
  );
}
