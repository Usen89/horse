/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react';
import { Lock, User, Briefcase, AtSign, LogIn, UserPlus, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Logo from './ui/Logo';
import { signInUser, signUpUser } from '../utils/auth';

const ROLES = [
  'Зоотехник-селекционер',
  'Главный зоотехник',
  'Ветеринарный врач',
  'Директор конезавода',
  'Старший табунщик',
];

/**
 * Экран авторизации. Вход — по имени пользователя (не email); email при
 * регистрации необязателен. Настоящая аутентификация через Supabase Auth.
 */
export default function AuthGate() {
  const [tabIndex, setTabIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Вход
  const [inUser, setInUser] = useState('');
  const [inPass, setInPass] = useState('');

  // Регистрация
  const [upUser, setUpUser] = useState('');
  const [upName, setUpName] = useState('');
  const [upRole, setUpRole] = useState(ROLES[0]);
  const [upEmail, setUpEmail] = useState('');
  const [upPass, setUpPass] = useState('');

  const switchTab = (i: number) => {
    setTabIndex(i);
    setMsg(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await signInUser(inUser, inPass);
    setBusy(false);
    if (!res.ok) setMsg({ ok: false, text: res.message });
    // При успехе App поймает onAuthStateChange и покажет приложение.
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upUser.trim()) {
      setMsg({ ok: false, text: 'Придумайте имя пользователя.' });
      return;
    }
    if (!upName.trim()) {
      setMsg({ ok: false, text: 'Укажите ваше имя.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await signUpUser(upUser, upPass, upName, upRole, upEmail);
    setBusy(false);
    setMsg({ ok: res.ok, text: res.message });
    if (res.ok && !res.needConfirm) {
      setInUser(upUser.trim());
    }
  };

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800';

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Логотип и название */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo className="w-16 h-16 drop-shadow-lg" />
          <h1 className="text-white font-black text-xl mt-3 tracking-tight">Табун-Реестр</h1>
          <p className="text-slate-400 text-xs font-semibold mt-1 uppercase tracking-widest">
            Зоотехнический учёт
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <TabGroup selectedIndex={tabIndex} onChange={switchTab}>
            <TabList className="flex border-b border-slate-100">
              <Tab className="flex-1 py-3.5 text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer focus:outline-hidden border-b-2 border-transparent text-slate-500 hover:bg-slate-50/50 data-[selected]:border-emerald-600 data-[selected]:text-emerald-600 data-[selected]:bg-emerald-50/20">
                <LogIn className="w-4 h-4" /> Вход
              </Tab>
              <Tab className="flex-1 py-3.5 text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer focus:outline-hidden border-b-2 border-transparent text-slate-500 hover:bg-slate-50/50 data-[selected]:border-emerald-600 data-[selected]:text-emerald-600 data-[selected]:bg-emerald-50/20">
                <UserPlus className="w-4 h-4" /> Регистрация
              </Tab>
            </TabList>

            {msg && (
              <div
                className={`mx-6 mt-5 -mb-1 text-xs p-3 rounded-xl flex items-start gap-2 border ${
                  msg.ok
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}
              >
                {msg.ok ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                )}
                <span>{msg.text}</span>
              </div>
            )}

            <TabPanels className="p-6">
              {/* ВХОД */}
              <TabPanel className="focus:outline-hidden">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={inUser}
                      onChange={(e) => setInUser(e.target.value)}
                      placeholder="Имя пользователя"
                      className={inputCls}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={inPass}
                      onChange={(e) => setInPass(e.target.value)}
                      placeholder="Пароль"
                      className={inputCls + ' pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      aria-label={showPass ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-900/10 active:scale-98"
                  >
                    {busy ? 'Вход…' : 'Войти'}
                  </button>
                </form>
              </TabPanel>

              {/* РЕГИСТРАЦИЯ */}
              <TabPanel className="focus:outline-hidden">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={upUser}
                      onChange={(e) => setUpUser(e.target.value)}
                      placeholder="Имя пользователя (логин)"
                      className={inputCls}
                    />
                  </div>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={upName}
                      onChange={(e) => setUpName(e.target.value)}
                      placeholder="Имя и фамилия"
                      className={inputCls}
                    />
                  </div>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                    <select
                      value={upRole}
                      onChange={(e) => setUpRole(e.target.value)}
                      className={inputCls + ' cursor-pointer appearance-none'}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={upEmail}
                      onChange={(e) => setUpEmail(e.target.value)}
                      placeholder="Email (необязательно)"
                      className={inputCls}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={upPass}
                      onChange={(e) => setUpPass(e.target.value)}
                      placeholder="Пароль (минимум 6 символов)"
                      className={inputCls + ' pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      aria-label={showPass ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
                  >
                    {busy ? 'Регистрация…' : 'Зарегистрироваться'}
                  </button>
                </form>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>

        <p className="text-center text-[10px] text-slate-500 mt-5">
          Данные хозяйства защищены. Доступ только по личной учётной записи.
        </p>
      </div>
    </div>
  );
}
