import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import styles from './AppLayout.module.scss';
import {
  Compass,
  X,
  Zap,
  Cpu,
  Users,
  Smile,
  Shield,
  Clock,
  BookOpen,
  Play,
  Settings,
  Menu,
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
  Calendar,
  Activity,
  ClipboardCheck,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Map route path to header title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'System Dashboard';
    if (path === '/automations') return 'AI Workflow Builder';
    if (path === '/whatsapp-accounts') return 'WhatsApp Accounts Gateway';
    if (path === '/approval-queue') return 'Human Approval Queue';
    if (path === '/scheduler') return 'Outbound Messages Scheduler';
    if (path === '/monitoring') return 'System Activity Monitoring & Reports';
    if (path === '/business-assistant') return 'Business AI Assistant Config';
    if (path === '/group-assistant') return 'Group Community Rules';
    if (path === '/humanizer') return 'Tone Humanization Pipeline';
    if (path === '/compliance') return 'Outbound Compliance Engine';
    if (path === '/delay-settings') return 'Wait & Typing Simulation';
    if (path === '/ai-personality') return 'Brand AI Personalities';
    if (path === '/knowledge-sources') return 'RAG Knowledge Sources';
    if (path === '/playground') return 'Automations Test Playground';
    if (path === '/settings') return 'System API Configurations';
    return 'WhatsApp AI Automation Builder';
  };

  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoSection}>
          <Compass className={styles.logoIcon} size={28} />
          <span className={styles.logoText}>Antigravity WA</span>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto' }}>
            <X size={20} />
          </button>
        </div>

        <nav className={styles.navSection}>
          <NavLink to="/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/whatsapp-accounts" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Zap size={18} />
            <span>WhatsApp Accounts</span>
          </NavLink>

          <NavLink to="/approval-queue" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <ClipboardCheck size={18} />
            <span>Approval Queue</span>
          </NavLink>

          <NavLink to="/scheduler" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Calendar size={18} />
            <span>Scheduler</span>
          </NavLink>

          <NavLink to="/monitoring" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Activity size={18} />
            <span>Monitoring & Reports</span>
          </NavLink>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }} />

          <NavLink to="/automations" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Compass size={18} />
            <span>Automations Builder</span>
          </NavLink>

          <NavLink to="/business-assistant" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Cpu size={18} />
            <span>Business Assistant</span>
          </NavLink>

          <NavLink to="/group-assistant" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Users size={18} />
            <span>Group Assistant</span>
          </NavLink>

          <NavLink to="/humanizer" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Smile size={18} />
            <span>Humanizer</span>
          </NavLink>

          <NavLink to="/compliance" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Shield size={18} />
            <span>Compliance</span>
          </NavLink>

          <NavLink to="/delay-settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Clock size={18} />
            <span>Delay Settings</span>
          </NavLink>

          <NavLink to="/ai-personality" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Smile size={18} />
            <span>AI Personality</span>
          </NavLink>

          <NavLink to="/knowledge-sources" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <BookOpen size={18} />
            <span>Knowledge Sources</span>
          </NavLink>

          <NavLink to="/playground" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Play size={18} />
            <span>Test Playground</span>
          </NavLink>

          <NavLink to="/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className={styles.footerSection}>
          <button className={styles.themeToggle} onClick={toggleTheme}>
            <span>Theme Toggle</span>
            <div className={styles.toggleIcons}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </div>
          </button>

          <div className={styles.userCard}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'Operator'}</span>
              <span className={styles.userRole}>{user?.role || 'staff'}</span>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          
          <h1 className={styles.headerTitle}>{getPageTitle()}</h1>

          <div className={styles.statusBanner}>
            <div className={styles.pulseDot} />
            <span>Simulator Sandbox Mode</span>
          </div>
        </header>

        <main className={styles.pageBody}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
