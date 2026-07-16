/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Horse, HorseGender } from '../types';
import HorseDetailModal from './HorseDetailModal';
import CameraCapture from './CameraCapture';
import Modal from './ui/Modal';
import { 
  Heart, 
  Calendar, 
  Baby, 
  GitBranch, 
  Plus, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface MaresTabProps {
  horses: Horse[];
  onAddHorse: (newHorse: Omit<Horse, 'id'>) => void;
  onUpdateHorse: (id: string, updatedFields: Partial<Horse>) => void;
  currentAdminName: string;
}

const PRESET_FOAL_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1593952715037-c1368e74a193?w=400&auto=format&fit=crop&q=80',
    label: 'Рыжий жеребенок'
  },
  {
    url: 'https://images.unsplash.com/photo-1551887196-72eb300186c8?w=400&auto=format&fit=crop&q=80',
    label: 'Гнедой малыш'
  },
  {
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&auto=format&fit=crop&q=80',
    label: 'Пасущийся жеребенок'
  },
  {
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    label: 'Вороной в загоне'
  }
];

export default function MaresTab({
  horses,
  onAddHorse,
  onUpdateHorse,
  currentAdminName
}: MaresTabProps) {
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [pregnancyFilter, setPregnancyFilter] = useState<'all' | 'pregnant' | 'not-pregnant'>('all');
  
  // Collapsed/Expanded Lineage states
  const [expandedLineage, setExpandedLineage] = useState<Record<string, boolean>>({});

  // Birth Modal State
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [selectedMare, setSelectedMare] = useState<Horse | null>(null);
  const [selectedDetailHorse, setSelectedDetailHorse] = useState<Horse | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  
  // Breeding Modal State
  const [showBreedingModal, setShowBreedingModal] = useState(false);
  
  // Birth Form fields
  const [birthForm, setBirthForm] = useState({
    name: '',
    gender: 'stallion' as HorseGender,
    coat: 'Гнедая',
    birthDate: new Date().toISOString().split('T')[0],
    imageUrl: PRESET_FOAL_IMAGES[0].url,
    sireId: ''
  });

  // Custom coat input states
  const [customCoatInput, setCustomCoatInput] = useState('');
  const [isCustomCoatSelected, setIsCustomCoatSelected] = useState(false);

  // Breeding Form fields
  const [breedingForm, setBreedingForm] = useState({
    pregnancyDate: new Date().toISOString().split('T')[0],
    pregnancyDueDate: new Date(Date.now() + 340 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // ~11 months gestation
    sireId: ''
  });

  // Filter mares
  const activeMares = horses.filter(h => h.gender === 'mare' && h.status !== 'slaughtered' && h.status !== 'sold');
  const stallions = horses.filter(h => h.gender === 'stallion' && h.status !== 'slaughtered' && h.status !== 'sold');

  const filteredMares = activeMares.filter(mare => {
    const matchesSearch = mare.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          mare.coat.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (pregnancyFilter === 'pregnant') {
      return matchesSearch && mare.isPregnant;
    }
    if (pregnancyFilter === 'not-pregnant') {
      return matchesSearch && !mare.isPregnant;
    }
    return matchesSearch;
  });

  // Toggle Lineage display
  const toggleLineage = (mareId: string) => {
    setExpandedLineage(prev => ({
      ...prev,
      [mareId]: !prev[mareId]
    }));
  };

  // Helper: Mating calculation for 12 days notice
  const renderFoalingMatingStatus = (mare: Horse) => {
    if (!mare.lastFoalingDate || mare.isPregnant) return null;
    
    const foaledDate = new Date(mare.lastFoalingDate);
    const today = new Date();
    
    foaledDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffTime = today.getTime() - foaledDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const targetDate = new Date(foaledDate);
    targetDate.setDate(foaledDate.getDate() + 12);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    let bannerBg = 'bg-blue-50/50 border-blue-100 text-blue-950';
    let titleColor = 'text-blue-500';
    let strongColor = 'text-blue-900';
    let statusText = '';
    let badge = null;
    
    if (diffDays < 11) {
      const daysLeft = 12 - diffDays;
      statusText = `До вольного выгула (срока «погулять») осталось ${daysLeft} дней.`;
      badge = (
        <span className="text-[9px] bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0">
          Ожидание (12 дней)
        </span>
      );
    } else if (diffDays >= 11 && diffDays <= 14) {
      bannerBg = 'bg-amber-50 border-amber-200 text-amber-950 animate-pulse';
      titleColor = 'text-amber-600';
      strongColor = 'text-amber-900';
      statusText = `⚠️ СРОЧНО: Кобыле пора погулять! Прошло ровно ${diffDays} дней с момента родов.`;
      badge = (
        <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-xs animate-bounce shrink-0">
          🔥 ПОРА ПОГУЛЯТЬ
        </span>
      );
    } else {
      bannerBg = 'bg-rose-50/80 border-rose-100 text-rose-950';
      titleColor = 'text-rose-500';
      strongColor = 'text-rose-900';
      statusText = `⚠️ Пропущена плановая дата случки. Прошло уже ${diffDays} дней с момента выжеребки.`;
      badge = (
        <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0">
          Срок превышен
        </span>
      );
    }
    
    return (
      <div className={`p-4 rounded-2xl border ${bannerBg} grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-3`}>
        <div className="space-y-0.5">
          <span className={`${titleColor} text-[10px] uppercase font-black tracking-wider block flex items-center gap-1`}>
            <span>📅 Дата последних родов</span>
          </span>
          <strong className={`${strongColor} font-extrabold text-sm`}>{mare.lastFoalingDate}</strong>
        </div>
        <div className="space-y-0.5">
          <span className={`${titleColor} text-[10px] uppercase font-black tracking-wider block`}>🎯 Рекомендуемый день случки</span>
          <strong className={`${strongColor} font-extrabold text-sm`}>{targetDateStr} (12-й день)</strong>
        </div>
        <div className="space-y-0.5 md:border-l md:border-slate-200 md:pl-4 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1 justify-between sm:justify-start">
            <span className={`${titleColor} text-[10px] uppercase font-black tracking-wider`}>Статус репродукции</span>
            {badge}
          </div>
          <p className="font-bold text-slate-700 leading-tight">{statusText}</p>
        </div>
      </div>
    );
  };

  // Helper: render age text
  function getAgeText(birthDateStr: string) {
    if (!birthDateStr) return 'Возраст неизвестен';
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

  // Open Birth modal
  const openBirthModal = (mare: Horse) => {
    setSelectedMare(mare);
    const standardCoats = ['Гнедая', 'Вороная', 'Серая', 'Рыжая', 'Саврасая', 'Буланая', 'Чубарая'];
    const isCustom = !standardCoats.includes(mare.coat);
    setIsCustomCoatSelected(isCustom);
    setCustomCoatInput(isCustom ? mare.coat : '');
    setBirthForm({
      name: '',
      gender: 'stallion',
      coat: isCustom ? 'custom' : mare.coat, // Default foal's coat to mother's coat
      birthDate: new Date().toISOString().split('T')[0],
      imageUrl: PRESET_FOAL_IMAGES[Math.floor(Math.random() * PRESET_FOAL_IMAGES.length)].url,
      sireId: mare.notes?.match(/Отец жеребенка: ([^\n,]+)/)?.[1] || '' // Check if we noted sire in breeding
    });
    setShowBirthModal(true);
  };

  // Open Breeding modal
  const openBreedingModal = (mare: Horse) => {
    setSelectedMare(mare);
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 340); // Standard horse gestation is ~340 days

    setBreedingForm({
      pregnancyDate: today.toISOString().split('T')[0],
      pregnancyDueDate: dueDate.toISOString().split('T')[0],
      sireId: ''
    });
    setShowBreedingModal(true);
  };

  // Submit Breeding info
  const handleBreedingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMare) return;

    const sire = stallions.find(s => s.id === breedingForm.sireId);
    const sireText = sire ? `Отец жеребенка: ${sire.name}` : 'Жеребец неизвестен';

    onUpdateHorse(selectedMare.id, {
      isPregnant: true,
      pregnancyDate: breedingForm.pregnancyDate,
      pregnancyDueDate: breedingForm.pregnancyDueDate,
      notes: selectedMare.notes ? `${selectedMare.notes}\nСлучка: ${breedingForm.pregnancyDate}, ${sireText}` : `Случка: ${breedingForm.pregnancyDate}, ${sireText}`
    });

    // Write event to Farm History
    try {
      const savedEvents = localStorage.getItem('farm_history_events');
      const eventsList = savedEvents ? JSON.parse(savedEvents) : [];
      const newEvent = {
        id: `e-${Date.now()}`,
        date: breedingForm.pregnancyDate,
        category: 'general',
        title: 'Зарегистрирована случка кобылы',
        description: `Кобыла ${selectedMare.name} была покрыта жеребцом ${sire ? sire.name : 'неизвестным'}. Ожидаемый срок выжеребки: ${breedingForm.pregnancyDueDate}.`,
        horseName: selectedMare.name,
        operator: currentAdminName
      };
      localStorage.setItem('farm_history_events', JSON.stringify([newEvent, ...eventsList]));
    } catch (e) {
      console.error(e);
    }

    setShowBreedingModal(false);
    setSelectedMare(null);
  };

  // Submit Birth
  const handleBirthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMare) return;

    const sire = horses.find(h => h.id === birthForm.sireId);
    const actualCoat = isCustomCoatSelected ? (customCoatInput.trim() || 'Другая') : birthForm.coat;

    // 1. Register Foal
    onAddHorse({
      name: birthForm.name,
      coat: actualCoat,
      birthDate: birthForm.birthDate,
      gender: birthForm.gender,
      sireId: birthForm.sireId || null,
      sireName: sire ? sire.name : undefined,
      damId: selectedMare.id,
      damName: selectedMare.name,
      owner: selectedMare.owner,
      status: 'active',
      imageUrl: birthForm.imageUrl,
      kosekId: selectedMare.kosekId,
      notes: `Рожден от кобылы ${selectedMare.name} при выжеребке ${birthForm.birthDate}.`
    });

    // 2. Mark mother as no longer pregnant
    onUpdateHorse(selectedMare.id, {
      isPregnant: false,
      pregnancyDate: '',
      pregnancyDueDate: '',
      lastFoalingDate: birthForm.birthDate
    });

    // 3. Register event in Farm History
    try {
      const savedEvents = localStorage.getItem('farm_history_events');
      const eventsList = savedEvents ? JSON.parse(savedEvents) : [];
      const newEvent = {
        id: `e-${Date.now()}`,
        date: birthForm.birthDate,
        category: 'birth',
        title: 'Успешная выжеребка кобылы',
        description: `У кобылы ${selectedMare.name} успешно родился жеребенок ${birthForm.name} (пол: ${birthForm.gender === 'stallion' ? 'жеребчик' : 'кобылка'}, масть: ${actualCoat}). Состояние отличное.`,
        horseName: birthForm.name,
        operator: currentAdminName
      };
      localStorage.setItem('farm_history_events', JSON.stringify([newEvent, ...eventsList]));
    } catch (e) {
      console.error(e);
    }

    setShowBirthModal(false);
    setSelectedMare(null);
  };

  // Render Maternal Descendants Lineage Tree ("как древо от нее")
  // Recursively find children, grandchildren, etc.
  const renderMaternalDescendantsTree = (mare: Horse) => {
    // Level 1: Her immediate children
    const level1 = horses.filter(h => h.damId === mare.id);

    if (level1.length === 0) {
      return (
        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
          У этой кобылы пока нет зарегистрированного потомства.
        </div>
      );
    }

    return (
      <div className="relative pl-2 md:pl-4 border-l border-emerald-100 space-y-4">
        {level1.map(child => {
          // Level 2: Grandchildren from this child (if female)
          const level2 = child.gender === 'mare' ? horses.filter(h => h.damId === child.id) : [];

          return (
            <div key={child.id} className="relative pl-6">
              {/* Visual connector bar */}
              <div className="absolute left-0 top-5 w-5 h-px bg-emerald-200"></div>
              
              {/* Level 1 Child Box */}
              <div className="bg-slate-50 hover:bg-slate-100/70 p-3 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-200 border border-slate-300/50 shrink-0">
                    <img 
                      src={child.imageUrl || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=100&auto=format&fit=crop&q=80"} 
                      alt={child.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-[13px] text-slate-900">{child.name}</h5>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        child.gender === 'stallion' 
                          ? 'bg-sky-50 text-sky-800 border border-sky-100' 
                          : child.gender === 'mare'
                            ? 'bg-rose-50 text-rose-800 border border-rose-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-100'
                      }`}>
                        {child.gender === 'stallion' ? 'Жеребчик' : child.gender === 'mare' ? 'Кобылка' : 'Мерин'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Масть: <strong className="text-slate-700">{child.coat}</strong> • Рождение: {child.birthDate} ({getAgeText(child.birthDate)})
                    </p>
                  </div>
                </div>

                {child.gender === 'mare' && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md border border-emerald-100 block md:inline-block w-max">
                    Маточная ветвь
                  </span>
                )}
              </div>

              {/* Level 2 Grandchildren (Nested recurse) */}
              {level2.length > 0 && (
                <div className="mt-3 ml-4 md:ml-8 relative pl-2 md:pl-4 border-l border-emerald-200 space-y-3.5">
                  <div className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Внуки от {child.name}
                  </div>
                  {level2.map(grandchild => (
                    <div key={grandchild.id} className="relative pl-6">
                      <div className="absolute left-0 top-4 w-4 h-px bg-emerald-200"></div>
                      <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/60 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                          <img 
                            src={grandchild.imageUrl || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=100&auto=format&fit=crop&q=80"} 
                            alt={grandchild.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[12px] text-slate-900">{grandchild.name}</span>
                            <span className={`text-[8px] font-bold px-1 py-0.2 rounded-full ${
                              grandchild.gender === 'stallion' ? 'bg-sky-50 text-sky-800' : 'bg-rose-50 text-rose-800'
                            }`}>
                              {grandchild.gender === 'stallion' ? 'Жеребчик' : 'Кобылка'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Масть: {grandchild.coat} • {getAgeText(grandchild.birthDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div id="mares-tab-container" className="space-y-6">
      
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-rose-700 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="max-w-2xl">
          <span className="bg-rose-800/60 text-rose-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Селекция и Репродуктивный контроль
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-2">Маточное поголовье и Приплод</h2>
          <p className="text-rose-50/90 mt-1.5 text-xs leading-relaxed">
            Раздел для управления кобылами хозяйства. Учет беременностей (жеребости), регистрация выжеребки, 
            автоматическое заведение родившихся жеребят в базу данных и построение генеалогического древа потомства по женской линии.
          </p>
        </div>

        {/* Counter Stats */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="bg-rose-950/20 backdrop-blur-md border border-rose-500/25 p-4 rounded-2xl text-center flex-1 md:flex-none min-w-[120px]">
            <span className="text-[9px] text-rose-200 font-extrabold uppercase tracking-wider block">Всего кобыл</span>
            <span className="text-3xl font-black block mt-1 text-white">{activeMares.length}</span>
          </div>
          <div className="bg-rose-950/20 backdrop-blur-md border border-rose-500/25 p-4 rounded-2xl text-center flex-1 md:flex-none min-w-[120px]">
            <span className="text-[9px] text-rose-200 font-extrabold uppercase tracking-wider block">Жеребых</span>
            <span className="text-3xl font-black block mt-1 text-white">{activeMares.filter(m => m.isPregnant).length}</span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск кобылы по кличке или масти..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        <div className="flex gap-1.5 shrink-0">
          {[
            { id: 'all', label: 'Все кобылы' },
            { id: 'pregnant', label: 'Только жеребые (беременные)' },
            { id: 'not-pregnant', label: 'Не беременные' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setPregnancyFilter(opt.id as any)}
              className={`text-[11px] font-bold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                pregnancyFilter === opt.id 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid List of Mares */}
      {filteredMares.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredMares.map(mare => {
            const hasChildren = horses.some(h => h.damId === mare.id);
            const childrenCount = horses.filter(h => h.damId === mare.id).length;

            return (
              <div 
                key={mare.id}
                id={`mare-item-${mare.id}`}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-5 hover:border-rose-300 transition-all"
              >
                {/* Mare Header Block */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-100 pb-5">
                  <div 
                    onClick={() => setSelectedDetailHorse(mare)}
                    className="flex items-center gap-4.5 cursor-pointer hover:opacity-85 transition-all"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs shrink-0">
                      <img 
                        src={mare.imageUrl || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80"} 
                        alt={mare.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-lg hover:text-rose-600 transition-colors">{mare.name}</h3>
                        <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded-full font-extrabold">
                          Кобыла • {getAgeText(mare.birthDate)}
                        </span>
                        
                        {mare.isPregnant && (
                          <span className="text-[10px] bg-rose-600 text-white font-black px-2.5 py-0.5 rounded-full shadow-xs animate-pulse flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-white" /> ЖЕРЕБАЯ
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Масть: <strong className="text-slate-700 font-semibold">{mare.coat}</strong> • Владелец: {mare.owner} • <span className="text-rose-500 font-bold text-[10px] uppercase">Нажмите для карточки 📋</span>
                      </p>
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {/* If Pregnant: Trigger Birth registration */}
                    {mare.isPregnant ? (
                      <button
                        onClick={() => openBirthModal(mare)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Baby className="w-4.5 h-4.5 animate-bounce" /> Зарегистрировать роды (Ожеребилась)
                      </button>
                    ) : (
                      <button
                        onClick={() => openBreedingModal(mare)}
                        className="border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Heart className="w-4 h-4 text-rose-500" /> Отметить покрытие (случку)
                      </button>
                    )}

                    {/* View descendants lineage tree toggle */}
                    <button
                      onClick={() => toggleLineage(mare.id)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <GitBranch className="w-4 h-4 text-slate-500" />
                      <span>Древо потомства ({childrenCount})</span>
                      {expandedLineage[mare.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Pregnant Detailed Banner Info */}
                {mare.isPregnant && (
                  <div className="bg-rose-50/50 p-4.5 rounded-2xl border border-rose-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-rose-950">
                    <div className="space-y-0.5">
                      <span className="text-rose-500 text-[10px] uppercase font-black tracking-wider block">Дата спаривания (случки)</span>
                      <strong className="text-rose-900 font-extrabold text-sm">{mare.pregnancyDate || 'Не указана'}</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-rose-500 text-[10px] uppercase font-black tracking-wider block">Ожидаемый срок родов (выжеребки)</span>
                      <strong className="text-rose-900 font-extrabold text-sm">{mare.pregnancyDueDate || 'Приблизительно 11 мес.'}</strong>
                    </div>
                    <div className="space-y-0.5 md:border-l md:border-rose-100 md:pl-4">
                      <span className="text-rose-500 text-[10px] uppercase font-black tracking-wider block">Репродуктивный статус</span>
                      <strong className="text-rose-900 font-black text-[13px] block">Идет вынашивание плода</strong>
                    </div>
                  </div>
                )}

                {renderFoalingMatingStatus(mare)}

                {/* Collapsible descendants lineage tree */}
                {expandedLineage[mare.id] && (
                  <div className="bg-emerald-50/20 p-4 md:p-5 rounded-2xl border border-emerald-100/40 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-emerald-100/40">
                      <GitBranch className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-extrabold text-slate-900 text-sm">Генеалогическая линия потомков от {mare.name}</h4>
                    </div>
                    {renderMaternalDescendantsTree(mare)}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl space-y-3">
          <Baby className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="max-w-xs mx-auto">
            <p className="font-bold text-slate-700 text-sm">Кобылы не найдены</p>
            <p className="text-xs text-slate-400">
              Попробуйте сбросить поисковые фильтры или добавьте кобылу через вкладку Базы Данных.
            </p>
          </div>
        </div>
      )}

      {/* --- BREEDING / COVERING DIALOG --- */}
      <Modal
        open={showBreedingModal && !!selectedMare}
        onClose={() => { setShowBreedingModal(false); setSelectedMare(null); }}
        panelId="breeding-modal"
        panelClassName="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-100"
      >
        {selectedMare && (
          <>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>Отметить покрытие кобылы</span>
              </h3>
              <button onClick={() => { setShowBreedingModal(false); setSelectedMare(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="bg-rose-50/50 p-3 rounded-xl text-rose-950 text-xs">
              Фиксация случки для кобылы: <strong>{selectedMare.name}</strong>. Система автоматически рассчитает ориентировочный срок вынашивания плода (~340 суток).
            </div>

            <form onSubmit={handleBreedingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Жеребец-производитель (Отец)</label>
                <select
                  required
                  value={breedingForm.sireId}
                  onChange={(e) => setBreedingForm({ ...breedingForm, sireId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50"
                >
                  <option value="">Выберите жеребца из хозяйства</option>
                  {stallions.map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.coat})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Дата случки</label>
                  <input 
                    type="date"
                    required
                    value={breedingForm.pregnancyDate}
                    onChange={(e) => {
                      const selDate = new Date(e.target.value);
                      const due = new Date(selDate);
                      due.setDate(selDate.getDate() + 340);
                      setBreedingForm({ 
                        ...breedingForm, 
                        pregnancyDate: e.target.value,
                        pregnancyDueDate: due.toISOString().split('T')[0]
                      });
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Ожидаемые роды</label>
                  <input 
                    type="date"
                    required
                    value={breedingForm.pregnancyDueDate}
                    onChange={(e) => setBreedingForm({ ...breedingForm, pregnancyDueDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setShowBreedingModal(false); setSelectedMare(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Зафиксировать спаривание
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* --- BIRTH REGISTRATION DIALOG (ОЖЕРЕБИЛАСЬ) --- */}
      <Modal
        open={showBirthModal && !!selectedMare}
        onClose={() => { setShowBirthModal(false); setSelectedMare(null); }}
        panelId="birth-modal"
        panelClassName="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-100 my-8"
      >
        {selectedMare && (
          <>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Baby className="w-5 h-5 text-emerald-600" />
                <span>Регистрация рождения (Выжеребка)</span>
              </h3>
              <button onClick={() => { setShowBirthModal(false); setSelectedMare(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Поздравляем с успешным приплодом! Заполните параметры новорожденного жеребенка. Он будет занесен в реестр, а мать <strong>{selectedMare.name}</strong> переведена в обычный статус.
            </p>

            <form onSubmit={handleBirthSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Имя жеребенка <span className="text-rose-500">*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="Например: Айсары, Кулан"
                    value={birthForm.name}
                    onChange={(e) => setBirthForm({ ...birthForm, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 font-extrabold"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Дата рождения <span className="text-rose-500">*</span></label>
                  <input 
                    type="date"
                    required
                    value={birthForm.birthDate}
                    onChange={(e) => setBirthForm({ ...birthForm, birthDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Пол жеребенка <span className="text-rose-500">*</span></label>
                  <select
                    value={birthForm.gender}
                    onChange={(e) => setBirthForm({ ...birthForm, gender: e.target.value as HorseGender })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 font-bold"
                  >
                    <option value="stallion">Жеребчик (Коняга)</option>
                    <option value="mare">Кобылка (Приплод)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Масть жеребенка <span className="text-rose-500">*</span></label>
                  <select
                    value={birthForm.coat}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBirthForm({ ...birthForm, coat: val });
                      setIsCustomCoatSelected(val === 'custom');
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                  >
                    <option value="Гнедая">Гнедая</option>
                    <option value="Вороная">Вороная</option>
                    <option value="Серая">Серая</option>
                    <option value="Рыжая">Рыжая</option>
                    <option value="Саврасая">Саврасая</option>
                    <option value="Буланая">Буланая</option>
                    <option value="Чубарая">Чубарая</option>
                    <option value="custom">Другая (вручную)...</option>
                  </select>

                  {/* Manual Coat Input */}
                  {isCustomCoatSelected && (
                    <div className="mt-2 animate-fadeIn">
                      <input 
                        type="text"
                        required
                        value={customCoatInput}
                        onChange={(e) => setCustomCoatInput(e.target.value)}
                        placeholder="Укажите масть вручную..."
                        className="w-full p-2 border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 bg-emerald-50/20 text-xs font-semibold text-emerald-950"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Отец жеребенка (Необязательно)</label>
                <select
                  value={birthForm.sireId}
                  onChange={(e) => setBirthForm({ ...birthForm, sireId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                >
                  <option value="">Выберите жеребца из хозяйства</option>
                  {stallions.map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.coat})</option>
                  ))}
                </select>
              </div>

              {/* Photo selection preset layout */}
              <div>
                <label className="block text-slate-500 font-bold mb-2 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Фото / Иллюстрация жеребенка <span className="text-rose-500">*</span></span>
                </label>
                
                {/* Visual Preset Choices */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {PRESET_FOAL_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setBirthForm({ ...birthForm, imageUrl: img.url })}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        birthForm.imageUrl === img.url ? 'border-emerald-500 scale-95 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      {birthForm.imageUrl === img.url && (
                        <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 mb-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold text-xs cursor-pointer shadow-sm active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Снять фото</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById('file-upload-birth')?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 p-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-all font-bold text-xs cursor-pointer active:scale-95"
                    >
                      <span>Загрузить</span>
                    </button>
                  </div>
                  <input 
                    id="file-upload-birth"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setBirthForm({ ...birthForm, imageUrl: reader.result });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <div>
                    <input 
                      type="text"
                      placeholder="Или ссылка на фото..."
                      value={birthForm.imageUrl.startsWith('data:') ? '' : birthForm.imageUrl}
                      onChange={(e) => setBirthForm({ ...birthForm, imageUrl: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs"
                    />
                  </div>
                </div>

                {birthForm.imageUrl && (
                  <div className="mt-2 flex items-center gap-3 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                    <img src={birthForm.imageUrl} alt="Превью" className="w-12 h-12 rounded-xl object-cover border border-emerald-200" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Предпросмотр</span>
                      <span className="text-xs font-semibold text-emerald-800">Изображение жеребенка прикреплено</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBirthForm({ ...birthForm, imageUrl: PRESET_FOAL_IMAGES[0].url })}
                      className="ml-auto text-rose-500 hover:text-rose-700 text-xs font-bold"
                    >
                      Сбросить
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setShowBirthModal(false); setSelectedMare(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer active:scale-98"
                >
                  Успешно ожеребилась!
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {selectedDetailHorse && (
        <HorseDetailModal 
          horse={selectedDetailHorse} 
          onClose={() => setSelectedDetailHorse(null)} 
          allHorses={horses} 
          onUpdateHorse={onUpdateHorse}
        />
      )}

      {showCamera && (
        <CameraCapture 
          onCapture={(dataUrl) => {
            setBirthForm({ ...birthForm, imageUrl: dataUrl });
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

    </div>
  );
}
