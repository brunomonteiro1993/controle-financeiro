import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Moon,
  Receipt,
  RefreshCw,
  Target,
  Sun,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';

const links = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/renda', label: 'Receitas', icon: Wallet },
  { to: '/gastos', label: 'Gastos', icon: Receipt },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/recorrentes', label: 'Recorrentes', icon: RefreshCw },
];

export function AppShell() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

        <nav className="flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-line bg-surface/80 p-1.5 shadow-sm sm:gap-2">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition sm:gap-2 sm:px-3.5 sm:text-sm ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-muted hover:bg-paper hover:text-ink'
                }`
              }
            >
              <Icon size={16} />
              <span className="hidden xs:inline sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="!px-3"
            aria-label="Alternar tema"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <Button type="button" variant="secondary" onClick={() => void signOut()}>
            <LogOut size={16} />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
