import React, { useState, useRef } from 'react';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react';
import { User, Lock, Shield, Key, UserPlus, CheckCircle, AlertCircle, X, Edit3, Database, Download, Upload, Cloud as CloudIcon, UploadCloud, DownloadCloud } from 'lucide-react';
import { exportFarmData, importFarmData } from '../utils/backup';
import { getCloudConfig, saveCloudConfig, pushAllToCloud, pullAllFromCloud } from '../utils/cloudSync';
import Modal from './ui/Modal';

interface Admin {
  login: string;
  name: string;
  role: string;
  code: string;
}

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdmin: Admin;
  allAdmins: Admin[];
  onSwitchAdmin: (login: string, code: string) => { success: boolean; message: string };
  onCreateAdmin: (newAdmin: Admin) => { success: boolean; message: string };
  onUpdateCurrentAdmin: (updatedFields: Partial<Admin>) => void;
}

export default function AdminModal({
  isOpen,
  onClose,
  currentAdmin,
  allAdmins,
  onSwitchAdmin,
  onCreateAdmin,
  onUpdateCurrentAdmin
}: AdminModalProps) {
  // 0 = Войти, 1 = Новый профиль, 2 = Настройки
  const [tabIndex, setTabIndex] = useState(0);
  
  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regLogin, setRegLogin] = useState('');
  const [regRole, setRegRole] = useState('Зоотехник-селекционер');
  const [regCode, setRegCode] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Edit Form State
  const [editName, setEditName] = useState(currentAdmin.name);
  const [editRole, setEditRole] = useState(currentAdmin.role);
  const [editCode, setEditCode] = useState(currentAdmin.code);
  const [editSuccess, setEditSuccess] = useState('');

  // Data backup (export / import) State
  const [dataMsg, setDataMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloud sync (Supabase) State
  const initialCloudCfg = getCloudConfig();
  const [cloudUrl, setCloudUrl] = useState(initialCloudCfg.url);
  const [cloudKey, setCloudKey] = useState(initialCloudCfg.anonKey);
  const [cloudMsg, setCloudMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);

  const handleCloudPush = async () => {
    saveCloudConfig({ url: cloudUrl, anonKey: cloudKey });
    if (!window.confirm('Отправить все данные хозяйства в облако? Данные в облаке будут заменены текущими локальными.')) return;
    setCloudBusy(true);
    setCloudMsg(null);
    const res = await pushAllToCloud();
    setCloudBusy(false);
    setCloudMsg({
      ok: res.success,
      text: res.success && res.details ? `${res.message} (${res.details.join(', ')})` : res.message,
    });
  };

  const handleCloudPull = async () => {
    saveCloudConfig({ url: cloudUrl, anonKey: cloudKey });
    if (!window.confirm('Загрузить данные из облака? ВСЕ локальные данные будут заменены облачными.')) return;
    setCloudBusy(true);
    setCloudMsg(null);
    const res = await pullAllFromCloud();
    setCloudBusy(false);
    setCloudMsg({
      ok: res.success,
      text: res.success && res.details ? `${res.message} (${res.details.join(', ')})` : res.message,
    });
    if (res.success) {
      setTimeout(() => window.location.reload(), 1400);
    }
  };

  const handleExport = () => {
    try {
      exportFarmData();
      setDataMsg({ ok: true, text: 'Резервная копия сохранена в папку «Загрузки».' });
    } catch {
      setDataMsg({ ok: false, text: 'Не удалось создать резервную копию.' });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Позволяет повторно выбрать тот же файл
    if (!file) return;

    if (!window.confirm('Импорт заменит все текущие данные хозяйства данными из файла. Продолжить?')) {
      return;
    }

    const res = await importFarmData(file);
    setDataMsg({ ok: res.success, text: res.message });
    if (res.success) {
      setTimeout(() => window.location.reload(), 1200);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    if (!loginUsername.trim() || !loginCode.trim()) {
      setLoginError('Пожалуйста, заполните логин и код доступа.');
      return;
    }

    const res = onSwitchAdmin(loginUsername.trim().toLowerCase(), loginCode.trim());
    if (res.success) {
      setLoginSuccess(res.message);
      // Update local state values for editing
      const found = allAdmins.find(a => a.login === loginUsername.trim().toLowerCase() && a.code === loginCode.trim());
      if (found) {
        setEditName(found.name);
        setEditRole(found.role);
        setEditCode(found.code);
      }
      setTimeout(() => {
        setLoginUsername('');
        setLoginCode('');
        setLoginSuccess('');
        onClose();
      }, 1500);
    } else {
      setLoginError(res.message);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regName.trim() || !regLogin.trim() || !regCode.trim() || !regRole.trim()) {
      setRegError('Пожалуйста, заполните все обязательные поля.');
      return;
    }

    const newAdmin: Admin = {
      name: regName.trim(),
      login: regLogin.trim().toLowerCase(),
      role: regRole.trim(),
      code: regCode.trim()
    };

    const res = onCreateAdmin(newAdmin);
    if (res.success) {
      setRegSuccess(res.message);
      setEditName(newAdmin.name);
      setEditRole(newAdmin.role);
      setEditCode(newAdmin.code);
      setTimeout(() => {
        setRegName('');
        setRegLogin('');
        setRegCode('');
        setRegSuccess('');
        setTabIndex(0);
      }, 1500);
    } else {
      setRegError(res.message);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccess('');

    if (!editName.trim() || !editCode.trim() || !editRole.trim()) {
      return;
    }

    onUpdateCurrentAdmin({
      name: editName.trim(),
      role: editRole.trim(),
      code: editCode.trim()
    });

    setEditSuccess('Профиль успешно обновлен!');
    setTimeout(() => {
      setEditSuccess('');
    }, 2000);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      panelId="admin-modal-container"
      panelClassName="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]"
    >
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Зоотехнический Доступ</h3>
              <p className="text-[10px] text-slate-400 font-medium">Смена и авторизация администраторов</p>
            </div>
          </div>
          <button 
            id="close-admin-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Admin Quick Details */}
        <div className="bg-slate-50 border-b border-slate-100 p-5 shrink-0 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-lg">
            {currentAdmin.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Активный администратор</span>
            <h4 className="font-bold text-slate-800 text-sm truncate">{currentAdmin.name}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{currentAdmin.role} (Логин: <strong className="text-slate-700">{currentAdmin.login}</strong>)</p>
          </div>
        </div>

        {/* Navigation Tabs (Headless UI TabGroup: клавиатурная навигация + ARIA) */}
        <TabGroup
          selectedIndex={tabIndex}
          onChange={(index) => {
            setTabIndex(index);
            // Сброс статусных сообщений при переключении вкладки
            setLoginError(''); setLoginSuccess('');
            setRegError(''); setRegSuccess('');
            setEditSuccess('');
          }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabList className="flex border-b border-slate-100 bg-white shrink-0">
            {[
              { id: 'admin-tab-login', icon: Key, label: 'Войти' },
              { id: 'admin-tab-register', icon: UserPlus, label: 'Новый профиль' },
              { id: 'admin-tab-edit', icon: Edit3, label: 'Настройки' },
            ].map(({ id, icon: Icon, label }) => (
              <Tab
                key={id}
                id={id}
                className="flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-hidden border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 data-[selected]:border-emerald-600 data-[selected]:text-emerald-600 data-[selected]:bg-emerald-50/20"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Tab>
            ))}
          </TabList>

          {/* Forms Container */}
          <TabPanels className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: LOGIN (SWITCH ACCOUNT) */}
          <TabPanel className="focus:outline-hidden">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-center pb-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Введите зарегистрированный логин зоотехника и 4-значный код доступа для переключения сессии.
                </p>
              </div>

              {loginError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-xl flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Логин</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    id="admin-login-input"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="yerzhan, admin..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Код доступа (PIN)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="password"
                    id="admin-code-input"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value)}
                    placeholder="••••"
                    maxLength={12}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold tracking-widest focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                id="admin-switch-btn"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-900/10 hover:shadow-emerald-900/20 active:scale-98 mt-2"
              >
                Сменить Администратора
              </button>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Зарегистрированные аккаунты:</span>
                <div className="flex flex-wrap gap-2">
                  {allAdmins.map((adm) => (
                    <div 
                      key={adm.login}
                      onClick={() => {
                        setLoginUsername(adm.login);
                        setLoginCode(adm.code);
                      }}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium cursor-pointer flex items-center gap-1"
                    >
                      <span>{adm.name}</span>
                      <span className="text-slate-400 text-[10px]">({adm.login})</span>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </TabPanel>

          {/* TAB 2: REGISTER NEW */}
          <TabPanel className="focus:outline-hidden">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="text-center pb-1">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Зарегистрируйте нового сотрудника для ведения зоотехнического реестра.
                </p>
              </div>

              {regError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-xl flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ФИО Администратора</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Например: Самат Смаков"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Логин (ID)</label>
                  <input
                    type="text"
                    value={regLogin}
                    onChange={(e) => setRegLogin(e.target.value.replace(/\s+/g, ''))}
                    placeholder="samat"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Код доступа (PIN)</label>
                  <input
                    type="text"
                    value={regCode}
                    onChange={(e) => setRegCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Например: 5555"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-semibold tracking-wider focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Должность / Роль</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 text-xs font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                >
                  <option value="Зоотехник-селекционер">Зоотехник-селекционер</option>
                  <option value="Главный зоотехник">Главный зоотехник</option>
                  <option value="Ветеринарный врач">Ветеринарный врач</option>
                  <option value="Директор конезавода">Директор конезавода</option>
                  <option value="Старший табунщик">Старший табунщик</option>
                </select>
              </div>

              <button
                type="submit"
                id="admin-register-btn"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md active:scale-98 mt-2"
              >
                Создать новый профиль
              </button>
            </form>
          </TabPanel>

          {/* TAB 3: EDIT CURRENT */}
          <TabPanel className="focus:outline-hidden">
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="text-center pb-1">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Измените данные вашего текущего активного профиля администратора.
                </p>
              </div>

              {editSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-xl flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Логин (Неизменяемый)</label>
                <input
                  type="text"
                  value={currentAdmin.login}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2 px-4 text-xs font-medium text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Имя / ФИО</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Должность</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Код доступа (PIN)</label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>

              <button
                type="submit"
                id="admin-save-btn"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md active:scale-98 mt-2"
              >
                Сохранить изменения
              </button>

              {/* Резервное копирование данных */}
              <div className="pt-5 mt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Резервное копирование данных
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Данные хранятся только в этом браузере. Периодически сохраняйте копию, чтобы не
                  потерять реестр при очистке браузера или чтобы перенести его на другое устройство.
                </p>

                {dataMsg && (
                  <div
                    className={`text-xs p-3 rounded-xl flex items-start gap-2 border ${
                      dataMsg.ok
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}
                  >
                    {dataMsg.ok ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    )}
                    <span>{dataMsg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="admin-export-btn"
                    onClick={handleExport}
                    className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Экспорт
                  </button>
                  <button
                    type="button"
                    id="admin-import-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer active:scale-98"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Импорт
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                  ⚠️ Импорт полностью заменит текущие данные данными из выбранного файла.
                </p>
              </div>

              {/* Облачная база данных (Supabase) */}
              <div className="pt-5 mt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <CloudIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Облачная база данных (Supabase)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Синхронизация между устройствами через ваш проект Supabase. Создайте проект на
                  supabase.com, выполните скрипт <strong>supabase/schema.sql</strong> из репозитория
                  и вставьте сюда Project URL и anon key (Settings → API).
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    id="cloud-url-input"
                    value={cloudUrl}
                    onChange={(e) => setCloudUrl(e.target.value)}
                    placeholder="https://xxxx.supabase.co"
                    autoComplete="off"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-mono focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                  />
                  <input
                    type="text"
                    id="cloud-key-input"
                    value={cloudKey}
                    onChange={(e) => setCloudKey(e.target.value)}
                    placeholder="anon key (eyJhbGciOi…)"
                    autoComplete="off"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-mono focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>

                {cloudMsg && (
                  <div
                    className={`text-xs p-3 rounded-xl flex items-start gap-2 border ${
                      cloudMsg.ok
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}
                  >
                    {cloudMsg.ok ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    )}
                    <span>{cloudMsg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="cloud-push-btn"
                    onClick={handleCloudPush}
                    disabled={cloudBusy}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    {cloudBusy ? 'Подождите…' : 'Отправить в облако'}
                  </button>
                  <button
                    type="button"
                    id="cloud-pull-btn"
                    onClick={handleCloudPull}
                    disabled={cloudBusy}
                    className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer active:scale-98"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    {cloudBusy ? 'Подождите…' : 'Загрузить из облака'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  «Отправить» заменяет данные в облаке локальными; «Загрузить» — наоборот.
                  Anon key даёт доступ к вашей базе — не публикуйте его.
                </p>
              </div>
            </form>
          </TabPanel>
          </TabPanels>
        </TabGroup>
    </Modal>
  );
}
