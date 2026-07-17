/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Horse, Vaccination } from '../types';
import { getKazakhCategory } from '../utils/kazakhCategory';
import { getEffectiveVaccinationStatus } from '../utils/vaccination';
import Modal from './ui/Modal';
import { 
  Calendar, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Search, 
  Sparkles, 
  ShieldCheck,
  User,
  Info,
  Pencil
} from 'lucide-react';

interface VaccinationTabProps {
  horses: Horse[];
  vaccinations: Vaccination[];
  onAddVaccination: (vaccination: Omit<Vaccination, 'id'>) => void;
  onUpdateVaccinationStatus: (id: string, status: 'completed' | 'overdue' | 'planned') => void;
  onUpdateVaccination?: (id: string, updatedFields: Partial<Vaccination>) => void;
}

export default function VaccinationTab({
  horses,
  vaccinations,
  onAddVaccination,
  onUpdateVaccinationStatus,
  onUpdateVaccination
}: VaccinationTabProps) {

  // Local UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit Vaccination States
  const [editingVaccine, setEditingVaccine] = useState<Vaccination | null>(null);
  const [editForm, setEditForm] = useState({
    disease: '',
    date: '',
    nextDueDate: '',
    veterinarian: '',
    status: 'planned' as 'completed' | 'overdue' | 'planned'
  });

  // Form Fields for new Vaccination
  const [vaccineForm, setVaccineForm] = useState({
    horseId: '',
    disease: 'Сибирская язва',
    customDisease: '',
    date: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    veterinarian: 'Д-р Ахметов К. С.',
    status: 'completed' as 'completed' | 'overdue' | 'planned'
  });

  // Filter active living horses for vaccination targets
  const activeHorses = horses.filter(h => h.status !== 'slaughtered' && h.status !== 'sold');

  // Handle vaccine submit
  const handleVaccineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaccineForm.horseId) return;

    const selectedHorse = horses.find(h => h.id === vaccineForm.horseId);
    if (!selectedHorse) return;

    const diseaseName = vaccineForm.disease === 'Другое' 
      ? vaccineForm.customDisease 
      : vaccineForm.disease;

    // Calculate automatically 1 year from date if nextDueDate is blank
    let nextDate = vaccineForm.nextDueDate;
    if (!nextDate) {
      const d = new Date(vaccineForm.date);
      d.setFullYear(d.getFullYear() + 1);
      nextDate = d.toISOString().split('T')[0];
    }

    onAddVaccination({
      horseId: vaccineForm.horseId,
      horseName: selectedHorse.name,
      disease: diseaseName || 'Плановая прививка',
      date: vaccineForm.date,
      nextDueDate: nextDate,
      veterinarian: vaccineForm.veterinarian,
      status: vaccineForm.status
    });

    // Reset Form
    setVaccineForm({
      horseId: '',
      disease: 'Сибирская язва',
      customDisease: '',
      date: new Date().toISOString().split('T')[0],
      nextDueDate: '',
      veterinarian: '',
      status: 'completed'
    });
    setShowAddForm(false);
  };

  // Open Edit Dialog
  const handleStartEdit = (v: Vaccination) => {
    setEditingVaccine(v);
    setEditForm({
      disease: v.disease,
      date: v.date,
      nextDueDate: v.nextDueDate,
      veterinarian: v.veterinarian,
      status: v.status
    });
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateVaccination && editingVaccine) {
      onUpdateVaccination(editingVaccine.id, {
        disease: editForm.disease,
        date: editForm.date,
        nextDueDate: editForm.nextDueDate,
        veterinarian: editForm.veterinarian,
        status: editForm.status
      });
      setEditingVaccine(null);
    }
  };

  // Filter vaccinations
  const filteredVaccinations = vaccinations.filter(v => {
    const matchesSearch = 
      v.horseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.veterinarian.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' || getEffectiveVaccinationStatus(v) === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div id="vaccination-tab-container" className="space-y-6">
      
      {/* Tab Header with visual toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900 text-lg">Календарь вакцинации и вет-контроль</h2>
          <p className="text-xs text-slate-500">Систематическая профилактика инфекционных заболеваний и ветеринарный надзор.</p>
        </div>
        
        <button 
          id="log-vaccine-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> {showAddForm ? 'Скрыть форму' : 'Внести запись вакцинации'}
        </button>
      </div>

      {/* Inline Registration Form */}
      {showAddForm && (
        <div id="vaccination-form-container" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs max-w-xl">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Внести ветеринарную запись о вакцинации</h3>
          
          <form onSubmit={handleVaccineSubmit} className="space-y-4 text-xs text-slate-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Select Horse */}
              <div>
                <label className="block text-slate-500 font-medium mb-1">Выберите лошадь <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={vaccineForm.horseId}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, horseId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 cursor-pointer"
                >
                  <option value="">Выберите животное...</option>
                  {activeHorses.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.coat}, {h.gender === 'stallion' ? 'Жеребец' : h.gender === 'mare' ? 'Кобыла' : 'Мерин'})</option>
                  ))}
                </select>
              </div>

              {/* Disease Select */}
              <div>
                <label className="block text-slate-500 font-medium mb-1">Заболевание (Вакцина) <span className="text-rose-500">*</span></label>
                <select
                  value={vaccineForm.disease}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, disease: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 cursor-pointer"
                >
                  <option value="Сибирская язва">Сибирская язва (Anthrax)</option>
                  <option value="Сап (Malleus)">Сап (Malleus)</option>
                  <option value="Мыт (Strangles)">Мыт (Strangles)</option>
                  <option value="Грипп лошадей">Грипп лошадей (Influenza)</option>
                  <option value="Бешенство">Бешенство (Rabies)</option>
                  <option value="Трихофития">Трихофития (Лишай)</option>
                  <option value="Другое">Другое (ввести вручную)</option>
                </select>
              </div>

              {/* Custom Disease Name */}
              {vaccineForm.disease === 'Другое' && (
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 font-medium mb-1">Укажите заболевание вручную <span className="text-rose-500">*</span></label>
                  <input 
                    type="text"
                    required
                    value={vaccineForm.customDisease}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, customDisease: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                    placeholder="Название вакцины или процедуры..."
                  />
                </div>
              )}

              {/* Date of Vaccine */}
              <div>
                <label className="block text-slate-500 font-medium mb-1">Дата вакцинации <span className="text-rose-500">*</span></label>
                <input 
                  type="date"
                  required
                  value={vaccineForm.date}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, date: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              {/* Next Due Date */}
              <div>
                <label className="block text-slate-500 font-medium mb-1">Срок ревакцинации (Оставить пустым для +1 года)</label>
                <input 
                  type="date"
                  value={vaccineForm.nextDueDate}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, nextDueDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                  placeholder="Рекомендуемый срок..."
                />
              </div>

              {/* Veterinarian */}
              <div>
                <label className="block text-slate-500 font-medium mb-1">Ветеринарный врач <span className="text-rose-500">*</span></label>
                <input 
                  type="text"
                  required
                  value={vaccineForm.veterinarian}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, veterinarian: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-500 font-medium mb-1">Статус проведения <span className="text-rose-500">*</span></label>
                <select
                  value={vaccineForm.status}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, status: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 cursor-pointer"
                >
                  <option value="completed">Проведена (Completed)</option>
                  <option value="planned">Запланирована (Planned)</option>
                  <option value="overdue">Просрочена (Overdue)</option>
                </select>
              </div>

            </div>

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
              >
                Отмена
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
              >
                Сохранить запись
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            id="vaccines-search"
            type="text" 
            placeholder="Поиск по имени лошади, вакцине или ветврачу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 w-full text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50/50"
          />
        </div>

        {/* Filter select */}
        <div className="relative min-w-[150px]">
          <select
            id="vaccines-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="pl-3 pr-8 py-2 w-full text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50/50 appearance-none cursor-pointer"
          >
            <option value="all">Статус: Все</option>
            <option value="completed">Только Проведенные</option>
            <option value="overdue">Только Просроченные</option>
            <option value="planned">Только Запланированные</option>
          </select>
        </div>
      </div>

      {/* Grid List of Vaccination records */}
      <div id="vaccinations-list-panel" className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {filteredVaccinations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 text-xs font-semibold">
                  <th className="py-3 px-4">Лошадь</th>
                  <th className="py-3 px-4">Заболевание (Вакцина)</th>
                  <th className="py-3 px-4">Дата прививки</th>
                  <th className="py-3 px-4">Дата ревакцинации</th>
                  <th className="py-3 px-4">Ветеринарный врач</th>
                  <th className="py-3 px-4">Статус</th>
                  <th className="py-3 px-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredVaccinations.map(vaccine => {
                  const effStatus = getEffectiveVaccinationStatus(vaccine);
                  const isOverdue = effStatus === 'overdue';
                  const targetHorse = horses.find(h => h.id === vaccine.horseId);
                  
                  return (
                    <tr key={vaccine.id} id={`vaccine-row-${vaccine.id}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex flex-col gap-0.5">
                          <span>{vaccine.horseName}</span>
                          {targetHorse && (() => {
                            const kc = getKazakhCategory(targetHorse.birthDate, targetHorse.gender);
                            return (
                              <span className={`text-[9px] border px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider self-start mt-0.5 ${kc.color}`}>
                                {kc.name}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{vaccine.disease}</td>
                      <td className="py-3.5 px-4 text-slate-500">{vaccine.date}</td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                          {vaccine.nextDueDate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" /> {vaccine.veterinarian}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          effStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : effStatus === 'overdue'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {effStatus === 'completed' && <><ShieldCheck className="w-3.5 h-3.5" /> Проведена</>}
                          {effStatus === 'overdue' && <><ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Просрочена</>}
                          {effStatus === 'planned' && 'Запланирована'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            id={`edit-vaccine-btn-${vaccine.id}`}
                            onClick={() => handleStartEdit(vaccine)}
                            className="p-1 text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded-lg bg-white transition-colors"
                            title="Редактировать запись вручную"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          
                          {effStatus !== 'completed' && (
                            <button
                              id={`mark-complete-btn-${vaccine.id}`}
                              onClick={() => onUpdateVaccinationStatus(vaccine.id, 'completed')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 font-bold rounded-lg text-[11px]"
                            >
                              Привить
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            Записей о вакцинации не найдено.
          </div>
        )}
      </div>

      {/* Expert Advice for Veterinary Compliance */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-800">Календарь ветеринарных мероприятий (OIE Standards):</h4>
          <p className="leading-relaxed text-[11px] text-slate-500">
            Своевременная вакцинация предохраняет стадо от массовых эпидемий. Сап (Malleus) и Сибирская язва являются особо опасными 
            карантинными зоонозами, передающимися людям. Проведение ежегодных диагностических исследований (аллергический тест на сап) 
            и профилактической иммунизации является строгой обязанностью каждого коневода.
          </p>
        </div>
      </div>

      {/* --- EDIT VACCINATION MODAL (MANUAL EDITING) --- */}
      <Modal
        open={!!editingVaccine}
        onClose={() => setEditingVaccine(null)}
        panelId="edit-vaccine-modal"
        panelClassName="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 text-xs text-slate-600"
      >
        {editingVaccine && (
          <>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Корректировка ветеринарной записи</h3>
              <button onClick={() => setEditingVaccine(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-[11px] text-slate-500">
              Корректировка вручную параметров ветеринарной записи для <strong>{editingVaccine.horseName}</strong>.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Заболевание (Вакцина)</label>
                <input 
                  type="text"
                  required
                  value={editForm.disease}
                  onChange={(e) => setEditForm({ ...editForm, disease: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Дата вакцинации</label>
                  <input 
                    type="date"
                    required
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Ревакцинация</label>
                  <input 
                    type="date"
                    required
                    value={editForm.nextDueDate}
                    onChange={(e) => setEditForm({ ...editForm, nextDueDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Ветеринарный врач</label>
                <input 
                  type="text"
                  required
                  value={editForm.veterinarian}
                  onChange={(e) => setEditForm({ ...editForm, veterinarian: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Статус проведения</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 cursor-pointer"
                >
                  <option value="completed">Проведена</option>
                  <option value="planned">Запланирована</option>
                  <option value="overdue">Просрочена</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setEditingVaccine(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Применить изменения
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

    </div>
  );
}
