import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, FileWarning, ShieldAlert, LogOut, Menu, X, Hexagon, PieChart, Calendar, Search, Bell, Activity, Settings } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAutoRenewalReminder } from '../hooks/useAutoRenewalReminder';
import { appConfig } from '../config';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  useAutoRenewalReminder(); // Setup background tasks like sending renewal reminders
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Policies', path: '/policies', icon: FileText },
    { name: 'Claims', path: '/claims', icon: FileWarning },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Activity Log', path: '/activity', icon: Activity },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ name: 'Analytics', path: '/analytics', icon: PieChart });
    navLinks.push({ name: 'Admin Panel', path: '/admin', icon: ShieldAlert });
  }

  return (
    <div className="flex h-screen bg-[#F4F5F5] font-sans selection:bg-[var(--color-primary)] selection:text-white">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-bold tracking-tight text-xl">
            <Hexagon size={24} className="fill-[var(--color-primary)] text-[var(--color-primary)]" />
            <span>{appConfig.name}</span>
          </div>
          <button className="md:hidden text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  isActive 
                    ? 'bg-gray-900 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-gray-100/50 space-y-1">
          <Link
            to="/profile"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
              location.pathname.startsWith('/profile') 
                ? 'bg-gray-900 text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Settings size={18} className={location.pathname.startsWith('/profile') ? 'text-white' : 'text-gray-400'} />
            <span>Settings</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Top Navbar */}
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-4 sm:px-10 z-10 w-full bg-[#F4F5F5]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold tracking-tight text-xl md:hidden">
              <Hexagon size={24} className="fill-[var(--color-primary)] text-[var(--color-primary)]" />
              <span className="hidden sm:inline-block">{appConfig.name}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">
               {navLinks.find(link => location.pathname.startsWith(link.path))?.name || (location.pathname.startsWith('/profile') ? 'Settings' : title || 'Dashboard')}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 bg-white p-2 px-3 sm:px-4 rounded-[2rem] shadow-sm border border-gray-100 h-14">
            <div className="relative">
              <button 
                className="text-gray-400 hover:text-gray-900 transition-colors relative mt-1"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--color-primary)] rounded-full border border-white"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]">Mark all read</button>
                        )}
                        <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-gray-900">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">No notifications yet</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-orange-50/30' : ''}`} 
                            onClick={() => markAsRead(n.id)}
                          >
                            <div className="flex gap-3">
                              <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-[var(--color-primary)]' : 'bg-transparent'}`}></div>
                              <div>
                                <h4 className={`text-sm font-semibold text-gray-900 ${!n.read ? '' : 'text-gray-600'}`}>{n.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1.5">{new Date(n.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="w-px h-6 bg-gray-200 mx-0.5 sm:mx-1"></div>
            <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm overflow-hidden ring-2 ring-[var(--color-primary)]/20 border border-white">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <span className="text-sm font-semibold text-gray-900 hidden lg:block">{user?.name?.split(' ')[0] || 'User'}</span>
            </Link>

            <div className="w-px h-6 bg-gray-200 mx-0.5 sm:mx-1"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full p-4 sm:px-10 pb-20 md:pb-10 flex flex-col">
          <div className="max-w-[1400px] mx-auto w-full flex-1">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around pb-safe pt-2 px-2 z-40 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
          <Link to="/dashboard" className={`flex flex-col items-center gap-1 p-2 ${location.pathname === '/dashboard' ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
            <LayoutDashboard size={22} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link to="/policies" className={`flex flex-col items-center gap-1 p-2 ${location.pathname.startsWith('/policies') ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
            <FileText size={22} />
            <span className="text-[10px] font-medium">Policies</span>
          </Link>
          <Link to="/claims" className={`flex flex-col items-center gap-1 p-2 ${location.pathname.startsWith('/claims') ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
            <FileWarning size={22} />
            <span className="text-[10px] font-medium">Claims</span>
          </Link>
          <Link to="/search" className={`flex flex-col items-center gap-1 p-2 ${location.pathname.startsWith('/search') ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
            <Search size={22} />
            <span className="text-[10px] font-medium">Search</span>
          </Link>
          <Link to="/profile" className={`flex flex-col items-center gap-1 p-2 ${location.pathname.startsWith('/profile') ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
            <Settings size={22} />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </nav>
      </main>
    </div>
  );
}
