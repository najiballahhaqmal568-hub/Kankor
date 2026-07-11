import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { applyTheme, getTheme } from './lib/theme';
import { applyFontSize, getFontSize } from './lib/settings';
import { seedIfNeeded } from './db/seed';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

// تضمین RTL حتی وقتی سند میزبان dir نداشته باشد (مثلاً در پیش‌نمایش جاسازی‌شده)
document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'fa-AF');

applyTheme(getTheme());
applyFontSize(getFontSize());
// وارد کردن بانک سؤالات به IndexedDB در پس‌زمینه (اولین اجرا)
void seedIfNeeded();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
