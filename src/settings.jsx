import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { api } from './api.js';

const Ctx = createContext({ s: {}, reload: () => {} });

export function SettingsProvider({ children }) {
  const [s, setS] = useState({ ascii_text: '', tg_url: '', site_title: '' });
  const lastRef = useRef('');

  const reload = () => api('/settings').then(next => {
    const sig = JSON.stringify(next);
    if (sig !== lastRef.current) {
      lastRef.current = sig;
      setS(next);
    }
  }).catch(() => {});

  useEffect(() => {
    reload();
    const id = setInterval(reload, 4000); // live: подхватывает правки ASCII.TXT без перезагрузки
    return () => clearInterval(id);
  }, []);

  return <Ctx.Provider value={{ s, reload }}>{children}</Ctx.Provider>;
}
export const useSettings = () => useContext(Ctx);
