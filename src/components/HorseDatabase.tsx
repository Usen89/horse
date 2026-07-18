/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Horse, HorseGender, HorseStatus, Kosek, Vaccination, FatteningRecord, CullRecord } from '../types';
import CameraCapture from './CameraCapture';
import Modal from './ui/Modal';
import { Switch, Field as SwitchGroup, Label as SwitchLabel } from '@headlessui/react';
import { compressImage } from '../utils/image';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  GitBranch, 
  TrendingUp, 
  Utensils, 
  Check, 
  AlertTriangle,
  User,
  Heart,
  Calendar,
  Grid,
  List,
  ChevronDown,
  Camera,
  Eye
} from 'lucide-react';
import HorseDetailModal from './HorseDetailModal';

interface HorseDatabaseProps {
  horses: Horse[];
  koseks: Kosek[];
  onAddHorse: (horse: Omit<Horse, 'id'>) => string;
  onUpdateHorse: (id: string, updated: Partial<Horse>) => void;
  onDeleteHorse: (id: string) => void;
  onSendToFattening: (horseId: string, record: Omit<FatteningRecord, 'id' | 'horseId' | 'horseName'>) => void;
  onCullHorse: (horseId: string, record: Omit<CullRecord, 'id' | 'horseId' | 'horseName' | 'coat' | 'gender'>) => void;
  onSelectHorseForPedigree: (horse: Horse) => void;
}

