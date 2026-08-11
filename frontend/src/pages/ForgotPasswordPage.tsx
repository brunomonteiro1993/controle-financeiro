import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setMessage(
        'Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha. Verifique também a pasta de spam.'
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível enviar o e-mail.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <p className="font-display text-4xl font-bold text-brand">SISFIN</p>
        <p className="mt-2 text-muted">Recupere o acesso à sua conta.</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl border border-line bg-white/90 p-6 shadow-lg shadow-teal-900/5"
      >
        <p className="text-sm text-muted">
          Informe o e-mail da sua conta. Enviaremos um link para criar uma nova
          senha.
        </p>

        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm text-ok">{message}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Enviando…' : 'Enviar link de recuperação'}
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
