/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Horse, Kosek, Vaccination, FatteningRecord, CullRecord, HorseStatus } from './types';
import { 
  INITIAL_HORSES, 
  INITIAL_KOSEKS, 
  INITIAL_VACCINATIONS, 
  INITIAL_FATTENING_RECORDS, 
  INITIAL_CULL_RECORDS 
} from './data';

import Dashboard from './components/Dashboard';
import HorseDatabase from './components/HorseDatabase';
import KosekManagement from './components/KosekManagement';
import FatteningTab from './components/FatteningTab';
import VaccinationTab from './components/VaccinationTab';
import CullLog from './components/CullLog';
import OffspringTree from './components/OffspringTree';
import AdminModal from './components/AdminModal';
import FarmHistory from './components/FarmHistory';
import MaresTab from './components/MaresTab';
import Modal from './components/ui/Modal';
import Logo from './components/ui/Logo';
import ProfileTab from './components/ProfileTab';
import AuthGate from './components/AuthGate';
import { getCurrentSession, onAuthChange, getUserProfile, signOutUser } from './utils/auth';
import type { Session } from '@supabase/supabase-js';

import { 
  LayoutDashboard, 
  Database, 
  Users, 
  Utensils, 
  ShieldCheck, 
  Skull, 
  GitBranch, 
  Sparkles,
  Info,
  History,
  Baby,
  ArrowLeft,
  UserCircle
} from 'lucide-react';

interface Admin {
  login: string;
  name: string;
  role: string;
  code: string;
}

// Проект с чистого листа — предустановленных администраторов нет.
// Личность пользователя определяется авторизацией (Supabase Auth).
const DEFAULT_ADMINS: Admin[] = [];

