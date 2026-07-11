import { useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Bank from './pages/Bank';
import ExamSetup from './pages/ExamSetup';
import ExamRunner from './pages/ExamRunner';
import Report from './pages/Report';
import Review from './pages/Review';
import Settings from './pages/Settings';
import { applyTheme, getTheme, type Theme } from './lib/theme';

const NAV_ITEMS = [
  { to: '/', icon: '🏠', label: 'خانه' },
  { to: '/bank', icon: '📚', label: 'بانک سؤالات' },
  { to: '/exam', icon: '📝', label: 'آزمون' },
  { to: '/review', icon: '🔁', label: 'مرور' },
  { to: '/settings', icon: '⚙️', label: 'تنظیمات' },
];

export default function App() {
  const [theme, setTheme] = useState<Theme>(getTheme);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="logo-dot" aria-hidden="true" />
          آمادگی کانکور
        </div>
        <button
          className="btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bank" element={<Bank />} />
          <Route path="/exam" element={<ExamSetup />} />
          <Route path="/exam/run" element={<ExamRunner />} />
          <Route path="/report/:attemptId" element={<Report />} />
          <Route path="/review" element={<Review />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <nav className="bottom-nav" aria-label="ناوبری اصلی">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
