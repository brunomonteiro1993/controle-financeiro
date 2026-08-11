import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, LogOut, Receipt, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

const links = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/renda', label: 'Renda', icon: Wallet },
  { to: '/gastos', label: 'Gastos', icon: Receipt },
];

export function AppShell() {
  const { profile, signOut } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight text-brand">
            SISFIN
          </p>
          <p className="text-sm text-muted">
            Olá, {profile?.fullName || profile?.email || 'usuário'}
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white/80 p-1.5 shadow-sm">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-muted hover:bg-paper hover:text-ink'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <Button type="button" variant="secondary" onClick={() => void signOut()}>
          <LogOut size={16} />
          Sair
        </Button>
      </header>

      <main className="flex-1 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
