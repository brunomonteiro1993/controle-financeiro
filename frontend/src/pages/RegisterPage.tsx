import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function RegisterPage() {
  const { signUp, session, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await signUp(fullName.trim(), email.trim(), password);
      setMessage(
        'Conta criada! Se a confirmação de e-mail estiver ativa no Supabase, verifique sua caixa de entrada.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <p className="font-display text-4xl font-bold text-brand">SISFIN</p>
        <p className="mt-2 text-muted">Crie sua conta e comece a organizar o mês.</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl border border-line bg-white/90 p-6 shadow-lg shadow-teal-900/5"
      >
        <Input
          label="Nome"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          hint="Mínimo de 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm text-ok">{message}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Criando…' : 'Criar conta'}
        </Button>

        <p className="text-center text-sm text-muted">
          Já tem conta?{' '}
          <Link className="font-semibold text-brand hover:underline" to="/login">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
