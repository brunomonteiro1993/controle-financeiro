import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function ResetPasswordPage() {
  const { session, loading, isPasswordRecovery, updatePassword, clearPasswordRecovery } =
    useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (password !== confirm) {
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

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <p className="font-display text-4xl font-bold text-brand">SISFIN</p>
        <p className="mt-2 text-muted">Defina sua nova senha.</p>
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

        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Mínimo de 6 caracteres"
        />
        <Input
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
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