export default function HorseDatabase({
  horses,
  koseks,
  onAddHorse,
  onUpdateHorse,
  onDeleteHorse,
  onSendToFattening,
  onCullHorse,
  onSelectHorseForPedigree
}: HorseDatabaseProps) {
  
  // 1. Local UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedCoat, setSelectedCoat] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active-only'); // Default to show only living
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals / Action States
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'fattening' | 'cull' | null>(null);
  const [targetHorse, setTargetHorse] = useState<Horse | null>(null);
  const [selectedDetailHorse, setSelectedDetailHorse] = useState<Horse | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Custom coat input states
  const [customCoatInput, setCustomCoatInput] = useState('');
  const [isCustomCoatSelected, setIsCustomCoatSelected] = useState(false);

  // Добавление нового жеребца (отца) прямо из формы регистрации
  const [newSireName, setNewSireName] = useState('');
  const [newSireCoat, setNewSireCoat] = useState('');

  // Form Fields for Add/Edit Horse
  const [horseForm, setHorseForm] = useState({
    name: '',
    coat: 'Гнедая',
    birthDate: new Date().toISOString().split('T')[0],
    gender: 'mare' as HorseGender,
    sireId: '',
    damId: '',
    owner: '',
    kosekId: '',
    isPregnant: false,
    pregnancyDate: '',
    pregnancyDueDate: '',
    notes: '',
    imageUrl: ''
  });

  // Form Fields for Fattening
  const [fatteningForm, setFatteningForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    durationDays: 60,
    startWeight: 400,
    currentWeight: 400,
    notes: 'Плановый откорм'
  });

  // Form Fields for Culling (Забой)
  const [cullForm, setCullForm] = useState({
    cullDate: new Date().toISOString().split('T')[0],
    weight: 450,
    meatYield: 55, // Percent
    reason: 'Плановый забой на согым',
    revenue: 350000
  });

  // Unique list of coats for filters
  const availableCoats = Array.from(new Set(horses.map(h => h.coat)));

  // Filter horses
  const filteredHorses = horses.filter(horse => {
    // Exclude slaughtered horses from standard view if requested
    if (selectedStatus === 'active-only' && (horse.status === 'slaughtered' || horse.status === 'sold')) {
      return false;
    }
    if (selectedStatus !== 'all' && selectedStatus !== 'active-only' && horse.status !== selectedStatus) {
      return false;
    }

    const matchesSearch = 
      horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      horse.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (horse.notes && horse.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGender = selectedGender === 'all' || horse.gender === selectedGender;
    const matchesCoat = selectedCoat === 'all' || horse.coat === selectedCoat;

    return matchesSearch && matchesGender && matchesCoat;
  });

  // 2. Form Handlers
  const openAddModal = () => {
    setIsCustomCoatSelected(false);
    setCustomCoatInput('');
    setNewSireName('');
    setNewSireCoat('');
    setHorseForm({
      name: '',
      coat: 'Гнедая',
      birthDate: new Date().toISOString().split('T')[0],
      gender: 'mare',
      sireId: '',
      damId: '',
      owner: '',
      kosekId: '',
      isPregnant: false,
      pregnancyDate: '',
      pregnancyDueDate: '',
      notes: '',
      imageUrl: ''
    });
    setTargetHorse(null);
    setActiveModal('add');
  };

  const openEditModal = (horse: Horse) => {
    setTargetHorse(horse);
    setNewSireName('');
    setNewSireCoat('');
    const standardCoats = ['Гнедая', 'Вороная', 'Серая', 'Рыжая', 'Саврасая', 'Буланая', 'Чубарая'];
    const isCustom = !standardCoats.includes(horse.coat);
    setIsCustomCoatSelected(isCustom);
    setCustomCoatInput(isCustom ? horse.coat : '');
    setHorseForm({
      name: horse.name,
      coat: isCustom ? 'custom' : horse.coat,
      birthDate: horse.birthDate,
      gender: horse.gender,
      sireId: horse.sireId || '',
      damId: horse.damId || '',
      owner: horse.owner,
      kosekId: horse.kosekId || '',
      isPregnant: horse.isPregnant || false,
      pregnancyDate: horse.pregnancyDate || '',
      pregnancyDueDate: horse.pregnancyDueDate || '',
      notes: horse.notes || '',
      imageUrl: horse.imageUrl || ''
    });
    setActiveModal('edit');
  };

  const openFatteningModal = (horse: Horse) => {
    setTargetHorse(horse);
    setFatteningForm({
      startDate: new Date().toISOString().split('T')[0],
      durationDays: 60,
      startWeight: 400,
      currentWeight: 400,
      notes: `Постановка на откорм лошади ${horse.name}`
    });
    setActiveModal('fattening');
  };

  const openCullModal = (horse: Horse) => {
    setTargetHorse(horse);
    setCullForm({
      cullDate: new Date().toISOString().split('T')[0],
      weight: 450,
      meatYield: 55,
      reason: 'Плановый забой на согым',
      revenue: 350000
    });
    setActiveModal('cull');
  };

  const handleSaveHorse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!horseForm.name.trim()) return;

    const actualCoat = isCustomCoatSelected ? (customCoatInput.trim() || 'Другая') : horseForm.coat;

    // Отец: существующий жеребец, либо создаём нового прямо сейчас
    let resolvedSireId: string | null = null;
    let resolvedSireName: string | undefined;
    if (horseForm.sireId === '__new__') {
      if (newSireName.trim()) {
        resolvedSireId = onAddHorse({
          name: newSireName.trim(),
          coat: newSireCoat.trim() || 'Не указана',
          birthDate: new Date().toISOString().split('T')[0],
          gender: 'stallion',
          sireId: null,
          damId: null,
          owner: horseForm.owner,
          status: 'active',
          kosekId: null,
          notes: 'Добавлен вручную при регистрации потомка'
        });
        resolvedSireName = newSireName.trim();
      }
    } else if (horseForm.sireId) {
      const sire = horses.find(h => h.id === horseForm.sireId);
      resolvedSireId = horseForm.sireId;
      resolvedSireName = sire ? sire.name : undefined;
    }

    const dam = horses.find(h => h.id === horseForm.damId);

    const horsePayload = {
      name: horseForm.name,
      coat: actualCoat,
      birthDate: horseForm.birthDate,
      gender: horseForm.gender,
      sireId: resolvedSireId,
      sireName: resolvedSireName,
      damId: horseForm.damId || null,
      damName: dam ? dam.name : undefined,
      owner: horseForm.owner,
      status: (targetHorse ? targetHorse.status : 'active') as HorseStatus,
      kosekId: horseForm.kosekId || null,
      isPregnant: horseForm.gender === 'mare' ? horseForm.isPregnant : false,
      pregnancyDate: horseForm.gender === 'mare' && horseForm.isPregnant ? horseForm.pregnancyDate : undefined,
      pregnancyDueDate: horseForm.gender === 'mare' && horseForm.isPregnant ? horseForm.pregnancyDueDate : undefined,
      notes: horseForm.notes,
      imageUrl: horseForm.imageUrl || undefined
    };

    if (activeModal === 'edit' && targetHorse) {
      onUpdateHorse(targetHorse.id, horsePayload);
    } else {
      onAddHorse(horsePayload);
    }
    setActiveModal(null);
  };

  const handleSaveFattening = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHorse) return;

    onSendToFattening(targetHorse.id, {
      startDate: fatteningForm.startDate,
      durationDays: Number(fatteningForm.durationDays),
      endDate: calculateEndDate(fatteningForm.startDate, Number(fatteningForm.durationDays)),
      startWeight: Number(fatteningForm.startWeight),
      currentWeight: Number(fatteningForm.currentWeight),
      notes: fatteningForm.notes
    });

    setActiveModal(null);
  };

  const handleSaveCull = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHorse) return;

    // Calculate meat yield in kg from percentage
    const yieldKg = Math.round((cullForm.weight * cullForm.meatYield) / 100);

    onCullHorse(targetHorse.id, {
      cullDate: cullForm.cullDate,
      weight: Number(cullForm.weight),
      meatYield: yieldKg,
      reason: cullForm.reason,
      revenue: Number(cullForm.revenue)
    });

    setActiveModal(null);
  };

  // Helper date adder
  const calculateEndDate = (startDateStr: string, days: number) => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // 3. Render Helpers
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

  // Pre-configured elegant images for horses based on coat
  const getPlaceholderImage = (coat: string, id: string) => {
    const hash = id.charCodeAt(id.length - 1) || 0;
    const imagesByCoat: { [key: string]: string[] } = {
      'Вороная': [
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=400&auto=format&fit=crop&q=80'
      ],
      'Гнедая': [
        'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&auto=format&fit=crop&q=80'
      ],
      'Серая': [
        'https://images.unsplash.com/photo-1598974357801-cbca100e6563?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&auto=format&fit=crop&q=80'
      ],
      'Рыжая': [
        'https://images.unsplash.com/photo-1538681105587-85640961bf8b?w=400&auto=format&fit=crop&q=80'
      ]
    };

    const key = Object.keys(imagesByCoat).find(k => coat.includes(k)) || 'Гнедая';
    const list = imagesByCoat[key];
    return list[hash % list.length];
  };

  return (
    <div id="database-tab-container" className="space-y-6">
      
      {/* Control Panel / Search & Filter */}
      <div id="database-controls" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Реестр лошадей хозяйства</h2>
            <p className="text-xs text-slate-500">Систематический учет животных, фильтрация по параметрам и ветеринарный контроль.</p>
          </div>
          <button 
            id="register-horse-btn"
            onClick={openAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Зарегистрировать лошадь
          </button>
        </div>

        {/* Filters and Inputs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              id="search-input"
              type="text" 
              placeholder="Поиск по имени или владельцу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 w-full text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Gender select */}
          <div className="relative">
            <select
              id="gender-filter"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="pl-3 pr-8 py-2 w-full text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50/50 appearance-none cursor-pointer"
            >
              <option value="all">Пол: Все</option>
              <option value="stallion">Жеребец (Stallion)</option>
              <option value="mare">Кобыла (Mare)</option>
              <option value="gelding">Мерин (Gelding)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Coat select */}
          <div className="relative">
            <select
              id="coat-filter"
              value={selectedCoat}
              onChange={(e) => setSelectedCoat(e.target.value)}
              className="pl-3 pr-8 py-2 w-full text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50/50 appearance-none cursor-pointer"
            >
              <option value="all">Масть: Все</option>
              {availableCoats.map(coat => (
                <option key={coat} value={coat}>{coat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pl-3 pr-8 py-2 w-full text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50/50 appearance-none cursor-pointer"
            >
              <option value="active-only">Статус: Живые / Активные</option>
              <option value="all">Все статусы (включая забой/продано)</option>
              <option value="active">Только Свободный выгул</option>
              <option value="fattening">Только На откорме</option>
              <option value="slaughtered">Только Забой (Архив)</option>
              <option value="sold">Только Проданные</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Grid/Table view toggles */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-center max-w-[100px] gap-1 justify-around">
            <button 
              id="view-grid-btn"
              onClick={() => setViewMode('grid')} 
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              title="Сетка"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              id="view-table-btn"
              onClick={() => setViewMode('table')} 
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              title="Таблица"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Database Listing */}
      {filteredHorses.length > 0 ? (
        viewMode === 'grid' ? (
          /* Cards Grid View */
          <div id="horses-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHorses.map(horse => {
              const isSlaughtered = horse.status === 'slaughtered';
              const isFattening = horse.status === 'fattening';
              return (
                <div 
                  key={horse.id} 
                  id={`horse-card-${horse.id}`}
                  className={`bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between group transition-all hover:shadow-md ${
                    isSlaughtered ? 'opacity-65 border-dashed bg-slate-50' : ''
                  }`}
                >
                  <div>
                    {/* Header Image section */}
                    <div 
                      onClick={() => setSelectedDetailHorse(horse)}
                      className="relative h-44 bg-slate-100 overflow-hidden cursor-pointer"
                      title="Нажмите, чтобы просмотреть подробную информацию"
                    >
                      <img 
                        src={horse.imageUrl || getPlaceholderImage(horse.coat, horse.id)} 
                        alt={horse.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                      
                      {/* Gender Badge */}
                      <div className="absolute top-3 left-3 flex gap-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm ${
                          horse.gender === 'stallion' 
                            ? 'bg-sky-500 text-white' 
                            : horse.gender === 'mare' 
                              ? 'bg-rose-500 text-white' 
                              : 'bg-amber-500 text-white'
                        }`}>
                          {horse.gender === 'stallion' ? 'Жеребец' : horse.gender === 'mare' ? 'Кобыла' : 'Мерин'}
                        </span>
                        
                        {/* Pregnancy Indicator */}
                        {horse.gender === 'mare' && horse.isPregnant && (
                          <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm animate-pulse">
                            <Heart className="w-3 h-3 fill-white" /> Жеребая
                          </span>
                        )}
                      </div>

                      {/* Status Overlay Badge */}
                      <div className="absolute bottom-3 right-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs ${
                          horse.status === 'active' 
                            ? 'bg-emerald-500 text-white' 
                            : horse.status === 'fattening' 
                              ? 'bg-amber-500 text-white animate-pulse' 
                              : horse.status === 'slaughtered'
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-400 text-white'
                        }`}>
                          {horse.status === 'active' && 'Свободный'}
                          {horse.status === 'fattening' && 'На откорме'}
                          {horse.status === 'slaughtered' && 'Забит'}
                          {horse.status === 'sold' && 'Продан'}
                        </span>
                      </div>
                    </div>

                    {/* Info Body */}
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 
                            onClick={() => setSelectedDetailHorse(horse)}
                            className="font-bold text-slate-900 text-base hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Нажмите, чтобы просмотреть подробную информацию"
                          >
                            {horse.name}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium">
                            {getAgeText(horse.birthDate)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Владелец: {horse.owner}</p>
                      </div>

                      {/* Specific parameters */}
                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-100 py-2.5 my-2 text-slate-600">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Масть</span>
                          <span className="font-semibold text-slate-800">{horse.coat}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Дат. Рожд.</span>
                          <span className="font-semibold text-slate-800">{horse.birthDate}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Родословная (Отец / Мать)</span>
                          <span className="text-[11px] font-medium text-slate-800 truncate block">
                            {horse.sireName || 'Неизв.'} × {horse.damName || 'Неизв.'}
                          </span>
                        </div>
                      </div>

                      {horse.notes && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-2 bg-slate-50 p-2 rounded-lg">
                          &ldquo;{horse.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="px-4 pb-4 pt-1 border-t border-slate-50 flex items-center justify-between gap-1">
                    <button 
                      id={`pedigree-link-${horse.id}`}
                      onClick={() => onSelectHorseForPedigree(horse)}
                      className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all flex items-center gap-1 text-[11px] font-semibold"
                      title="Потомство лошади"
                    >
                      <GitBranch className="w-4 h-4" /> Потомство
                    </button>

                    <div className="flex gap-1">
                      {/* Send to Fattening (only if active) */}
                      {!isSlaughtered && horse.status !== 'sold' && !isFattening && (
                        <button 
                          id={`fattening-btn-${horse.id}`}
                          onClick={() => openFatteningModal(horse)}
                          className="px-2.5 py-1.5 hover:bg-amber-50 text-amber-600 hover:text-amber-700 rounded-lg transition-all flex items-center gap-0.5 text-[11px] font-semibold"
                          title="Поставить на откорм"
                        >
                          <Utensils className="w-3.5 h-3.5" /> Откорм
                        </button>
                      )}

                      {/* Slaughter (only if active/fattening) */}
                      {!isSlaughtered && horse.status !== 'sold' && (
                        <button 
                          id={`cull-btn-${horse.id}`}
                          onClick={() => openCullModal(horse)}
                          className="px-2.5 py-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg transition-all flex items-center gap-0.5 text-[11px] font-semibold"
                          title="На забой"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Забой
                        </button>
                      )}

                      {/* View Details */}
                      <button 
                        id={`view-detail-btn-${horse.id}`}
                        onClick={() => setSelectedDetailHorse(horse)}
                        className="p-1.5 hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 rounded-lg transition-all cursor-pointer"
                        title="Подробная информация / Смена фото"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button 
                        id={`edit-btn-${horse.id}`}
                        onClick={() => openEditModal(horse)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition-all"
                        title="Редактировать профиль"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button 
                        id={`delete-btn-${horse.id}`}
                        onClick={() => onDeleteHorse(horse.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-all"
                        title="Списать"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div id="horses-table-container" className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 text-xs font-semibold">
                  <th className="py-3 px-4">Имя</th>
                  <th className="py-3 px-4">Пол</th>
                  <th className="py-3 px-4">Масть</th>
                  <th className="py-3 px-4">Возраст</th>
                  <th className="py-3 px-4">Отец / Мать</th>
                  <th className="py-3 px-4">Владелец</th>
                  <th className="py-3 px-4">Косяк</th>
                  <th className="py-3 px-4">Статус</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredHorses.map(horse => {
                  const isSlaughtered = horse.status === 'slaughtered';
                  return (
                    <tr 
                      key={horse.id} 
                      id={`horse-row-${horse.id}`}
                      className={`hover:bg-slate-50/50 transition-colors ${isSlaughtered ? 'opacity-65 bg-slate-50/30' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 overflow-hidden shrink-0">
                            <img 
                              src={horse.imageUrl || getPlaceholderImage(horse.coat, horse.id)} 
                              alt={horse.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span>{horse.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          horse.gender === 'stallion' ? 'bg-sky-50 text-sky-700' : horse.gender === 'mare' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {horse.gender === 'stallion' ? 'Жеребец' : horse.gender === 'mare' ? 'Кобыла' : 'Мерин'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{horse.coat}</td>
                      <td className="py-3.5 px-4">{getAgeText(horse.birthDate)}</td>
                      <td className="py-3.5 px-4 text-slate-500 truncate max-w-[150px]">
                        {horse.sireName || '—'} × {horse.damName || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{horse.owner}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-medium">
                        {koseks.find(k => k.id === horse.kosekId)?.name || 'Вне косяка'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          horse.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : horse.status === 'fattening' 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {horse.status === 'active' && 'Свободный'}
                          {horse.status === 'fattening' && 'На откорме'}
                          {horse.status === 'slaughtered' && 'Забит'}
                          {horse.status === 'sold' && 'Продан'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <button 
                            id={`row-pedigree-${horse.id}`}
                            onClick={() => onSelectHorseForPedigree(horse)}
                            className="p-1 hover:bg-emerald-50 text-emerald-600 rounded"
                            title="Потомство лошади"
                          >
                            <GitBranch className="w-4 h-4" />
                          </button>
                          <button 
                            id={`row-view-${horse.id}`}
                            onClick={() => setSelectedDetailHorse(horse)}
                            className="p-1 hover:bg-emerald-50 text-emerald-500 rounded cursor-pointer"
                            title="Подробная информация / Смена фото"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            id={`row-edit-${horse.id}`}
                            onClick={() => openEditModal(horse)}
                            className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            id={`row-delete-${horse.id}`}
                            onClick={() => onDeleteHorse(horse.id)}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white">
          <p className="text-sm text-slate-400">По вашему запросу лошадей не найдено. Попробуйте сбросить фильтры.</p>
        </div>
      )}

      {/* --- MODAL DIALOGS --- */}
      
      {/* 1. Modal: Add or Edit Horse */}
      <Modal
        open={activeModal === 'add' || activeModal === 'edit'}
        onClose={() => setActiveModal(null)}
        panelId="horse-form-modal"
        panelClassName="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                {activeModal === 'add' ? 'Регистрация новой лошади' : `Редактирование: ${targetHorse?.name}`}
              </h3>
              <button 
                id="close-modal-btn"
                onClick={() => setActiveModal(null)} 
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHorse} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-slate-500 font-medium mb-1">Кличка (Имя) <span className="text-rose-500">*</span></label>
                  <input 
                    type="text"
                    required
                    value={horseForm.name}
                    onChange={(e) => setHorseForm({ ...horseForm, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs"
                    placeholder="Введите кличку лошади..."
                  />
                </div>

                {/* Coat */}
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Масть <span className="text-rose-500">*</span></label>
                  <select
                    value={horseForm.coat}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHorseForm({ ...horseForm, coat: val });
                      setIsCustomCoatSelected(val === 'custom');
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs cursor-pointer"
                  >
                    <option value="Гнедая">Гнедая (Bay)</option>
                    <option value="Вороная">Вороная (Black)</option>
                    <option value="Серая">Серая (Gray)</option>
                    <option value="Рыжая">Рыжая (Chestnut)</option>
                    <option value="Саврасая">Саврасая (Dun)</option>
                    <option value="Буланая">Буланая (Buckskin)</option>
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

                {/* Birth Date */}
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Дата рождения <span className="text-rose-500">*</span></label>
                  <input 
                    type="date"
                    required
                    value={horseForm.birthDate}
                    onChange={(e) => setHorseForm({ ...horseForm, birthDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Пол <span className="text-rose-500">*</span></label>
                  <select
                    value={horseForm.gender}
                    onChange={(e) => setHorseForm({ ...horseForm, gender: e.target.value as HorseGender })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs cursor-pointer"
                  >
                    <option value="mare">Кобыла (Mare)</option>
                    <option value="stallion">Жеребец (Stallion)</option>
                    <option value="gelding">Мерин (Gelding)</option>
                  </select>
                </div>

                {/* Owner */}
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Владелец</label>
                  <input
                    type="text"
                    value={horseForm.owner}
                    onChange={(e) => setHorseForm({ ...horseForm, owner: e.target.value })}
                    placeholder="Необязательно"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs"
                  />
                </div>

                {/* Father (Sire) */}
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Отец (Жеребец)</label>
                  <select
                    value={horseForm.sireId}
                    onChange={(e) => setHorseForm({ ...horseForm, sireId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs cursor-pointer"
                  >
                    <option value="">Неизвестно</option>
                    {horses.filter(h => h.gender === 'stallion').map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.coat})</option>
                    ))}
                    <option value="__new__">➕ Добавить нового жеребца…</option>
                  </select>

                  {/* Ввод нового жеребца прямо здесь */}
                  {horseForm.sireId === '__new__' && (
                    <div className="mt-2 space-y-2 bg-emerald-50/40 border border-emerald-100 rounded-xl p-2.5 animate-fadeIn">
                      <input
                        type="text"
                        value={newSireName}
                        onChange={(e) => setNewSireName(e.target.value)}
                        placeholder="Кличка жеребца *"
                        className="w-full p-2 border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white text-xs font-semibold text-slate-800"
                      />
                      <input
                        type="text"
                        value={newSireCoat}
                        onChange={(e) => setNewSireCoat(e.target.value)}
                        placeholder="Масть (необязательно)"
                        className="w-full p-2 border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white text-xs text-slate-800"
                      />
                      <p className="text-[10px] text-emerald-800/80 leading-snug">
                        Новый жеребец будет добавлен в реестр и назначен отцом. Возраст и данные можно уточнить позже в его карточке.
                      </p>
                    </div>
                  )}
                </div>

                {/* Mother (Dam) */}
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Мать (Кобыла)</label>
                  <select
                    value={horseForm.damId}
                    onChange={(e) => setHorseForm({ ...horseForm, damId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs cursor-pointer"
                  >
                    <option value="">Неизвестно</option>
                    {horses.filter(h => h.gender === 'mare').map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.coat})</option>
                    ))}
                  </select>
                </div>

                {/* Kosek Allocation */}
                <div className="col-span-2">
                  <label className="block text-slate-500 font-medium mb-1">Закрепление за косяком (Табун)</label>
                  <select
                    value={horseForm.kosekId}
                    onChange={(e) => setHorseForm({ ...horseForm, kosekId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs cursor-pointer"
                  >
                    <option value="">Вне косяка (Свободный табун)</option>
                    {koseks.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>

                {/* Image URL & File Upload */}
                <div className="col-span-2">
                  <label className="block text-slate-500 font-medium mb-1">Фотография лошади</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[10px] text-slate-400 mb-0.5 font-bold uppercase">Добавить изображение</span>
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
                          onClick={() => document.getElementById('file-upload-registry')?.click()}
                          className="flex-1 flex items-center justify-center gap-1.5 p-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-all font-bold text-xs cursor-pointer active:scale-95"
                        >
                          <span>Загрузить</span>
                        </button>
                      </div>
                      <input 
                        id="file-upload-registry"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              if (typeof reader.result === 'string') {
                                const compressed = await compressImage(reader.result);
                                setHorseForm(prev => ({ ...prev, imageUrl: compressed }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 mb-0.5 font-bold uppercase">Или вставить ссылку (URL)</span>
                      <input 
                        type="url"
                        value={horseForm.imageUrl.startsWith('data:') ? '' : horseForm.imageUrl}
                        onChange={(e) => setHorseForm({ ...horseForm, imageUrl: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>
                  </div>
                  {horseForm.imageUrl && (
                    <div className="mt-3 flex items-center gap-3 bg-emerald-50/50 p-2 rounded-2xl border border-emerald-100">
                      <img src={horseForm.imageUrl} alt="Превью" className="w-12 h-12 rounded-xl object-cover border border-emerald-200" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Предпросмотр</span>
                        <span className="text-xs font-semibold text-emerald-800">Изображение успешно прикреплено</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHorseForm({ ...horseForm, imageUrl: '' })}
                        className="ml-auto p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-slate-500 font-medium mb-1">Заметки / Особые отметки</label>
                  <textarea 
                    value={horseForm.notes}
                    onChange={(e) => setHorseForm({ ...horseForm, notes: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs h-16"
                    placeholder="Экстерьерные особенности, чип №, отметины..."
                  />
                </div>

                {/* Pregnancy details (only for mares) */}
                {horseForm.gender === 'mare' && (
                  <div className="col-span-2 bg-rose-50 p-3 rounded-xl border border-rose-100 space-y-2">
                    <SwitchGroup>
                      <div className="flex items-center gap-2.5">
                        <Switch
                          id="isPregnant-chk"
                          checked={horseForm.isPregnant}
                          onChange={(checked) => setHorseForm({ ...horseForm, isPregnant: checked })}
                          className="group relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-rose-200 transition-colors data-[checked]:bg-rose-600 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 cursor-pointer"
                        >
                          <span className="inline-block h-3.5 w-3.5 translate-x-1 rounded-full bg-white shadow-sm transition-transform group-data-[checked]:translate-x-4.5" />
                        </Switch>
                        <SwitchLabel className="font-semibold text-rose-900 cursor-pointer">
                          Кобыла жеребая (беременная)
                        </SwitchLabel>
                      </div>
                    </SwitchGroup>

                    {horseForm.isPregnant && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-rose-800 text-[10px] mb-0.5 font-medium">Дата спаривания</label>
                          <input 
                            type="date"
                            value={horseForm.pregnancyDate}
                            onChange={(e) => setHorseForm({ ...horseForm, pregnancyDate: e.target.value })}
                            className="w-full p-2 border border-rose-200 rounded-lg text-xs bg-white text-rose-900"
                          />
                        </div>
                        <div>
                          <label className="block text-rose-800 text-[10px] mb-0.5 font-medium">Ожидаемая дата родов</label>
                          <input 
                            type="date"
                            value={horseForm.pregnancyDueDate}
                            onChange={(e) => setHorseForm({ ...horseForm, pregnancyDueDate: e.target.value })}
                            className="w-full p-2 border border-rose-200 rounded-lg text-xs bg-white text-rose-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  id="cancel-form-btn"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  id="submit-form-btn"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {activeModal === 'add' ? 'Добавить в базу' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
      </Modal>

      {/* 2. Modal: Send to Fattening (Откорм) */}
      <Modal
        open={activeModal === 'fattening' && !!targetHorse}
        onClose={() => setActiveModal(null)}
        panelId="fattening-form-modal"
        panelClassName="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4"
      >
        {targetHorse && (
          <>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Постановка на откорм</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Вы собираетесь перевести лошадь <strong>{targetHorse.name}</strong> в статус откорма (нажировка).
            </p>

            <form onSubmit={handleSaveFattening} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Дата начала</label>
                  <input 
                    type="date"
                    required
                    value={fatteningForm.startDate}
                    onChange={(e) => setFatteningForm({ ...fatteningForm, startDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Срок (дней)</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={fatteningForm.durationDays}
                      onChange={(e) => setFatteningForm({ ...fatteningForm, durationDays: Number(e.target.value) })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Начальный вес (кг)</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={fatteningForm.startWeight}
                      onChange={(e) => setFatteningForm({ ...fatteningForm, startWeight: Number(e.target.value), currentWeight: Number(e.target.value) })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Заметки / Схема кормления</label>
                  <textarea 
                    value={fatteningForm.notes}
                    onChange={(e) => setFatteningForm({ ...fatteningForm, notes: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 h-16"
                    placeholder="Кормление клеверным сеном, овсом, добавками..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-xs"
                >
                  Поставить на откорм
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* 3. Modal: Cull Horse (Забой) */}
      <Modal
        open={activeModal === 'cull' && !!targetHorse}
        onClose={() => setActiveModal(null)}
        panelId="cull-form-modal"
        panelClassName="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4"
      >
        {targetHorse && (
          <>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Регистрация забоя
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Внимание! Вы регистрируете забой лошади <strong>{targetHorse.name}</strong>. Животное будет переведено в архив, а его количество <strong>автоматически вычтется</strong> из общего поголовья.
            </p>

            <form onSubmit={handleSaveCull} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Дата забоя</label>
                  <input 
                    type="date"
                    required
                    value={cullForm.cullDate}
                    onChange={(e) => setCullForm({ ...cullForm, cullDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Живой вес (кг)</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={cullForm.weight}
                      onChange={(e) => setCullForm({ ...cullForm, weight: Number(e.target.value) })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Выход мяса (%)</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={cullForm.meatYield}
                      onChange={(e) => setCullForm({ ...cullForm, meatYield: Number(e.target.value) })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Причина забоя / Списание</label>
                  <input 
                    type="text"
                    required
                    value={cullForm.reason}
                    onChange={(e) => setCullForm({ ...cullForm, reason: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                    placeholder="Например: Плановый забой на согым, травма..."
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Выручка (тенге / необязательно)</label>
                  <input 
                    type="number"
                    value={cullForm.revenue}
                    onChange={(e) => setCullForm({ ...cullForm, revenue: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Зафиксировать забой
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* Reusable HorseDetailModal to show complete statistics and update photo */}
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
            compressImage(dataUrl).then(c => setHorseForm(prev => ({ ...prev, imageUrl: c })));
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

    </div>
  );
}
