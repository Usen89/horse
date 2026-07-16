/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ArrowLeftRight, 
  ShieldAlert, 
  TrendingUp, 
  Trash2, 
  Activity, 
  X,
  FileText
} from 'lucide-react';
import { Horse, Kosek } from '../types';

export interface HistoryEvent {
  id: string;
  date: string;
  category: 'movement' | 'veterinary' | 'fattening' | 'slaughter' | 'birth' | 'general';
  title: string;
  description: string;
  horseName?: string;
  operator: string;
}

interface FarmHistoryProps {
  horses: Horse[];
  koseks: Kosek[];
  currentAdminName: string;
  onRequestConfirmation?: (title: string, message: string, onConfirm: () => void) => void;
}

const INITIAL_EVENTS: HistoryEvent[] = [
  {
    id: 'e-1',
    date: '2026-07-10',
    category: 'birth',
    title: 'Рождение жеребенка',
    description: 'В семействе Кокжала родилась кобылка Айсары от кобылы Актамак. Состояние новорожденного и матери отличное.',
    horseName: 'Айсары',
    operator: 'Ержан Усенов'
  },
  {
    id: 'e-2',
    date: '2026-07-08',
    category: 'veterinary',
    title: 'Плановая вакцинация',
    description: 'Проведена обязательная вакцинация косяка Кокжала против сибирской язвы ветеринаром С. Ахметовым.',
    horseName: 'Косяк Кокжала',
    operator: 'Ержан Усенов'
  },
  {
    id: 'e-3',
    date: '2026-07-05',
    category: 'fattening',
    title: 'Постановка на откорм',
    description: 'Жеребец Тайбуры поставлен на интенсивный стойловый откорм с начальным весом 410 кг.',
    horseName: 'Тайбуры',
    operator: 'Ержан Усенов'
  },
  {
    id: 'e-4',
    date: '2026-07-01',
    category: 'movement',
    title: 'Формирование нового семейства',
    description: 'Зарегистрировано новое семейство во главе с жеребцом-лидером Лашином. Выделен сектор Западного пастбища.',
    horseName: 'Семейство Лашина',
    operator: 'Асхат Калиев'
  },
  {
    id: 'e-5',
    date: '2026-06-25',
    category: 'slaughter',
    title: 'Плановый согым (забой)',
    description: 'Произведен вынужденный забой мерина Кулагер по возрасту. Выход чистого мяса составил 280 кг.',
    horseName: 'Кулагер',
    operator: 'Ержан Усенов'
  }
];

