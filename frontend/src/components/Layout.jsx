import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Receipt, Users, Sun, Moon, LogOut, Settings as SettingsIcon, TrendingDown } from 'lucide-react';

export default function Layout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-background transition-colors duration-200">
      <aside className="w-64 bg-white dark:bg-card border-r border-border flex flex-col justify-between shadow-sm z-10">
        <div>
          <div className="p-6 font-bold text-2xl border-b border-border text-primary flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-sm">IL</span>
            </div>
            <span>InvoiceLoop</span>
          </div>
          <nav className="p-4 space-y-1">
            <Link 
              to="/" 
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/') ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/invoices" 
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/invoices') || isActive('/invoices/new') ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Receipt size={18} />
              <span>Invoices</span>
            </Link>
            <Link 
              to="/clients" 
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/clients') ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Users size={18} />
              <span>Clients</span>
            </Link>
            <Link 
              to="/expenses" 
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/expenses') ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <TrendingDown size={18} />
              <span>Expenses</span>
            </Link>
            <Link 
              to="/settings" 
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/settings') ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <SettingsIcon size={18} />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-border space-y-4">
          {user && (
            <div className="px-3 py-2 flex items-center space-x-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{user.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between px-1">
            <button 
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button 
              onClick={logout}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors flex items-center space-x-2"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto">
        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
