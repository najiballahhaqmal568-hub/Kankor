import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { applyTheme, getTheme } from './lib/theme';
import { seedIfNeeded } from './db/seed';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

applyTheme(getTheme());
// وارد کردن بانک سؤالات به IndexedDB در پس‌زمینه (اولین اجرا)
void seedIfNeeded();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
