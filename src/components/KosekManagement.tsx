/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Horse, Kosek } from '../types';
import HorseDetailModal from './HorseDetailModal';
import { 
  Users, 
  UserPlus, 
  MapPin, 
  ArrowLeftRight, 
  FileText, 
  Plus, 
  Check, 
  Shield, 
  Sparkles,
  Bookmark,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Trash2,
  RefreshCw,
  ArrowRight,
  Sliders
} from 'lucide-react';

interface KosekManagementProps {
  horses: Horse[];
  koseks: Kosek[];
  onCreateKosek: (kosek: Omit<Kosek, 'id'>) => void;
  onUpdateKosek: (id: string, updated: Partial<Kosek>) => void;
  onDeleteKosek: (id: string) => void;
  onMoveHorseToKosek: (horseId: string, kosekId: string | null) => void;
  onUpdateHorse?: (id: string, updatedFields: Partial<Horse>) => void;
  onRequestConfirmation?: (title: string, message: string, onConfirm: () => void) => void;
}

export default function KosekManagement({
  horses,
  koseks,
  onCreateKosek,
  onUpdateKosek,
  onDeleteKosek,
  onMoveHorseToKosek,
  onUpdateHorse,
  onRequestConfirmation
}: KosekManagementProps) {

  // Carousel & Selection States
  const [activeKosekIndex, setActiveKosekIndex] = useState(0);
  const [isStallionActivated, setIsStallionActivated] = useState(true);
  
  // Modal & Management States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetHorse, setTargetHorse] = useState<Horse | null>(null);
  const [targetKosekId, setTargetKosekId] = useState<string>('');
  const [previewKosek, setPreviewKosek] = useState<Kosek | null>(null);
  const [selectedDetailHorse, setSelectedDetailHorse] = useState<Horse | null>(null);

  // Stallion swap overlay state
  const [isChangingStallion, setIsChangingStallion] = useState(false);
  const [selectedNewStallionId, setSelectedNewStallionId] = useState('');

  // Quick horse add state
  const [selectedNewHorseId, setSelectedNewHorseId] = useState('');

  // Form Fields for new Kosek
  const [kosekForm, setKosekForm] = useState({
    name: '',
    stallionId: '',
    location: 'Основное пастбище',
    description: ''
  });

  // Active living horses
  const livingHorses = horses.filter(h => h.status !== 'slaughtered' && h.status !== 'sold');
  
  // Available stallions who are NOT leading another kosek
  const leadingStallionIds = koseks.map(k => k.stallionId);
  const availableStallionsForLeadership = livingHorses.filter(
    h => h.gender === 'stallion' && (!leadingStallionIds.includes(h.id))
  );

  // All farm stallions (for switching leaders)
  const allFarmStallions = livingHorses.filter(h => h.gender === 'stallion');

  // Ensure index is valid
  const safeIndex = koseks.length > 0 
    ? Math.max(0, Math.min(activeKosekIndex, koseks.length - 1)) 
    : 0;

  const currentKosek = koseks[safeIndex] || null;

  // Preview Kosek leader & members helpers
  const previewLeader = previewKosek ? livingHorses.find(h => h.id === previewKosek.stallionId) : null;
  const previewMembers = previewKosek ? livingHorses.filter(h => h.kosekId === previewKosek.id && h.id !== previewKosek.stallionId) : [];

  // Carousel Navigation Handlers
  const handlePrevKosek = () => {
    if (koseks.length === 0) return;
    setActiveKosekIndex(prev => (prev > 0 ? prev - 1 : koseks.length - 1));
    setIsChangingStallion(false);
    setSelectedNewStallionId('');
  };

  const handleNextKosek = () => {
    if (koseks.length === 0) return;
    setActiveKosekIndex(prev => (prev < koseks.length - 1 ? prev + 1 : 0));
    setIsChangingStallion(false);
    setSelectedNewStallionId('');
  };

  // Focus a specific Kosek from the lower grid
  const handleFocusKosek = (index: number) => {
    setActiveKosekIndex(index);
    setIsChangingStallion(false);
    setSelectedNewStallionId('');
    // Smooth scroll up to navigator
    const el = document.getElementById('interactive-kosek-navigator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle Leader Stallion swap logic
  const handleStallionChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKosek || !selectedNewStallionId) return;

    const oldStallionId = currentKosek.stallionId;
    const newStallionId = selectedNewStallionId;

    // 1. Remove old stallion from this Kosek
    if (oldStallionId) {
      onMoveHorseToKosek(oldStallionId, null);
    }
    
    // 2. Relational Cleanup: If the new stallion was previously leading ANOTHER kosek, clear that other kosek's stallionId
    const otherKosekWithNewStallion = koseks.find(k => k.id !== currentKosek.id && k.stallionId === newStallionId);
    if (otherKosekWithNewStallion) {
      onUpdateKosek(otherKosekWithNewStallion.id, { stallionId: '' });
    }

    // 3. Assign new stallion to this Kosek
    onMoveHorseToKosek(newStallionId, currentKosek.id);
    
    // 4. Update Kosek's primary leader ID
    onUpdateKosek(currentKosek.id, { stallionId: newStallionId });

    // 5. Force open the stallion details card in the interactive navigator instantly
    setIsStallionActivated(true);

    setIsChangingStallion(false);
    setSelectedNewStallionId('');
  };

  // Quick Add Horse to current Kosek
  const handleQuickAddHorse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKosek || !selectedNewHorseId) return;

    onMoveHorseToKosek(selectedNewHorseId, currentKosek.id);
    setSelectedNewHorseId('');
  };

  // Remove a horse from current Kosek
  const handleRemoveHorseFromKosek = (horseId: string) => {
    const performRemove = () => {
      onMoveHorseToKosek(horseId, null);
    };

    if (onRequestConfirmation) {
      onRequestConfirmation(
        'Исключение из косяка',
        'Вы уверены, что хотите перевести это животное на свободный выгул вне косяка?',
        performRemove
      );
    } else if (confirm('Вы уверены, что хотите перевести это животное на свободный выгул вне косяка?')) {
      performRemove();
    }
  };

  // Create Kosek
  const handleCreateKosekSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kosekForm.name.trim() || !kosekForm.stallionId) return;

    onCreateKosek({
      name: kosekForm.name,
      stallionId: kosekForm.stallionId,
      location: kosekForm.location,
      description: kosekForm.description
    });

    // Reset Form
    setKosekForm({
      name: '',
      stallionId: '',
      location: 'Основное пастбище',
      description: ''
    });
    setShowAddModal(false);
    // Set view to the newly created group (which will be at the end)
    setActiveKosekIndex(koseks.length);
  };

  const handleMoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHorse) return;

    onMoveHorseToKosek(targetHorse.id, targetKosekId || null);
    setShowMoveModal(false);
    setTargetHorse(null);
  };

  const openMoveModal = (horse: Horse) => {
    setTargetHorse(horse);
    setTargetKosekId(horse.kosekId || '');
    setShowMoveModal(true);
  };

  // Gather current Kosek's leader stallion details
  const activeLeader = currentKosek 
    ? livingHorses.find(h => h.id === currentKosek.stallionId) 
    : null;

  // Gather current Kosek's other member horses
  const activeMares = currentKosek 
    ? livingHorses.filter(h => h.kosekId === currentKosek.id && h.id !== currentKosek.stallionId)
    : [];

  const getAgeInYears = (birthDateStr: string) => {
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const familyMares = activeMares.filter(h => h.gender === 'mare' && getAgeInYears(h.birthDate) >= 2);
  const familyFoals = activeMares.filter(h => getAgeInYears(h.birthDate) < 2);
  const familyOthers = activeMares.filter(h => h.gender !== 'mare' && getAgeInYears(h.birthDate) >= 2);

  // Potential horses to assign (exclude the leader stallion and current members)
  const assignableHorses = currentKosek
    ? livingHorses.filter(h => h.kosekId !== currentKosek.id && h.id !== currentKosek.stallionId)
    : [];

  return (
    <div id="kosek-management-tab" className="space-y-8">
      
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-950 text-xl tracking-tight">Семейства и Табуны (Косяки)</h2>
          <p className="text-xs text-slate-500">Управление естественными семейными группами лошадей во главе с жеребцом-лидером.</p>
        </div>
        <button 
          id="create-kosek-btn"
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-900/10 hover:shadow-emerald-900/20 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" /> Сформировать новое семейство
        </button>
      </div>

      {/* --- 1. INTERACTIVE CAROUSEL NAVIGATOR (Кнопки вперед/назад, фото, активация, управление) --- */}
      {koseks.length > 0 && currentKosek ? (
        <div 
          id="interactive-kosek-navigator"
          className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden transition-all duration-300"
        >
          {/* Carousel Control Bar */}
          <div className="bg-slate-900 px-6 py-4.5 flex items-center justify-between text-white shrink-0">
            {/* Back Button */}
            <button
              id="kosek-carousel-prev"
              onClick={handlePrevKosek}
              className="p-2 rounded-full bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95"
              title="Назад"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Central Title */}
            <div className="text-center">
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest">
                ИНТЕРАКТИВНЫЙ НАВИГАТОР СЕМЕЙСТВ
              </span>
              <h3 className="font-extrabold text-base md:text-lg text-white mt-0.5 tracking-tight flex items-center gap-2 justify-center">
                <span>{currentKosek.name.replace('Косяк', 'Семейство')}</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                  {safeIndex + 1} из {koseks.length}
                </span>
              </h3>
            </div>

            {/* Forward Button */}
            <button
              id="kosek-carousel-next"
              onClick={handleNextKosek}
              className="p-2 rounded-full bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95"
              title="Вперед"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Bento Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            
            {/* LEFT SIDE: Stallion Leader Card & Activation Profile */}
            <div className="lg:col-span-5 p-6 md:p-8 space-y-6 flex flex-col justify-between bg-slate-50/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-4.5 h-4.5 text-emerald-600 fill-emerald-500/10" /> Жеребец-Вожак
                  </h4>

                  {/* Active/Inactivated Toggle button */}
                  <button 
                    id="toggle-stallion-activation"
                    onClick={() => setIsStallionActivated(!isStallionActivated)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                      isStallionActivated 
                        ? 'bg-emerald-600 text-white shadow-emerald-900/10' 
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isStallionActivated ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                    <span>{isStallionActivated ? 'Информация: Активна' : 'Активировать данные'}</span>
                  </button>
                </div>

                {activeLeader ? (
                  <div className="space-y-4">
                    {/* Small Photo and Name of Stallion Leader with click handler to view detailed profile */}
                    <div 
                      onClick={() => setSelectedDetailHorse(activeLeader)}
                      className="group flex items-center gap-3.5 p-3.5 bg-white hover:bg-slate-100 border border-slate-200 hover:border-emerald-500 rounded-2xl cursor-pointer transition-all duration-200 shadow-xs active:scale-98"
                      title="Нажмите для просмотра информации о вожаке"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 group-hover:scale-105 transition-transform">
                        <img 
                          src={activeLeader.imageUrl || "https://images.unsplash.com/photo-1501472312651-726afd116ff1?w=150&auto=format&fit=crop&q=80"} 
                          alt={activeLeader.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            Вожак
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {getAgeText(activeLeader.birthDate)}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate mt-1">
                          {activeLeader.name}
                        </h5>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                          Масть: <strong className="text-slate-700">{activeLeader.coat}</strong> • Нажмите для подробностей
                        </p>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-emerald-50 transition-colors shrink-0">
                        <Info className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                      </div>
                    </div>

                    {/* Activated Information Panel */}
                    {isStallionActivated && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs space-y-3.5 animate-fadeIn">
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 text-slate-800">
                          <Info className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold">Служебные параметры жеребца</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-medium">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Масть</span>
                            <span className="text-slate-800">{activeLeader.coat}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Возраст</span>
                            <span className="text-slate-800">{getAgeText(activeLeader.birthDate)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Владелец</span>
                            <span className="text-slate-800 truncate block">{activeLeader.owner}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Статус</span>
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">Активен</span>
                          </div>
                        </div>
                        {activeLeader.notes && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Особые приметы / Характеристики</span>
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed italic">
                              "{activeLeader.notes}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-rose-800 text-xs flex flex-col items-center text-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                    <h5 className="font-bold">Жеребец-вожак не назначен!</h5>
                    <p className="text-slate-500 leading-relaxed max-w-xs">Группа осталась без лидера. Косяк нуждается в назначении дееспособного жеребца-производителя.</p>
                  </div>
                )}
              </div>

              {/* STALLION LEADER REPLACEMENT (Функция смены жеребца) */}
              <div className="pt-4 border-t border-slate-200">
                {!isChangingStallion ? (
                  <button
                    id="start-change-stallion-btn"
                    onClick={() => {
                      setIsChangingStallion(true);
                      setSelectedNewStallionId('');
                    }}
                    className="w-full text-center py-2.5 bg-white hover:bg-slate-100 border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-400 hover:text-emerald-500" />
                    <span>Сменить жеребца-вожака</span>
                  </button>
                ) : (
                  <form onSubmit={handleStallionChangeSubmit} className="space-y-3 p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/60 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Замена Вожака</span>
                      <button 
                        type="button" 
                        onClick={() => setIsChangingStallion(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Старый жеребец ({activeLeader?.name || 'не назначен'}) будет выведен на свободный выпас. Новый возглавит этот косяк.
                    </p>

                    <div className="flex gap-2">
                      <select
                        required
                        value={selectedNewStallionId}
                        onChange={(e) => setSelectedNewStallionId(e.target.value)}
                        className="flex-1 p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white text-xs font-semibold cursor-pointer text-slate-800"
                      >
                        <option value="">Выберите нового вожака...</option>
                        {allFarmStallions
                          .filter(st => st.id !== currentKosek.stallionId)
                          .map(st => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.coat} • {getAgeText(st.birthDate)}) {st.kosekId ? `(сейчас в: ${koseks.find(k=>k.id===st.kosekId)?.name || 'косяке'})` : '(свободный выпас)'}
                            </option>
                          ))
                        }
                      </select>
                      
                      <button
                        type="submit"
                        disabled={!selectedNewStallionId}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        Ок
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>

            {/* RIGHT SIDE: Kosek Members List & Live Herd Changes */}
            <div className="lg:col-span-7 p-6 md:p-8 space-y-6 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                      <Users className="w-4.5 h-4.5 text-emerald-600" /> Состав семейства
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Все лошади, кобылы, жеребята и молодняк в группе</p>
                  </div>
                  
                  {/* Quantity stat indicator */}
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-3.5 py-1.5 rounded-full font-extrabold self-start sm:self-auto flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Всего голов в семействе: {activeMares.length + (activeLeader ? 1 : 0)}</span>
                  </div>
                </div>

                {/* Scrollable list of current members in this Kosek divided into categories */}
                {activeMares.length > 0 ? (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                    
                    {/* Category 1: Mares (Кобылы) */}
                    {familyMares.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                          🐎 Кобылы (Маточное поголовье) — {familyMares.length}
                        </div>
                        <div className="divide-y divide-slate-100 pl-1">
                          {familyMares.map(mare => (
                            <div key={mare.id} className="py-2 flex items-center justify-between gap-4 group/item">
                              <div 
                                onClick={() => setSelectedDetailHorse(mare)}
                                className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-85 transition-all"
                              >
                                <div className="w-9 h-9 rounded-full border border-slate-200 overflow-hidden shrink-0 shadow-2xs bg-slate-50">
                                  <img 
                                    src={mare.imageUrl || "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=100&auto=format&fit=crop&q=80"} 
                                    alt={mare.name} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-800 truncate block">{mare.name}</span>
                                    {mare.isPregnant && (
                                      <span className="bg-rose-50 text-rose-600 font-bold text-[8px] px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                                        Жеребая
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">
                                    Масть: {mare.coat} • {getAgeText(mare.birthDate)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      onMoveHorseToKosek(mare.id, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[9px] py-1 px-2 rounded-lg font-bold cursor-pointer transition-all focus:outline-hidden"
                                >
                                  <option value="">Перевести...</option>
                                  {koseks
                                    .filter(k => k.id !== currentKosek.id)
                                    .map(k => (
                                      <option key={k.id} value={k.id}>В {k.name.replace('Косяк', 'Семейство')}</option>
                                    ))
                                  }
                                  <option value="">Свободный выпас</option>
                                </select>

                                <button 
                                  onClick={() => handleRemoveHorseFromKosek(mare.id)}
                                  className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-all cursor-pointer"
                                  title="Исключить"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Category 2: Foals and Youngsters (Жеребята) */}
                    {familyFoals.length > 0 && (
                      <div className="space-y-1.5 mt-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                          👶 Жеребята и Молодняк (до 2-х лет) — {familyFoals.length}
                        </div>
                        <div className="divide-y divide-slate-100 pl-1">
                          {familyFoals.map(foal => (
                            <div key={foal.id} className="py-2 flex items-center justify-between gap-4 group/item">
                              <div 
                                onClick={() => setSelectedDetailHorse(foal)}
                                className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-85 transition-all"
                              >
                                <div className="w-9 h-9 rounded-full border border-slate-200 overflow-hidden shrink-0 shadow-2xs bg-slate-50">
                                  <img 
                                    src={foal.imageUrl || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=100&auto=format&fit=crop&q=80"} 
                                    alt={foal.name} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-800 truncate block">{foal.name}</span>
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[8px] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                      {foal.gender === 'stallion' ? 'Жеребчик' : 'Кобылка'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">
                                    Масть: {foal.coat} • {getAgeText(foal.birthDate)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      onMoveHorseToKosek(foal.id, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[9px] py-1 px-2 rounded-lg font-bold cursor-pointer transition-all focus:outline-hidden"
                                >
                                  <option value="">Перевести...</option>
                                  {koseks
                                    .filter(k => k.id !== currentKosek.id)
                                    .map(k => (
                                      <option key={k.id} value={k.id}>В {k.name.replace('Косяк', 'Семейство')}</option>
                                    ))
                                  }
                                  <option value="">Свободный выпас</option>
                                </select>

                                <button 
                                  onClick={() => handleRemoveHorseFromKosek(foal.id)}
                                  className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-all cursor-pointer"
                                  title="Исключить"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Category 3: Others (Мерины и др.) */}
                    {familyOthers.length > 0 && (
                      <div className="space-y-1.5 mt-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                          🐎 Другие лошади в семействе — {familyOthers.length}
                        </div>
                        <div className="divide-y divide-slate-100 pl-1">
                          {familyOthers.map(horse => (
                            <div key={horse.id} className="py-2 flex items-center justify-between gap-4 group/item">
                              <div 
                                onClick={() => setSelectedDetailHorse(horse)}
                                className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-85 transition-all"
                              >
                                <div className="w-9 h-9 rounded-full border border-slate-200 overflow-hidden shrink-0 shadow-2xs bg-slate-50">
                                  <img 
                                    src={horse.imageUrl || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=100&auto=format&fit=crop&q=80"} 
                                    alt={horse.name} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-800 truncate block">{horse.name}</span>
                                    <span className="bg-slate-100 text-slate-600 font-extrabold text-[8px] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                      {horse.gender === 'gelding' ? 'Мерин' : 'Другой'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">
                                    Масть: {horse.coat} • {getAgeText(horse.birthDate)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      onMoveHorseToKosek(horse.id, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[9px] py-1 px-2 rounded-lg font-bold cursor-pointer transition-all focus:outline-hidden"
                                >
                                  <option value="">Перевести...</option>
                                  {koseks
                                    .filter(k => k.id !== currentKosek.id)
                                    .map(k => (
                                      <option key={k.id} value={k.id}>В {k.name.replace('Косяк', 'Семейство')}</option>
                                    ))
                                  }
                                  <option value="">Свободный выпас</option>
                                </select>

                                <button 
                                  onClick={() => handleRemoveHorseFromKosek(horse.id)}
                                  className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-all cursor-pointer"
                                  title="Исключить"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-1.5">
                    <p className="font-bold text-slate-500">В этом семействе пока нет членов</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Используйте форму ниже, чтобы добавить свободных кобыл или молодняк в состав группы.</p>
                  </div>
                )}
              </div>

              {/* QUICK HAREM CHANGES (Добавление лошадей в этот косяк) */}
              <div className="pt-4 border-t border-slate-100">
                <form onSubmit={handleQuickAddHorse} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-extrabold text-slate-800">Добавить лошадь в косяк</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedNewHorseId}
                      onChange={(e) => setSelectedNewHorseId(e.target.value)}
                      className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-semibold cursor-pointer text-slate-800"
                    >
                      <option value="">Выберите животное на ферме...</option>
                      {assignableHorses.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.gender === 'stallion' ? 'Жеребец' : h.gender === 'mare' ? 'Кобыла' : 'Мерин'} • {h.coat} • {getAgeText(h.birthDate)}) {h.kosekId ? `(сейчас в: ${koseks.find(k=>k.id===h.kosekId)?.name || 'группе'})` : '(свободный выпас)'}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      disabled={!selectedNewHorseId}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap active:scale-98 shadow-sm"
                    >
                      Добавить в состав
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>

          {/* Location and Disband row */}
          <div className="bg-slate-50 px-6 py-4.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Текущее пастбище:</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md">
                {currentKosek.location || 'Не указано'}
              </span>
            </div>

            <button 
              id={`navigator-disband-${currentKosek.id}`}
              onClick={() => {
                const performDisband = () => {
                  onDeleteKosek(currentKosek.id);
                };

                if (onRequestConfirmation) {
                  onRequestConfirmation(
                    'Распустить косяк',
                    `Вы уверены, что хотите распустить косяк "${currentKosek.name}"? Все лошади этой группы будут переведены на свободный выгул вне групп.`,
                    performDisband
                  );
                } else if (confirm(`Вы уверены, что хотите распустить косяк "${currentKosek.name}"? Все лошади этой группы будут переведены на свободный выгул вне групп.`)) {
                  performDisband();
                }
              }}
              className="text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 font-bold text-xs px-4.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs self-end sm:self-auto"
            >
              Распустить этот косяк
            </button>
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-md space-y-4">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 text-xl">
            🐎
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-slate-900 text-lg">Косяки не сформированы</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              На вашей конеферме еще не зарегистрировано ни одной племенной группы (косяка). Сформируйте первый косяк, используя зеленую кнопку выше.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md inline-block"
          >
            Сформировать косяк сейчас
          </button>
        </div>
      )}

      {/* --- 2. GENERAL GRID SUMMARY (Общий список косяков) --- */}
      <div className="space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-950 text-base tracking-tight">Общий сводный реестр</h3>
          <p className="text-xs text-slate-400">Нажмите на любой косяк, чтобы открыть подробную карточку с полноразмерным фото и кратким содержанием.</p>
        </div>

        <div id="koseks-group" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {koseks.map((kosek, idx) => {
            const leaderStallion = livingHorses.find(h => h.id === kosek.stallionId);
            const members = livingHorses.filter(h => h.kosekId === kosek.id && h.id !== kosek.stallionId);
            const isActiveInNavigator = currentKosek?.id === kosek.id;

            return (
              <div 
                key={kosek.id} 
                id={`kosek-group-card-${kosek.id}`}
                onClick={() => {
                  setPreviewKosek(kosek);
                }}
                className={`rounded-2xl border transition-all duration-300 p-3.5 cursor-pointer flex items-center gap-3.5 bg-white hover:border-emerald-500 hover:shadow-md ${
                  isActiveInNavigator 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10' 
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Small photo of the Stallion/Leader */}
                <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 shadow-2xs">
                  <img 
                    src={leaderStallion?.imageUrl || "https://images.unsplash.com/photo-1501472312651-726afd116ff1?w=100&auto=format&fit=crop&q=80"} 
                    alt={leaderStallion?.name || kosek.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name & Basic headcount */}
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-xs text-slate-900 truncate">
                    {kosek.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                    Лидер: {leaderStallion?.name || 'Не назначен'}
                  </p>
                  <span className="inline-block text-[9px] text-emerald-700 bg-emerald-55/60 px-1.5 py-0.5 rounded-md font-bold mt-1">
                    {members.length + (leaderStallion ? 1 : 0)} голов
                  </span>
                </div>

                {/* Micro info action button */}
                <div className="text-slate-400 p-1 bg-slate-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- 3. FREE RANGE / UNASSIGNED HORSES BLOCK (Свободный выпас) --- */}
      <div id="unassigned-horses-block" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="pb-3 border-b border-slate-100 mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-emerald-600" /> Лошади вне косяков (Свободный выпас)
            </h3>
            <p className="text-xs text-slate-400">Животные, временно не прикрепленные к племенным косякам.</p>
          </div>
          
          <div className="bg-slate-100 text-slate-700 text-xs px-3.5 py-1.5 rounded-full font-bold self-start sm:self-auto">
            Свободных животных: {livingHorses.filter(h => h.kosekId === null).length}
          </div>
        </div>
        
        {livingHorses.filter(h => h.kosekId === null).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {livingHorses.filter(h => h.kosekId === null).map(horse => (
              <div 
                key={horse.id} 
                id={`unassigned-card-${horse.id}`}
                className="p-3 rounded-2xl border border-slate-200/70 flex flex-col justify-between items-center text-center bg-slate-50/50 hover:border-emerald-300 hover:bg-white transition-all shadow-2xs group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden mb-2 border border-slate-200 group-hover:scale-105 transition-transform">
                  <img 
                    src={horse.imageUrl || "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=100&auto=format&fit=crop&q=80"} 
                    alt={horse.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-extrabold text-xs text-slate-800 line-clamp-1">{horse.name}</h4>
                <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md mt-1.5 uppercase font-extrabold">
                  {horse.gender === 'stallion' ? 'Жеребец' : horse.gender === 'mare' ? 'Кобыла' : 'Мерин'}
                </span>
                
                <button 
                  id={`assign-to-kosek-${horse.id}`}
                  onClick={() => openMoveModal(horse)}
                  className="mt-3 text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  Определить в косяк <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
            Все активные животные племенной фермы успешно распределены по репродуктивным косякам.
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Create Kosek Modal */}
      {showAddModal && (
        <div id="create-kosek-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-100 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Сформировать новый косяк</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateKosekSubmit} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Название косяка <span className="text-rose-500">*</span></label>
                  <input 
                    type="text"
                    required
                    value={kosekForm.name}
                    onChange={(e) => setKosekForm({ ...kosekForm, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                    placeholder="Например, Косяк Тайфуна"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Выбрать Жеребца-лидера <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={kosekForm.stallionId}
                    onChange={(e) => setKosekForm({ ...kosekForm, stallionId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 cursor-pointer text-slate-800 text-xs font-semibold"
                  >
                    <option value="">Выберите свободного жеребца...</option>
                    {availableStallionsForLeadership.map(st => (
                      <option key={st.id} value={st.id}>{st.name} ({st.coat}, {getAgeText(st.birthDate)})</option>
                    ))}
                  </select>
                  {availableStallionsForLeadership.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-medium mt-1">Нет свободных жеребцов в базе. Сначала зарегистрируйте нового жеребца.</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Локация / Пастбище</label>
                  <input 
                    type="text"
                    value={kosekForm.location}
                    onChange={(e) => setKosekForm({ ...kosekForm, location: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Описание / Заметки</label>
                  <textarea 
                    value={kosekForm.description}
                    onChange={(e) => setKosekForm({ ...kosekForm, description: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 h-16 text-slate-800 text-xs font-semibold"
                    placeholder="Характеристики косяка, цели селекции..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  disabled={!kosekForm.stallionId}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  Сформировать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move / Assign Horse to Kosek Modal */}
      {showMoveModal && targetHorse && (
        <div id="move-horse-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-100 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Определить животное в косяк</h3>
              <button onClick={() => setShowMoveModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
              <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 overflow-hidden shrink-0">
                <img 
                  src={targetHorse.imageUrl || "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=100&auto=format&fit=crop&q=80"} 
                  alt={targetHorse.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{targetHorse.name}</h4>
                <p className="text-[10px] text-slate-500">Масть: {targetHorse.coat} • Пол: {targetHorse.gender === 'stallion' ? 'Жеребец' : targetHorse.gender === 'mare' ? 'Кобыла' : 'Мерин'}</p>
              </div>
            </div>

            <form onSubmit={handleMoveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Выбрать племенной косяк</label>
                <select
                  value={targetKosekId}
                  onChange={(e) => setTargetKosekId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 cursor-pointer text-slate-800 text-xs font-semibold"
                >
                  <option value="">Свободный выгул (изъять из всех косяков)</option>
                  {koseks.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer active:scale-98"
                >
                  Переместить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Preview Modal with full photo & brief summary */}
      {previewKosek && (
        <div id="preview-kosek-modal" className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-fadeIn flex flex-col max-h-[90vh]">
            
            {/* Full-size photograph of Stallion Leader with a dark gradient overlay */}
            <div className="relative h-56 w-full bg-slate-900 shrink-0">
              <img 
                src={previewLeader?.imageUrl || "https://images.unsplash.com/photo-1501472312651-726afd116ff1?w=600&auto=format&fit=crop&q=80"} 
                alt={previewKosek.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover animate-pulse-once"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              
              {/* Close Button on top right */}
              <button 
                onClick={() => setPreviewKosek(null)} 
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-md hover:bg-white/45 text-white p-2 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & Location inside image overlay */}
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Племенной Косяк
                </span>
                <h3 className="text-xl font-black tracking-tight mt-1">{previewKosek.name}</h3>
                <p className="text-xs text-slate-200 flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {previewKosek.location || 'Пастбище не указано'}
                </p>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-4.5 overflow-y-auto text-xs text-slate-700">
              {/* Stallion Leader Details */}
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/60 space-y-2.5">
                <h4 className="font-extrabold text-emerald-950 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  👑 Вожак косяка (Жеребец)
                </h4>
                {previewLeader ? (
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-900">{previewLeader.name}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
                      <p>Владелец: <strong className="text-slate-700">{previewLeader.owner || '—'}</strong></p>
                      <p>Возраст: <strong className="text-slate-700">{getAgeText(previewLeader.birthDate)}</strong></p>
                      <p>Масть: <strong className="text-slate-700">{previewLeader.coat}</strong></p>
                      <p>Статус: <strong className="text-slate-700">Активен</strong></p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">Жеребец-лидер не назначен для этой группы.</p>
                )}
              </div>

              {/* Headcount Stat Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-extrabold">Всего</span>
                  <span className="text-lg font-black text-slate-800">{previewMembers.length + (previewLeader ? 1 : 0)}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-extrabold">Жеребцы</span>
                  <span className="text-lg font-black text-slate-800">{previewLeader ? 1 : 0}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-extrabold">Кобылы</span>
                  <span className="text-lg font-black text-slate-800">{previewMembers.length}</span>
                </div>
              </div>

              {/* Description if any */}
              {previewKosek.description && (
                <div className="space-y-1">
                  <h5 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Описание косяка</h5>
                  <p className="text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{previewKosek.description}"
                  </p>
                </div>
              )}

              {/* Composition / Member list */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                  <h5 className="font-extrabold text-[11px] uppercase text-slate-500 tracking-wider">
                    Зарегистрированные члены семейства ({previewMembers.length})
                  </h5>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-100">
                    Состав группы
                  </span>
                </div>

                {previewMembers.length > 0 ? (
                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                    
                    {/* Category 1: Mares */}
                    {previewMembers.filter(m => m.gender === 'mare' && getAgeInYears(m.birthDate) >= 2).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg">
                          Кобылы (Маточное поголовье) — {previewMembers.filter(m => m.gender === 'mare' && getAgeInYears(m.birthDate) >= 2).length}
                        </p>
                        {previewMembers.filter(m => m.gender === 'mare' && getAgeInYears(m.birthDate) >= 2).map((m, mIdx) => (
                          <div key={m.id} className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/50 transition-colors gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300/40">
                                <img src={m.imageUrl || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=120&auto=format&fit=crop&q=80"} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-[12px] text-slate-900 truncate">{m.name}</p>
                                <p className="text-[10px] text-slate-400 truncate font-semibold mt-0.5">Масть: {m.coat}</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{getAgeText(m.birthDate)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Category 2: Foals */}
                    {previewMembers.filter(m => getAgeInYears(m.birthDate) < 2).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg">
                          Жеребята и Молодняк (до 2 лет) — {previewMembers.filter(m => getAgeInYears(m.birthDate) < 2).length}
                        </p>
                        {previewMembers.filter(m => getAgeInYears(m.birthDate) < 2).map((m, mIdx) => (
                          <div key={m.id} className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/50 transition-colors gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300/40">
                                <img src={m.imageUrl || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=120&auto=format&fit=crop&q=80"} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-[12px] text-slate-900 truncate">{m.name}</p>
                                <p className="text-[10px] text-slate-400 truncate font-semibold mt-0.5">Масть: {m.coat} • {m.gender === 'stallion' ? 'Жеребчик' : 'Кобылка'}</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{getAgeText(m.birthDate)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Category 3: Others */}
                    {previewMembers.filter(m => m.gender !== 'mare' && getAgeInYears(m.birthDate) >= 2).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg">
                          Другие члены семейства — {previewMembers.filter(m => m.gender !== 'mare' && getAgeInYears(m.birthDate) >= 2).length}
                        </p>
                        {previewMembers.filter(m => m.gender !== 'mare' && getAgeInYears(m.birthDate) >= 2).map((m, mIdx) => (
                          <div key={m.id} className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/50 transition-colors gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300/40">
                                <img src={m.imageUrl || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=120&auto=format&fit=crop&q=80"} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-[12px] text-slate-900 truncate">{m.name}</p>
                                <p className="text-[10px] text-slate-400 truncate font-semibold mt-0.5">Масть: {m.coat} • Мерин</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{getAgeText(m.birthDate)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px] py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Лошади в это семейство еще не добавлены.
                  </p>
                )}
              </div>
            </div>

            {/* Footer with action buttons */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-2.5">
              <button 
                onClick={() => setPreviewKosek(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-all cursor-pointer text-center text-xs"
              >
                Закрыть
              </button>
              <button 
                onClick={() => {
                  const idx = koseks.findIndex(k => k.id === previewKosek.id);
                  if (idx !== -1) {
                    handleFocusKosek(idx);
                  }
                  setPreviewKosek(null);
                  document.getElementById('interactive-kosek-navigator')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-xs text-center text-xs flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Sliders className="w-4 h-4" />
                <span>Корректировать</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {selectedDetailHorse && (
        <HorseDetailModal 
          horse={selectedDetailHorse} 
          onClose={() => setSelectedDetailHorse(null)} 
          allHorses={horses} 
          onUpdateHorse={onUpdateHorse}
        />
      )}

    </div>
  );

  function getAgeText(birthDateStr: string) {
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age === 0) {
      const months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
      if (months <= 0) return 'Меньше месяца';
      return `${months} мес.`;
    }
    
    if (age === 1) return '1 год';
    if (age > 1 && age < 5) return `${age} года`;
    return `${age} лет`;
  }
}
