import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { SettingsProvider, useSettings } from './settings.jsx';
import { getToken, api, setToken } from './api.js';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Panel from './pages/Panel.jsx';
import Admin from './pages/Admin.jsx';

// bump document title from settings
function Title() {
  const { s } = useSettings();
  useEffect(() => { if (s.site_title) document.title = s.site_title; }, [s.site_title]);
  return null;
}

function Guard({ children, admin = false }) {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!getToken()) { nav('/login', { replace: true }); return; }
    api('/auth/me')
      .then(u => {
        if (admin && u.role !== 'admin') { nav('/panel', { replace: true }); return; }
        setReady(true);
      })
      .catch(() => { setToken(null); nav('/login', { replace: true }); });
  }, []);
  if (!ready) return null;
  return children;
}

export default function App() {
  return (
    <SettingsProvider>
      <Title />
      <div className="scanlines" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/panel" element={<Guard><Panel /></Guard>} />
        <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SettingsProvider>
  );
}
