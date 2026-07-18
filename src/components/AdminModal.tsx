import React, { useState, useRef } from 'react';
import { Settings, CheckCircle, AlertCircle, X, Database, Download, Upload } from 'lucide-react';
import { exportFarmData, importFarmData } from '../utils/backup';
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
}

/**
 * Модальное окно «Настройки». После перехода на настоящую авторизацию
 * (Supabase Auth) устаревшая система входа/регистрации по PIN удалена —
 * личность пользователя приходит из авторизации. Здесь остались только
 * данные аккаунта (для чтения) и резервное копирование.
 */
export default function AdminModal({ isOpen, onClose, currentAdmin }: AdminModalProps) {
  // Резервное копирование (экспорт / импорт)
  const [dataMsg, setDataMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    e.target.value = '';
    if (!file) return;
    if (!window.confirm('Импорт заменит все текущие данные хозяйства данными из файла. Продолжить?')) return;
    const res = await importFarmData(file);
    setDataMsg({ ok: res.success, text: res.message });
    if (res.success) setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      panelId="admin-modal-container"
      panelClassName="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]"
    >
      {/* Заголовок */}
      <div className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Настройки</h3>
            <p className="text-[10px] text-slate-400 font-medium">Аккаунт и резервные копии</p>
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

      {/* Текущий пользователь (из авторизации, только для чтения) */}
      <div className="bg-slate-50 border-b border-slate-100 p-5 shrink-0 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-lg">
          {currentAdmin.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Активный пользователь</span>
          <h4 className="font-bold text-slate-800 text-sm truncate">{currentAdmin.name}</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentAdmin.role}
            {currentAdmin.login ? <> · Логин: <strong className="text-slate-700">{currentAdmin.login}</strong></> : null}
          </p>
        </div>
      </div>

      {/* Тело */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Резервное копирование данных */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Резервное копирование данных
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Данные хранятся в этом браузере. Периодически сохраняйте копию, чтобы не потерять
            реестр при очистке браузера или чтобы перенести его на другое устройство.
          </p>

          {dataMsg && (
            <div className={`text-xs p-3 rounded-xl flex items-start gap-2 border ${dataMsg.ok ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
              {dataMsg.ok ? <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />}
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
      </div>
    </Modal>
  );
}
