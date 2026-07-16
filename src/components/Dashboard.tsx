/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Horse, Kosek, Vaccination, FatteningRecord, CullRecord } from '../types';
import { 
  TrendingUp, 
  ShieldAlert, 
  UserCheck, 
  Calendar, 
  Activity, 
  Users, 
  FileText, 
  Plus, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

interface DashboardProps {
  horses: Horse[];
  koseks: Kosek[];
  vaccinations: Vaccination[];
  fattenings: FatteningRecord[];
  culls: CullRecord[];
  onNavigate: (tab: string) => void;
  onSelectHorse: (horseId: string) => void;
}

export default function Dashboard({
  horses,
  koseks,
  vaccinations,
  fattenings,
  culls,
  onNavigate,
  onSelectHorse
}: DashboardProps) {
  // 1. Calculate general counts
  const activeHorses = horses.filter(h => h.status !== 'slaughtered' && h.status !== 'sold');
  const totalHorsesCount = activeHorses.length;
  
  const stallionsCount = activeHorses.filter(h => h.gender === 'stallion').length;
  const pregnantMares = activeHorses.filter(h => h.gender === 'mare' && h.isPregnant);
  const pregnantCount = pregnantMares.length;
  
  const activeFatteningCount = activeHorses.filter(h => h.status === 'fattening').length;

  // 2. Overdue or upcoming vaccinations
  const pendingVaccinations = vaccinations.filter(v => v.status === 'overdue' || v.status === 'planned');
  const overdueVaccinationsCount = vaccinations.filter(v => v.status === 'overdue').length;

  // 3. Stallion - Herd (Kosek) assignment mapping
  const kosekDetails = koseks.map(k => {
    const leaderStallion = horses.find(h => h.id === k.stallionId);
    const haremMaresCount = activeHorses.filter(h => h.kosekId === k.id && h.gender === 'mare').length;
    const totalGroupCount = activeHorses.filter(h => h.kosekId === k.id).length; // Stallion + Mares + offspring

    return {
      kosek: k,
      stallion: leaderStallion,
      maresCount: haremMaresCount,
      totalCount: totalGroupCount
    };
  });

  // Calculate some fun insights for modern touch (e.g., Average Age, Meat production, etc.)
  const calculateAverageAge = () => {
    if (activeHorses.length === 0) return 0;
    const totalAge = activeHorses.reduce((sum, h) => {
      const birth = new Date(h.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return sum + Math.max(0, age);
    }, 0);
    return (totalAge / activeHorses.length).toFixed(1);
  };

  const totalSlaughteredWeight = culls.reduce((sum, c) => sum + c.weight, 0);

  // Calculate foaling heat/mating alerts (12 days post-foaling)
  const foalingMatingAlerts = activeHorses.filter(h => {
    if (h.gender !== 'mare' || h.isPregnant || !h.lastFoalingDate) return false;
    const foaledDate = new Date(h.lastFoalingDate);
    const today = new Date();
    foaledDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = today.getTime() - foaledDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 11; // Alert when they are on day 11 or more and not pregnant!
  }).map(h => {
    const foaledDate = new Date(h.lastFoalingDate!);
    const today = new Date();
    foaledDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = today.getTime() - foaledDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return {
      horse: h,
      daysSince: diffDays
    };
  });

  return (
    <div id="dashboard-tab" className="space-y-6">
      {/* Welcome Hero / Farm Header - Compact Sleek Design */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-2xl p-5 md:p-6 text-white shadow-xs relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
          <Sparkles className="w-80 h-80" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="bg-emerald-700/60 text-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest inline-flex items-center gap-1">
            <span>🌐</span> МЕЖДУНАРОДНЫЕ СТАНДАРТЫ УЧЕТА
          </span>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">Панель управления конефермой</h1>
          <p className="text-emerald-100/95 text-xs md:text-sm leading-relaxed max-w-xl">
            Автоматический мониторинг стада, ветеринарного контроля и традиционной селекционной работы.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button 
              id="quick-add-horse-btn"
              onClick={() => onNavigate('database')} 
              className="bg-white hover:bg-emerald-50 text-emerald-900 px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить лошадь
            </button>
            <button 
              id="view-koseks-btn"
              onClick={() => onNavigate('koseks')} 
              className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              Управление косяками <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 🔔 Breeding Heat Alerts / "Пора гулять" Notifications */}
      {foalingMatingAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
            <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              ⚠️ ОПОВЕЩЕНИЯ: СЛУЧКА КОБЫЛ (12 ДНЕЙ ПОСЛЕ ВЫЖЕРЕБКИ)
            </h4>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
              Внимание: {foalingMatingAlerts.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {foalingMatingAlerts.map(({ horse, daysSince }) => (
              <div 
                key={horse.id} 
                onClick={() => onNavigate('mares')}
                className="bg-white hover:bg-amber-50/40 p-3.5 rounded-2xl border border-amber-100 flex items-center justify-between gap-4 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <img src={horse.imageUrl} alt={horse.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-slate-800 block truncate group-hover:text-amber-700 transition-colors">
                      Кобыла {horse.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-semibold">
                      Выжеребка была: {horse.lastFoalingDate} ({daysSince} дн. назад)
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {daysSince >= 11 && daysSince <= 14 ? (
                    <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider animate-pulse inline-block">
                      🔥 ПОРА СЛУЧАТЬ (день {daysSince})
                    </span>
                  ) : (
                    <span className="bg-rose-100 text-rose-800 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider inline-block">
                      ⚠️ СРОК ПРЕВЫШЕН ({daysSince} дн.)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Horses */}
        <div id="metric-total-horses" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Общее поголовье</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalHorsesCount}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
              <span>Активные лошади</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Stallions */}
        <div id="metric-stallions" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Активные жеребцы</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stallionsCount}</h3>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Жеребцы-производители
            </p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Pregnant Mares */}
        <div id="metric-pregnant-mares" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Беременные кобылы</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{pregnantCount}</h3>
            <p className="text-[11px] text-amber-600 font-medium mt-1.5 flex items-center gap-1">
              <span>Требуют ветеринарный надзор</span>
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Vaccination Alerts */}
        <div id="metric-vaccinations" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Вакцинация (просрочено)</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {overdueVaccinationsCount} <span className="text-sm font-normal text-slate-400">/ {pendingVaccinations.length}</span>
            </h3>
            <p className="text-[11px] text-rose-600 font-medium mt-1.5 flex items-center gap-1">
              {overdueVaccinationsCount > 0 ? (
                <span className="flex items-center gap-0.5"><ShieldAlert className="w-3 h-3" /> Срочно привить!</span>
              ) : (
                <span>Все по плану</span>
              )}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 size): Koseks & Stallions Map & Pregnant Mares */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Stallion - Kosek Mapping (в каком косяке какой жеребец) */}
          <div id="kosek-mapping-panel" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Косячная структура (Табунное содержание)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Закрепление жеребцов за маточными косяками и общая наполненность групп.
                </p>
              </div>
              <button 
                id="view-all-koseks-link"
                onClick={() => onNavigate('koseks')} 
                className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1"
              >
                Все косяки <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {kosekDetails.map(({ kosek, stallion, maresCount, totalCount }) => (
                <div 
                  key={kosek.id} 
                  id={`kosek-map-${kosek.id}`}
                  className="bg-slate-50/50 hover:bg-slate-50 transition-all rounded-xl p-4 border border-slate-100 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <h4 className="font-bold text-slate-800 text-sm truncate">{kosek.name}</h4>
                    </div>
                    
                    {stallion ? (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex items-center gap-2.5 mb-3 cursor-pointer hover:border-emerald-200" onClick={() => onSelectHorse(stallion.id)}>
                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0">
                          <img 
                            src={stallion.imageUrl || "https://images.unsplash.com/photo-1598974357801-cbca100e6563?w=100&auto=format&fit=crop&q=80"} 
                            alt={stallion.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-sky-600 block">Жеребец-вожак</span>
                          <span className="font-semibold text-xs text-slate-800 truncate block">{stallion.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100 text-amber-800 text-xs flex items-center gap-1.5 mb-3">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Косяк без вожака!</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between text-xs text-slate-500">
                    <div>
                      <span className="block font-medium text-slate-800">{maresCount}</span>
                      <span>кобыл</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-medium text-slate-800">{totalCount}</span>
                      <span>всего голов</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* International advice for Tabun grouping */}
            <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100/60 flex gap-2.5 text-xs items-start">
              <Info className="w-4.5 h-4.5 text-emerald-600 mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                <strong>Опыт свободного табунного разведения:</strong> Формирование изолированных косяков во главе с сильным жеребцом гарантирует естественное воспроизводство с репродуктивным выходом свыше 90%. Избегайте присутствия двух половозрелых жеребцов в одном косяке для исключения травм и споров за доминирование.
              </p>
            </div>
          </div>

          {/* Section: Pregnant Mares (беременные кобылы) */}
          <div id="pregnant-mares-panel" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Беременные кобылы (Жеребые)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Мониторинг сроков вынашивания и планируемых родов (жеребости).
                </p>
              </div>
              <span className="text-xs bg-rose-50 text-rose-600 font-semibold px-2.5 py-1 rounded-full">
                Всего: {pregnantCount} кобыл
              </span>
            </div>

            {pregnantMares.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pregnantMares.map(mare => {
                  const daysLeft = () => {
                    if (!mare.pregnancyDueDate) return 'Не указан';
                    const due = new Date(mare.pregnancyDueDate);
                    const today = new Date();
                    const diffTime = due.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) return 'Срок наступил';
                    return `${diffDays} дн.`;
                  };

                  const progressPercent = () => {
                    if (!mare.pregnancyDate || !mare.pregnancyDueDate) return 50;
                    const start = new Date(mare.pregnancyDate).getTime();
                    const due = new Date(mare.pregnancyDueDate).getTime();
                    const now = new Date().getTime();
                    const total = due - start;
                    const elapsed = now - start;
                    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                  };

                  return (
                    <div 
                      key={mare.id} 
                      id={`pregnant-card-${mare.id}`}
                      className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer flex items-center justify-between gap-3"
                      onClick={() => onSelectHorse(mare.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0">
                          <img 
                            src={mare.imageUrl || "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=100&auto=format&fit=crop&q=80"} 
                            alt={mare.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{mare.name}</h4>
                          <span className="text-[10px] text-slate-500 block">Масть: {mare.coat}</span>
                          <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">Косяк: {koseks.find(k => k.id === mare.kosekId)?.name || 'Не указан'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 min-w-[100px]">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">До жереба</span>
                        <span className="font-bold text-slate-950 text-sm block mt-0.5">{daysLeft()}</span>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent()}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] text-rose-500 font-medium block mt-0.5">{progressPercent()}% срока</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-400">В хозяйстве в настоящее время нет зарегистрированных жеребых (беременных) кобыл.</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (1/3 size): Veterinary Control / Vaccinations Alert & Fattening Summary */}
        <div className="space-y-6 col-span-1">
          
          {/* Section: Veterinary / Vaccination Reminders (вакцинации) */}
          <div id="veterinary-alerts-panel" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900 text-base">Вакцинация и вет-контроль</h2>
                <button 
                  id="view-all-vaccines-link"
                  onClick={() => onNavigate('vaccinations')} 
                  className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold"
                >
                  Календарь
                </button>
              </div>

              <div className="space-y-3">
                {pendingVaccinations.slice(0, 4).map(vaccine => {
                  const isOverdue = vaccine.status === 'overdue' || new Date(vaccine.nextDueDate) < new Date();
                  return (
                    <div 
                      key={vaccine.id} 
                      id={`vaccine-alert-${vaccine.id}`}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
                        isOverdue 
                          ? 'bg-rose-50 border-rose-100 text-rose-900' 
                          : 'bg-slate-50 border-slate-100 text-slate-800'
                      }`}
                    >
                      <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${isOverdue ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-xs truncate text-slate-900">{vaccine.horseName}</h4>
                          <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md ${
                            isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isOverdue ? 'Просрочено' : 'Запланировано'}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-700 mt-0.5">Вакцина: {vaccine.disease}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Срок: <strong className={isOverdue ? 'text-rose-600' : 'text-slate-700'}>{vaccine.nextDueDate}</strong>
                        </p>
                      </div>
                    </div>
                  );
                })}

                {pendingVaccinations.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    Все вакцинации проведены своевременно. Оповещений нет.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
              Стандарты ВОЗЖ (OIE): вакцинация против Сибирской Язвы и Сапа проводится ежегодно.
            </div>
          </div>

          {/* Section: Fattening Control (на откорме) */}
          <div id="fattening-panel" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-base">Группа откорма (Нажировка)</h2>
              <button 
                id="view-all-fattening-link"
                onClick={() => onNavigate('fattening')} 
                className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold"
              >
                Все ({activeFatteningCount})
              </button>
            </div>

            {activeFatteningCount > 0 ? (
              <div className="space-y-3.5">
                {horses.filter(h => h.status === 'fattening').slice(0, 3).map(horse => {
                  const record = fattenings.find(f => f.horseId === horse.id);
                  const progress = record && record.startWeight && record.currentWeight
                    ? Math.round(((record.currentWeight - record.startWeight) / record.startWeight) * 100)
                    : 0;
                  
                  return (
                    <div 
                      key={horse.id} 
                      id={`fattening-widget-${horse.id}`}
                      className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer"
                      onClick={() => onNavigate('fattening')}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-xs text-slate-800">{horse.name}</h4>
                          <span className="text-[10px] text-slate-500">Масть: {horse.coat}</span>
                        </div>
                        {record && (
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-emerald-600 block">+{record.currentWeight! - record.startWeight!} кг</span>
                            <span className="text-[9px] text-slate-400">прирост</span>
                          </div>
                        )}
                      </div>
                      
                      {record && (
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>Начало: {record.startDate}</span>
                            <span>Срок: {record.durationDays} дн.</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(10, progress * 4))}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                На откорме в данный момент животных нет.
              </div>
            )}
          </div>

          {/* Farm Quick Stats Insights */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2.5">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Статистические показатели хозяйства
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white p-2 rounded-lg border border-slate-100/60">
                <span className="text-slate-400 block">Ср. возраст стада:</span>
                <strong className="text-slate-800 text-sm block mt-0.5">{calculateAverageAge()} лет</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-100/60">
                <span className="text-slate-400 block">Забито / Согым (всего):</span>
                <strong className="text-slate-800 text-sm block mt-0.5">{culls.length} голов ({totalSlaughteredWeight} кг)</strong>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
