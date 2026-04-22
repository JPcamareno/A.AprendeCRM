import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Megaphone,
  BarChart3,
  Menu,
  X,
  Settings,
  Users,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN'] },
  { to: '/ventas', icon: ShoppingCart, label: 'Ventas', roles: ['ADMIN', 'VENDEDOR'] },
  { to: '/prospectos', icon: Users, label: 'Prospectos', roles: ['ADMIN', 'VENDEDOR'] },
  { to: '/gastos', icon: Megaphone, label: 'Gastos Publicitarios', roles: ['ADMIN'] },
  { to: '/resumen', icon: BarChart3, label: 'Resumen y Analisis', roles: ['ADMIN'] },
  { to: '/configuracion', icon: Settings, label: 'Configuracion', roles: ['ADMIN'] },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role || 'VENDEDOR')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-600 to-primary-700 transform transition-transform duration-300 lg:translate-x-0 shadow-2xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col items-center px-6 py-5 border-b border-primary-500/30">
          <div className="bg-white rounded-2xl shadow-lg px-3 py-4 w-full flex items-center justify-center">
            <svg viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg" className="h-16 w-auto">
                <text x="10" y="22" fontFamily="Arial" fontSize="11" fontWeight="bold" fill="#22c55e" letterSpacing="2">ACADEMIA</text>
                <text x="10" y="62" fontFamily="Arial" fontSize="42" fontWeight="900" fill="#1f2937" letterSpacing="-1">APR</text>
                <rect x="118" y="20" width="18" height="44" fill="#22c55e"/>
                <text x="136" y="62" fontFamily="Arial" fontSize="42" fontWeight="900" fill="#22c55e">E</text>
                <text x="158" y="62" fontFamily="Arial" fontSize="42" fontWeight="900" fill="#1f2937">NDE</text>
              </svg>
          </div>
          <p className="text-xs text-primary-200 mt-3">Sistema de Gestión de Ventas</p>
        </div>

        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white text-primary-700 shadow-lg'
                    : 'text-primary-100 hover:bg-primary-500/30 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {user && (
            <div className="px-4 py-3 bg-primary-500/30 backdrop-blur-sm rounded-xl border border-primary-400/30">
              <p className="text-xs text-primary-200 font-medium">Usuario</p>
              <p className="text-sm font-semibold text-white mt-1">{user.full_name}</p>
              <p className="text-xs text-primary-300">
                {isAdmin ? '👑 Administrador' : '👤 Vendedor'}
              </p>
            </div>
          )}
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-100 hover:bg-red-500/30 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl hover:bg-primary-50 text-primary-600 lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('es-CR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>

      <button
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'fixed top-4 right-4 z-50 p-2.5 bg-white rounded-xl shadow-xl lg:hidden transition-all',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        <X className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}