import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { session, loading, isPasswordRecovery } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Carregando sessão…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (isPasswordRecovery && location.pathname !== '/redefinir-senha') {
    return <Navigate to="/redefinir-senha" replace />;
  }

  return <Outlet />;
}