export default function App() {
  // 1. Core States loaded from LocalStorage
  const [horses, setHorses] = useState<Horse[]>([]);
  const [koseks, setKoseks] = useState<Kosek[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [fattenings, setFattenings] = useState<FatteningRecord[]>([]);
  const [culls, setCulls] = useState<CullRecord[]>([]);

  // Selected tab & Selected horse for pedigree
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [selectedHorseForPedigree, setSelectedHorseForPedigree] = useState<Horse | null>(null);

  // Reusable custom confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(null);
      }
    });
  };

  const handleTabChange = (tab: string) => {
    if (tab !== activeTab) {
      setTabHistory(prev => {
        const updated = [...prev, activeTab];
        return updated.slice(-20); // Keep last 20 steps
      });
      setActiveTab(tab);
    }
  };

  const handleGoBack = () => {
    if (tabHistory.length > 0) {
      const updatedHistory = [...tabHistory];
      const previous = updatedHistory.pop();
      setTabHistory(updatedHistory);
      if (previous) {
        setActiveTab(previous);
      }
    } else {
      setActiveTab('database');
    }
  };

  // Свайп вправо от левого края экрана = «Назад» (мобильный жест)
  const goBackRef = useRef(handleGoBack);
  goBackRef.current = handleGoBack;

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      // Жест начинается только у левого края (как в iOS/Android)
      if (t.clientX <= 40) {
        tracking = true;
        startX = t.clientX;
        startY = t.clientY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      // Достаточно длинный и преимущественно горизонтальный свайп вправо
      if (dx > 70 && dx > dy * 1.5) {
        goBackRef.current();
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Administrator states (реальная личность приходит из авторизации)
  const [currentAdmin, setCurrentAdmin] = useState<Admin>({
    login: '',
    name: 'Пользователь',
    role: 'Зоотехник',
    code: ''
  });
  const [allAdmins, setAllAdmins] = useState<Admin[]>([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Authentication (Supabase Auth) states
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;

    // Профиль вошедшего пользователя становится текущим администратором
    const applyProfile = async (s: Session | null) => {
      if (!s) return;
      try {
        const profile = await getUserProfile(s);
        if (!active) return;
        setCurrentAdmin({
          login: profile.username,
          name: profile.name,
          role: profile.role,
          code: '',
        });
      } catch {
        /* ignore — оставляем текущее имя */
      }
    };

    getCurrentSession().then((s) => {
      if (!active) return;
      setSession(s);
      setAuthChecked(true);
      applyProfile(s);
    });

    const unsub = onAuthChange((s) => {
      setSession(s);
      setAuthChecked(true);
      applyProfile(s);
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    setSession(null);
    setActiveTab('dashboard');
  };

  // Load from local storage (проект стартует пустым — сиды пустые)
  useEffect(() => {
    const readList = <T,>(key: string, fallback: T[]): T[] => {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          return JSON.parse(saved) as T[];
        } catch {
          return fallback;
        }
      }
      return fallback;
    };

    setHorses(readList('horses_farm_data', INITIAL_HORSES));
    setKoseks(readList('koseks_farm_data', INITIAL_KOSEKS));
    setVaccinations(readList('vaccinations_farm_data', INITIAL_VACCINATIONS));
    setFattenings(readList('fattenings_farm_data', INITIAL_FATTENING_RECORDS));
    setCulls(readList('culls_farm_data', INITIAL_CULL_RECORDS));

    // Список локальных администраторов (личность — из авторизации)
    const savedAdmins = localStorage.getItem('farm_administrators');
    setAllAdmins(savedAdmins ? JSON.parse(savedAdmins) : DEFAULT_ADMINS);
  }, []);

  // Save changes helper
  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // 2. Horse State Handlers
  const handleAddHorse = (newHorse: Omit<Horse, 'id'>) => {
    const id = `h-${Date.now()}`;
    const horseWithId: Horse = { ...newHorse, id };
    
    setHorses(prev => {
      const updated = [horseWithId, ...prev];
      saveState('horses_farm_data', updated);
      return updated;
    });

    // Automatically schedule a planned vaccination if this is a newborn foal (has a damId)
    if (newHorse.damId) {
      const vaccineId = `v-${Date.now()}`;
      const foalBirthDate = new Date(newHorse.birthDate);
      const vaccineDate = new Date(foalBirthDate);
      vaccineDate.setMonth(foalBirthDate.getMonth() + 6); // First vaccination planned at 6 months of age

      const newVaccine: Vaccination = {
        id: vaccineId,
        horseId: id,
        horseName: newHorse.name,
        disease: 'Мыт (Strangles)',
        date: newHorse.birthDate,
        nextDueDate: vaccineDate.toISOString().split('T')[0],
        veterinarian: '',
        status: 'planned'
      };

      setVaccinations(prev => {
        const updatedVaccines = [newVaccine, ...prev];
        saveState('vaccinations_farm_data', updatedVaccines);
        return updatedVaccines;
      });
    }
  };

  const handleUpdateHorse = (id: string, updatedFields: Partial<Horse>) => {
    setHorses(prev => {
      const updated = prev.map(h => h.id === id ? { ...h, ...updatedFields } : h);
      saveState('horses_farm_data', updated);
      
      // If selected horse for pedigree was updated, sync it
      if (selectedHorseForPedigree && selectedHorseForPedigree.id === id) {
        const fresh = updated.find(h => h.id === id);
        if (fresh) setTimeout(() => setSelectedHorseForPedigree(fresh), 0);
      }
      return updated;
    });
  };

  const handleDeleteHorse = (id: string) => {
    requestConfirmation(
      'Списание (удаление) лошади',
      'Вы уверены, что хотите списать (удалить) эту лошадь? Изменение необратимо.',
      () => {
        setHorses(prev => {
          const updated = prev.filter(h => h.id !== id);
          saveState('horses_farm_data', updated);
          return updated;
        });
        
        // Also remove from any active fattening
        setFattenings(prev => {
          const cleanFattenings = prev.filter(f => f.horseId !== id);
          saveState('fattenings_farm_data', cleanFattenings);
          return cleanFattenings;
        });

        if (selectedHorseForPedigree && selectedHorseForPedigree.id === id) {
          setSelectedHorseForPedigree(null);
        }
      }
    );
  };

  // 3. Fattening State Handlers
  const handleSendToFattening = (
    horseId: string, 
    record: Omit<FatteningRecord, 'id' | 'horseId' | 'horseName'>
  ) => {
    const horse = horses.find(h => h.id === horseId);
    if (!horse) return;

    // Create record
    const id = `fr-${Date.now()}`;
    const newRecord: FatteningRecord = {
      ...record,
      id,
      horseId,
      horseName: horse.name
    };

    // Update fattenings list
    setFattenings(prev => {
      const updatedFattenings = [newRecord, ...prev];
      saveState('fattenings_farm_data', updatedFattenings);
      return updatedFattenings;
    });

    // Update horse status to 'fattening'
    handleUpdateHorse(horseId, { status: 'fattening' });
  };

  // Completing Fattening (pasture vs slaughter)
  const handleCompleteFattening = (horseId: string, action: 'pasture' | 'slaughter') => {
    const horse = horses.find(h => h.id === horseId);
    const record = fattenings.find(f => f.horseId === horseId);
    if (!horse || !record) return;

    if (action === 'pasture') {
      // Send back to free pasture
      handleUpdateHorse(horseId, { status: 'active' });
    } else {
      // Send to slaughter
      const cullPayload: Omit<CullRecord, 'id' | 'horseId' | 'horseName' | 'coat' | 'gender'> = {
        cullDate: new Date().toISOString().split('T')[0],
        weight: record.currentWeight || record.startWeight || 450,
        meatYield: Math.round((record.currentWeight || record.startWeight || 450) * 0.55),
        reason: 'Забой после интенсивного откорма',
        revenue: 380000
      };
      
      handleCullHorse(horseId, cullPayload);
    }

    // Remove active fattening plan
    setFattenings(prev => {
      const updatedFattenings = prev.filter(f => f.horseId !== horseId);
      saveState('fattenings_farm_data', updatedFattenings);
      return updatedFattenings;
    });
  };

  const handleUpdateWeights = (horseId: string, currentWeight: number, notes?: string) => {
    setFattenings(prev => {
      const updated = prev.map(f => f.horseId === horseId ? { 
        ...f, 
        currentWeight, 
        notes: notes !== undefined ? notes : f.notes 
      } : f);
      saveState('fattenings_farm_data', updated);
      return updated;
    });
  };

  // 4. Slaughter / Culling State Handler (Subtracts from general count)
  const handleCullHorse = (
    horseId: string, 
    record: Omit<CullRecord, 'id' | 'horseId' | 'horseName' | 'coat' | 'gender'>
  ) => {
    const horse = horses.find(h => h.id === horseId);
    if (!horse) return;

    // Create slaughter history record
    const id = `cr-${Date.now()}`;
    const newCull: CullRecord = {
      ...record,
      id,
      horseId,
      horseName: horse.name,
      coat: horse.coat,
      gender: horse.gender
    };

    // Update culls array
    const updatedCulls = [newCull, ...culls];
    setCulls(updatedCulls);
    saveState('culls_farm_data', updatedCulls);

    // Update horse status to 'slaughtered' and strip Kosek id (since they leave active inventory)
    handleUpdateHorse(horseId, { status: 'slaughtered', kosekId: null });
  };

  const handleUpdateCull = (id: string, updatedFields: Partial<CullRecord>) => {
    const updated = culls.map(c => c.id === id ? { ...c, ...updatedFields } : c);
    setCulls(updated);
    saveState('culls_farm_data', updated);
  };

  const handleDeleteCull = (id: string) => {
    requestConfirmation(
      'Удаление записи о забое',
      'Вы уверены, что хотите удалить эту запись из архива забоя?',
      () => {
        const updated = culls.filter(c => c.id !== id);
        setCulls(updated);
        saveState('culls_farm_data', updated);
      }
    );
  };

  // 5. Kosek Herd State Handlers
  const handleCreateKosek = (newKosek: Omit<Kosek, 'id'>) => {
    const id = `k-${Date.now()}`;
    const kosekWithId: Kosek = { ...newKosek, id };
    
    setKoseks(prev => {
      const updatedKoseks = [...prev, kosekWithId];
      saveState('koseks_farm_data', updatedKoseks);
      return updatedKoseks;
    });

    // Place the selected leader stallion into this kosek instantly
    handleUpdateHorse(newKosek.stallionId, { kosekId: id });
  };

  const handleUpdateKosek = (id: string, updatedFields: Partial<Kosek>) => {
    setKoseks(prev => {
      const updated = prev.map(k => k.id === id ? { ...k, ...updatedFields } : k);
      saveState('koseks_farm_data', updated);
      return updated;
    });
  };

  const handleDeleteKosek = (id: string) => {
    setKoseks(prev => {
      const updatedKoseks = prev.filter(k => k.id !== id);
      saveState('koseks_farm_data', updatedKoseks);
      return updatedKoseks;
    });

    // Relational clean up: set kosekId to null for all horses previously in this kosek
    setHorses(prev => {
      const updatedHorses = prev.map(h => h.kosekId === id ? { ...h, kosekId: null } : h);
      saveState('horses_farm_data', updatedHorses);
      return updatedHorses;
    });
  };

  const handleMoveHorseToKosek = (horseId: string, kosekId: string | null) => {
    handleUpdateHorse(horseId, { kosekId });
  };

  // 6. Vaccinations State Handlers
  const handleAddVaccination = (newVaccine: Omit<Vaccination, 'id'>) => {
    const id = `v-${Date.now()}`;
    const vaccineWithId: Vaccination = { ...newVaccine, id };
    
    setVaccinations(prev => {
      const updated = [vaccineWithId, ...prev];
      saveState('vaccinations_farm_data', updated);
      return updated;
    });
  };

  const handleUpdateVaccinationStatus = (id: string, status: 'completed' | 'overdue' | 'planned') => {
    setVaccinations(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, status } : v);
      saveState('vaccinations_farm_data', updated);
      return updated;
    });
  };

  const handleUpdateVaccination = (id: string, updatedFields: Partial<Vaccination>) => {
    setVaccinations(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, ...updatedFields } : v);
      saveState('vaccinations_farm_data', updated);
      return updated;
    });
  };

  // 7. Navigation helper that switches tabs and focuses
  const navigateToPedigree = (horse: Horse) => {
    setSelectedHorseForPedigree(horse);
    setActiveTab('pedigree');
  };

  const focusHorseFromPedigree = (horseId: string) => {
    const found = horses.find(h => h.id === horseId);
    if (found) {
      setSelectedHorseForPedigree(found);
    }
  };

  // 8. Navigation & Section Title helper
  const getSectionTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Главная Панель';
      case 'database': return 'Реестр Лошадей';
      case 'koseks': return 'Косяки и Табуны';
      case 'fattening': return 'Группа Интенсивного Откорма';
      case 'mares': return 'Маточное Поголовье и Приплод';
      case 'vaccinations': return 'Ветеринарный Контроль';
      case 'culls': return 'Архив Забоя (Согым)';
      case 'history': return 'История и События';
      case 'profile': return 'Профиль';
      case 'pedigree': return `Потомство: ${selectedHorseForPedigree?.name || ''}`;
      default: return 'Панель Управления';
    }
  };

  // 9. Administrator state actions
  const handleSwitchAdmin = (login: string, code: string) => {
    const found = allAdmins.find(a => a.login === login.toLowerCase() && a.code === code);
    if (found) {
      setCurrentAdmin(found);
      saveState('active_administrator', found);
      return { success: true, message: `Добро пожаловать, ${found.name}!` };
    }
    return { success: false, message: 'Неверный логин или код доступа.' };
  };

  const handleCreateAdmin = (newAdmin: Admin) => {
    const exists = allAdmins.some(a => a.login === newAdmin.login);
    if (exists) {
      return { success: false, message: 'Логин уже занят другим администратором.' };
    }
    const updated = [...allAdmins, newAdmin];
    setAllAdmins(updated);
    saveState('farm_administrators', updated);
    setCurrentAdmin(newAdmin);
    saveState('active_administrator', newAdmin);
    return { success: true, message: `Профиль ${newAdmin.name} успешно зарегистрирован!` };
  };

  const handleUpdateCurrentAdmin = (updatedFields: Partial<Admin>) => {
    const fresh = { ...currentAdmin, ...updatedFields };
    setCurrentAdmin(fresh);
    saveState('active_administrator', fresh);

    const updatedList = allAdmins.map(a => a.login === currentAdmin.login ? fresh : a);
    setAllAdmins(updatedList);
    saveState('farm_administrators', updatedList);
  };

  // Пока проверяем сессию — заставка; без сессии — экран входа/регистрации
  if (!authChecked) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center gap-4">
        <Logo className="w-14 h-14 animate-pulse" />
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Загрузка…</p>
      </div>
    );
  }
  if (!session) {
    return <AuthGate />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">

      {/* LEFT SIDEBAR - Sleek Dark Theme (только десктоп; на мобильных — нижняя навигация) */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col text-slate-300 border-r border-slate-800 shrink-0">
        {/* Logo and Brand Title */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <Logo className="w-9 h-9 shrink-0 drop-shadow-md" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">Табун-Реестр</h1>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
              Зоотехнический Учет
            </span>
          </div>
        </div>

        {/* Navigation Options */}
        <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto">
          {/* Dashboard */}
          <button 
            id="tab-dashboard"
            onClick={() => { handleTabChange('dashboard'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5 shrink-0" /> 
            <span>Главная панель</span>
          </button>

          {/* Horse Database */}
          <button 
            id="tab-database"
            onClick={() => { handleTabChange('database'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'database' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Database className="w-4.5 h-4.5 shrink-0" /> 
            <span>Реестр лошадей</span>
          </button>

          {/* Koseks */}
          <button 
            id="tab-koseks"
            onClick={() => { handleTabChange('koseks'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'koseks' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Users className="w-4.5 h-4.5 shrink-0" /> 
            <span>Косяки и Табуны</span>
          </button>

          {/* Fattening */}
          <button 
            id="tab-fattening"
            onClick={() => { handleTabChange('fattening'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'fattening' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Utensils className="w-4.5 h-4.5 shrink-0" /> 
            <span>Группа откорма</span>
          </button>

          {/* Mares and Offspring */}
          <button 
            id="tab-mares"
            onClick={() => { handleTabChange('mares'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'mares' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Baby className="w-4.5 h-4.5 shrink-0" /> 
            <span>Маточное поголовье</span>
          </button>

          {/* Vaccinations */}
          <button 
            id="tab-vaccinations"
            onClick={() => { handleTabChange('vaccinations'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'vaccinations' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4.5 h-4.5 shrink-0" /> 
            <span>Вакцинация</span>
          </button>

          {/* Cull History */}
          <button 
            id="tab-culls"
            onClick={() => { handleTabChange('culls'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'culls' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Skull className="w-4.5 h-4.5 shrink-0" /> 
            <span>Архив забоя</span>
          </button>

          {/* Farm History (История) */}
          <button 
            id="tab-history"
            onClick={() => { handleTabChange('history'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <History className="w-4.5 h-4.5 shrink-0" /> 
            <span>История хозяйства</span>
          </button>

          {/* Pedigree Tree Tab (Dynamic) */}
          {selectedHorseForPedigree && (
            <button 
              id="tab-pedigree"
              onClick={() => { handleTabChange('pedigree'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'pedigree' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                  : 'text-emerald-400 bg-emerald-950/20 hover:bg-slate-800/60'
              }`}
            >
              <GitBranch className="w-4.5 h-4.5 shrink-0" /> 
              <span className="truncate">Потомство: {selectedHorseForPedigree.name}</span>
            </button>
          )}
        </nav>

        {/* Sidebar Footer with Live Status Indicators */}
        <div className="p-5 border-t border-slate-800 text-[11px] text-slate-500">
          <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-2">Статус Системы</p>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>База данных активна</span>
          </div>
          <p className="text-slate-500 truncate">Хозяйство: "Алтын Тулпар"</p>
        </div>
      </aside>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        
        {/* MAIN HEADER - High Contrast Sleek Layout */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30">
          <div className="flex items-center gap-3">
            {/* Стрелка «Назад» без надписи (левый верхний угол) */}
            {tabHistory.length > 0 && (
              <button
                type="button"
                id="header-back-btn"
                onClick={handleGoBack}
                aria-label="Назад"
                title="Назад"
                className="flex items-center justify-center w-9 h-9 -ml-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-700 transition-all shadow-2xs active:scale-90 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
            )}

            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                {getSectionTitle(activeTab)}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:block">
                Международные Стандарты Качества
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-[11px] px-3 py-1.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden xs:inline">Авто-сохранение: Локальное</span>
              <span className="xs:hidden">Локальное</span>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden xs:block" />

            <button 
              id="open-admin-modal-btn"
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-2.5 cursor-pointer group hover:bg-slate-100/80 p-1.5 rounded-2xl transition-all"
              title="Настройки Администратора / Сменить сессию"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-none group-hover:text-emerald-600 transition-colors">{currentAdmin.name}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">{currentAdmin.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-sm shadow-2xs group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all">
                {currentAdmin.name.charAt(0).toUpperCase()}
              </div>
            </button>
          </div>
        </header>

        {/* CONTAINER FOR ACTIVE TAB CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
          
          {/* Render Active Tab */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              horses={horses}
              koseks={koseks}
              vaccinations={vaccinations}
              fattenings={fattenings}
              culls={culls}
              onNavigate={(tab) => {
                if (tab === 'pedigree') {
                  // Открываем потомство первой лошади, у которой есть потомки
                  const firstWithOffspring = horses.find(h =>
                    horses.some(c => c.sireId === h.id || c.damId === h.id)
                  );
                  if (firstWithOffspring) navigateToPedigree(firstWithOffspring);
                } else {
                  setActiveTab(tab);
                }
              }}
              onSelectHorse={(id) => {
                const h = horses.find(x => x.id === id);
                if (h) navigateToPedigree(h);
              }}
            />
          )}

          {activeTab === 'database' && (
            <HorseDatabase 
              horses={horses}
              koseks={koseks}
              onAddHorse={handleAddHorse}
              onUpdateHorse={handleUpdateHorse}
              onDeleteHorse={handleDeleteHorse}
              onSendToFattening={handleSendToFattening}
              onCullHorse={handleCullHorse}
              onSelectHorseForPedigree={navigateToPedigree}
            />
          )}

          {activeTab === 'koseks' && (
            <KosekManagement 
              horses={horses}
              koseks={koseks}
              onCreateKosek={handleCreateKosek}
              onUpdateKosek={handleUpdateKosek}
              onDeleteKosek={handleDeleteKosek}
              onMoveHorseToKosek={handleMoveHorseToKosek}
              onUpdateHorse={handleUpdateHorse}
              onRequestConfirmation={requestConfirmation}
            />
          )}

          {activeTab === 'fattening' && (
            <FatteningTab 
              horses={horses}
              fattenings={fattenings}
              onCompleteFattening={handleCompleteFattening}
              onUpdateWeights={handleUpdateWeights}
            />
          )}

          {activeTab === 'mares' && (
            <MaresTab 
              horses={horses}
              onAddHorse={handleAddHorse}
              onUpdateHorse={handleUpdateHorse}
              currentAdminName={currentAdmin.name}
            />
          )}

          {activeTab === 'vaccinations' && (
            <VaccinationTab 
              horses={horses}
              vaccinations={vaccinations}
              onAddVaccination={handleAddVaccination}
              onUpdateVaccinationStatus={handleUpdateVaccinationStatus}
              onUpdateVaccination={handleUpdateVaccination}
            />
          )}

          {activeTab === 'culls' && (
            <CullLog 
              culls={culls}
              onUpdateCull={handleUpdateCull}
              onDeleteCull={handleDeleteCull}
            />
          )}

          {activeTab === 'history' && (
            <FarmHistory 
              horses={horses}
              koseks={koseks}
              currentAdminName={currentAdmin.name}
              onRequestConfirmation={requestConfirmation}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              currentAdmin={currentAdmin}
              horses={horses}
              vaccinations={vaccinations}
              culls={culls}
              onNavigate={handleTabChange}
              onOpenAdminSettings={() => setIsAdminModalOpen(true)}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'pedigree' && selectedHorseForPedigree && (
            <OffspringTree
              horse={selectedHorseForPedigree}
              allHorses={horses}
              onSelectHorse={focusHorseFromPedigree}
            />
          )}

        </div>

      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR — 5 основных разделов (Material 3 style) */}
      <nav
        id="mobile-bottom-navigation"
        aria-label="Основная навигация"
        className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl md:hidden z-40 flex items-stretch h-[68px] px-1 pb-safe"
      >
        {[
          { tab: 'dashboard', icon: LayoutDashboard, label: 'Главная' },
          { tab: 'database', icon: Database, label: 'Реестр' },
          { tab: 'koseks', icon: Users, label: 'Косяки' },
          { tab: 'mares', icon: Baby, label: 'Кобылы' },
          { tab: 'profile', icon: UserCircle, label: 'Профиль' },
        ].map(({ tab, icon: Icon, label }) => {
          // Разделы, интегрированные в Профиль, подсвечивают вкладку «Профиль»
          const profileChildren = ['fattening', 'vaccinations', 'culls', 'history'];
          const isActive =
            activeTab === tab || (tab === 'profile' && profileChildren.includes(activeTab));
          return (
            <button
              key={tab}
              id={`mobile-tab-${tab}`}
              onClick={() => {
                handleTabChange(tab);
                if (tab === 'dashboard') setSelectedHorseForPedigree(null);
              }}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center flex-1 h-full pt-1.5 pb-1 gap-0.5 cursor-pointer group"
            >
              <span
                className={`flex items-center justify-center w-14 h-7 rounded-full transition-all ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-400 group-hover:text-slate-600 group-active:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span
                className={`text-[10px] leading-none transition-colors ${
                  isActive ? 'text-emerald-800 font-extrabold' : 'text-slate-400 font-bold'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Administrator settings & switching modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentAdmin={currentAdmin}
        allAdmins={allAdmins}
        onSwitchAdmin={handleSwitchAdmin}
        onCreateAdmin={handleCreateAdmin}
        onUpdateCurrentAdmin={handleUpdateCurrentAdmin}
      />

      {/* Reusable non-blocking custom confirmation modal (Headless UI Dialog) */}
      <Modal
        open={!!confirmConfig?.isOpen}
        onClose={() => setConfirmConfig(prev => (prev ? { ...prev, isOpen: false } : null))}
        panelId="global-custom-confirm-modal"
        panelClassName="bg-white rounded-3xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-100 flex flex-col p-6 space-y-4"
      >
        {confirmConfig && (
          <>
            <div className="text-center">
              <span className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500 text-xl font-bold animate-pulse">
                ⚠️
              </span>
              <h3 className="font-extrabold text-base text-slate-950 mt-3">{confirmConfig.title}</h3>
              <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">{confirmConfig.message}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmConfig(prev => (prev ? { ...prev, isOpen: false } : null))}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs cursor-pointer transition-all active:scale-95"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmConfig.onConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs cursor-pointer transition-all active:scale-95 shadow-sm shadow-rose-900/10"
              >
                Подтвердить
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
