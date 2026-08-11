import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { PasswordHints } from '../components/ui/PasswordHints';
import { passwordsMatch } from '../lib/password';

export function RegisterPage() {
  const { signUp, session, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const match = useMemo(
    () => passwordsMatch(password, confirm),
    [password, confirm]
  );
  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    match &&
    !submitting;

  if (!loading && session) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

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
      await signUp(fullName.trim(), email.trim(), password);
      setMessage(
        'Conta criada! Se a confirmação de e-mail estiver ativa no Supabase, verifique sua caixa de entrada.'
      );
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar.');
    } finally {
      setSubmitting(false);
    }
  }

  const confirmStatus =
    confirm.length === 0 ? 'default' : match ? 'ok' : 'error';

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-7 text-center">
        <p className="font-display text-4xl font-bold text-brand">SISFIN</p>
        <p className="mt-2 text-muted">
          Crie sua conta e comece a organizar o mês em poucos segundos.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl border border-line bg-white/90 p-6 shadow-lg shadow-teal-900/5 md:p-7"
      >
        <div className="flex items-start gap-3 rounded-2xl bg-brand-soft/70 px-3.5 py-3">
          <span className="mt-0.5 rounded-xl bg-white p-2 text-brand shadow-sm">
            <Sparkles size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Cadastro rápido</p>
            <p className="text-xs text-muted">
              Sua renda e gastos ficam separados por usuário, com segurança.
            </p>
          </div>
        </div>

        <Input
          label="Nome"
          required
          autoComplete="name"
          placeholder="Como você quer ser chamado"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordInput
          label="Senha"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Crie uma senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordInput
          label="Confirmar senha"
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
        {message ? (
          <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm text-ok">{message}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {submitting ? 'Criando conta…' : 'Criar minha conta'}
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