export default function FarmHistory({ horses, koseks, currentAdminName, onRequestConfirmation }: FarmHistoryProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // New Event Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'general' as HistoryEvent['category'],
    title: '',
    description: '',
    horseName: '',
    operator: currentAdminName
  });

  useEffect(() => {
    const saved = localStorage.getItem('farm_history_events');
    if (saved) {
      setEvents(JSON.parse(saved));
    } else {
      setEvents(INITIAL_EVENTS);
      localStorage.setItem('farm_history_events', JSON.stringify(INITIAL_EVENTS));
    }
  }, []);

  const saveEvents = (updated: HistoryEvent[]) => {
    setEvents(updated);
    localStorage.setItem('farm_history_events', JSON.stringify(updated));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    const newEvent: HistoryEvent = {
      id: `e-${Date.now()}`,
      ...form,
      operator: currentAdminName // Keep current active operator
    };

    const updated = [newEvent, ...events];
    saveEvents(updated);
    setShowAddModal(false);
    
    // Reset form
    setForm({
      date: new Date().toISOString().split('T')[0],
      category: 'general',
      title: '',
      description: '',
      horseName: '',
      operator: currentAdminName
    });
  };

  const handleDeleteEvent = (id: string) => {
    const performDelete = () => {
      const updated = events.filter(ev => ev.id !== id);
      saveEvents(updated);
    };

    if (onRequestConfirmation) {
      onRequestConfirmation(
        'Удаление записи',
        'Вы уверены, что хотите удалить эту запись из истории?',
        performDelete
      );
    } else if (confirm('Вы уверены, что хотите удалить эту запись из истории?')) {
      performDelete();
    }
  };

  const filteredEvents = events.filter(ev => {
    const matchesSearch = 
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.horseName && ev.horseName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ev.operator.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || ev.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: HistoryEvent['category']) => {
    switch (category) {
      case 'movement':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">
            <ArrowLeftRight className="w-3 h-3" /> Перемещение / Группы
          </span>
        );
      case 'veterinary':
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">
            <ShieldAlert className="w-3 h-3" /> Ветеринария
          </span>
        );
      case 'fattening':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">
            <TrendingUp className="w-3 h-3" /> Откорм
          </span>
        );
      case 'slaughter':
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">
            <FileText className="w-3 h-3" /> Забой (Согым)
          </span>
        );
      case 'birth':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">
            🌟 Рождение / Приплод
          </span>
        );
      default:
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">
            <Activity className="w-3 h-3" /> Общие события
          </span>
        );
    }
  };

  return (
    <div id="farm-history-tab" className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-950 text-xl tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            <span>История Хозяйства и Пастбищные Логи</span>
          </h2>
          <p className="text-xs text-slate-500">
            Хронологический журнал событий: отелы, вакцинации, перемещения табунов и другие важные изменения.
          </p>
        </div>
        
        <button 
          id="log-event-btn"
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Внести запись в журнал
        </button>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, деталям, кличке лошади или оператору..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {[
            { id: 'all', label: 'Все записи' },
            { id: 'birth', label: 'Приплод' },
            { id: 'movement', label: 'Перемещения' },
            { id: 'veterinary', label: 'Ветеринария' },
            { id: 'fattening', label: 'Откорм' },
            { id: 'slaughter', label: 'Забой' },
            { id: 'general', label: 'Другое' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-[11px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer ${
                selectedCategory === cat.id 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Timeline Stream */}
      {filteredEvents.length > 0 ? (
        <div className="relative border-l border-slate-200 ml-4.5 space-y-6.5 py-2">
          {filteredEvents.map(ev => (
            <div key={ev.id} className="relative pl-7 group">
              {/* Timeline dot */}
              <div className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              </div>

              {/* Event Container Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-950 font-black text-sm md:text-base leading-tight">
                      {ev.title}
                    </span>
                    {getCategoryBadge(ev.category)}
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {ev.date}
                    </span>
                    
                    {/* Delete entry */}
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="text-slate-300 hover:text-rose-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-rose-50"
                      title="Удалить запись"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-3.5 space-y-3.5">
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-medium">
                    {ev.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-50 text-[11px] font-bold text-slate-500">
                    {ev.horseName && (
                      <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <span className="text-slate-400 font-semibold">Объект:</span>
                        <span className="text-slate-800 font-extrabold">{ev.horseName}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 ml-auto bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400 font-semibold">Внес:</span>
                      <span className="text-emerald-800 font-extrabold">{ev.operator}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl space-y-3.5">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <History className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <p className="font-bold text-slate-700 text-sm">События не найдены</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Попробуйте изменить поисковый запрос или выберите другую категорию фильтрации.
            </p>
          </div>
        </div>
      )}

      {/* Add Custom History Record Modal */}
      {showAddModal && (
        <div id="add-history-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-fadeIn flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <span>Записать событие хозяйства</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4 text-xs overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Дата <span className="text-rose-500">*</span></label>
                  <input 
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 bg-slate-50/50 text-slate-800 text-xs font-semibold cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Категория <span className="text-rose-500">*</span></label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as HistoryEvent['category'] })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 bg-slate-50/50 text-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <option value="general">Общие события</option>
                    <option value="birth">Рождение / Приплод</option>
                    <option value="movement">Перемещение / Группы</option>
                    <option value="veterinary">Ветеринарный контроль</option>
                    <option value="fattening">Постановка на откорм</option>
                    <option value="slaughter">Забой (Согым)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Заголовок записи <span className="text-rose-500">*</span></label>
                <input 
                  type="text"
                  required
                  value={form.title}
                  placeholder="Например: Плановый взвес лошадей, Переход на Летнее пастбище"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Объект / Кличка животного (Необязательно)</label>
                <input 
                  type="text"
                  value={form.horseName}
                  placeholder="Например: Кокжал, Кобыла Лашын, Косяк №3"
                  onChange={(e) => setForm({ ...form, horseName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Описание события <span className="text-rose-500">*</span></label>
                <textarea 
                  required
                  value={form.description}
                  rows={4}
                  placeholder="Подробности: цели мероприятия, результаты, состояние здоровья, показатели веса или другие примечания..."
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 bg-slate-50/50 text-slate-800 text-xs font-semibold h-24 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer active:scale-98"
                >
                  Записать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
