/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Horse, Vaccination, CullRecord } from '../types';
import { getEffectiveVaccinationStatus } from '../utils/vaccination';
import { clearFarmData } from '../utils/backup';
import {
  Settings,
  Utensils,
  ShieldCheck,
  Skull,
  History,
  ChevronRight,
  Database,
  LogOut,
} from 'lucide-react';

interface Admin {
  login: string;
  name: string;
  role: string;
}

interface ProfileTabProps {
  currentAdmin: Admin;
  horses: Horse[];
  vaccinations: Vaccination[];
  culls: CullRecord[];
  onNavigate: (tab: string) => void;
  onOpenAdminSettings: () => void;
  onLogout: () => void;
}

/**
 * Страница «Профиль» — хаб мобильной навигации по мировой практике
 * (паттерн «Profile / More» в нижних панелях iOS и Material 3).
 * Содержит карточку администратора и плитки второстепенных разделов,
 * которые не поместились в 5 основных вкладок.
 */
export default function ProfileTab({
  currentAdmin,
  horses,
  vaccinations,
  culls,
  onNavigate,
  onOpenAdminSettings,
  onLogout,
}: ProfileTabProps) {
  const fatteningCount = horses.filter(h => h.status === 'fattening').length;
  const overdueVaccines = vaccinations.filter(
    v => getEffectiveVaccinationStatus(v) === 'overdue'
  ).length;

  const sections = [
    {
      tab: 'fattening',
      icon: Utensils,
      title: 'Группа откорма',
      subtitle: 'Нажировка и контроль привесов',
      badge: fatteningCount > 0 ? String(fatteningCount) : null,
      badgeClass: 'bg-amber-100 text-amber-800',
      iconClass: 'bg-amber-50 text-amber-600',
    },
    {
      tab: 'vaccinations',
      icon: ShieldCheck,
      title: 'Вакцинация',
      subtitle: 'Календарь прививок и вет-контроль',
      badge: overdueVaccines > 0 ? String(overdueVaccines) : null,
      badgeClass: 'bg-rose-100 text-rose-700',
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      tab: 'culls',
      icon: Skull,
      title: 'Архив забоя (Согым)',
      subtitle: 'Учёт забоя, вес и выручка',
      badge: culls.length > 0 ? String(culls.length) : null,
      badgeClass: 'bg-slate-200 text-slate-700',
      iconClass: 'bg-slate-100 text-slate-500',
    },
    {
      tab: 'history',
      icon: History,
      title: 'История хозяйства',
      subtitle: 'Хронология ключевых событий',
      badge: null,
      badgeClass: '',
      iconClass: 'bg-sky-50 text-sky-600',
    },
  ];

  return (
    <div id="profile-tab-container" className="space-y-5 max-w-lg mx-auto md:max-w-2xl">
      {/* Карточка администратора */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 px-5 pt-6 pb-12" />
        <div className="px-5 pb-5 -mt-8">
          <div className="flex items-end justify-between">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-4 border-white shadow-md flex items-center justify-center font-black text-emerald-800 text-2xl">
              {currentAdmin.name.charAt(0).toUpperCase()}
            </div>
            <button
              id="profile-settings-btn"
              onClick={onOpenAdminSettings}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Settings className="w-3.5 h-3.5" />
              Настройки
            </button>
          </div>
          <h2 className="font-extrabold text-slate-900 text-lg mt-3 leading-tight">{currentAdmin.name}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {currentAdmin.role} · Логин: <span className="text-slate-700">{currentAdmin.login}</span>
          </p>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            База данных активна · Хозяйство «Алтын Тулпар»
          </div>
        </div>
      </div>

      {/* Разделы, интегрированные в профиль */}
      <div>
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
          Разделы хозяйства
        </h3>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs divide-y divide-slate-50 overflow-hidden">
          {sections.map(({ tab, icon: Icon, title, subtitle, badge, badgeClass, iconClass }) => (
            <button
              key={tab}
              id={`profile-section-${tab}`}
              onClick={() => onNavigate(tab)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50/70 active:bg-slate-100/70 transition-colors cursor-pointer text-left"
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
                <Icon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="font-bold text-slate-800 text-sm block leading-tight">{title}</span>
                <span className="text-[11px] text-slate-400 font-medium block mt-0.5 truncate">{subtitle}</span>
              </span>
              {badge && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
                  {badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Сводка данных */}
      <div>
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
          Данные
        </h3>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs px-4 py-3.5 flex items-center gap-3.5">
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </span>
          <div className="flex-1 text-xs text-slate-500 font-medium leading-relaxed">
            Все данные хранятся локально в этом браузере.
            Резервная копия — в <button onClick={onOpenAdminSettings} className="text-emerald-700 font-bold underline underline-offset-2 cursor-pointer">Настройках</button> (вкладка «Настройки» → Экспорт).
          </div>
        </div>

        <button
          id="profile-clear-data-btn"
          onClick={() => {
            if (window.confirm('Очистить ВСЕ данные хозяйства в этом браузере (лошади, косяки, вакцинация, откорм, забой, история)? Действие необратимо. Рекомендуем сначала сделать экспорт.')) {
              clearFarmData();
              window.location.reload();
            }
          }}
          className="mt-3 w-full text-center text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-2xl py-2.5 transition-all cursor-pointer active:scale-98"
        >
          Очистить данные хозяйства (чистый лист)
        </button>
      </div>

      {/* Выход из учётной записи */}
      <button
        id="profile-logout-btn"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 font-bold text-sm py-3 rounded-2xl transition-all cursor-pointer active:scale-98 shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        Выйти из учётной записи
      </button>

      <p className="text-center text-[10px] text-slate-300 font-semibold pb-2">
        © 2026 Табун-Реестр · Зоотехнический учёт
      </p>
    </div>
  );
}
