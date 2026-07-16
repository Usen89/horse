/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Horse, FatteningRecord } from '../types';
import { getKazakhCategory } from '../utils/kazakhCategory';
import Modal from './ui/Modal';
import { 
  Utensils, 
  Calendar, 
  Sparkles, 
  Scale, 
  Check, 
  TrendingUp, 
  TrendingDown,
  Clock,
  AlertTriangle,
  Flame,
  FileText
} from 'lucide-react';

interface FatteningTabProps {
  horses: Horse[];
  fattenings: FatteningRecord[];
  onCompleteFattening: (horseId: string, action: 'pasture' | 'slaughter') => void;
  onUpdateWeights: (horseId: string, currentWeight: number, notes?: string) => void;
}

export default function FatteningTab({
  horses,
  fattenings,
  onCompleteFattening,
  onUpdateWeights
}: FatteningTabProps) {

  const [selectedRecord, setSelectedRecord] = useState<FatteningRecord | null>(null);
  const [newWeight, setNewWeight] = useState<number>(400);
  const [newNote, setNewNote] = useState<string>('');
  const [showWeightModal, setShowWeightModal] = useState(false);

  const activeFatteningHorses = horses.filter(h => h.status === 'fattening');

  const handleUpdateWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    onUpdateWeights(selectedRecord.horseId, newWeight, newNote);
    setShowWeightModal(false);
    setSelectedRecord(null);
  };

  const openWeightModal = (record: FatteningRecord) => {
    setSelectedRecord(record);
    setNewWeight(record.currentWeight || record.startWeight || 400);
    setNewNote(record.notes || '');
    setShowWeightModal(true);
  };

  // Helper function to render age in words
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

  return (
    <div id="fattening-tab-container" className="space-y-6">
      
      {/* Informational Hero */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="max-w-2xl">
          <span className="bg-amber-800/60 text-amber-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Интенсивный Нагул и Нажировка
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-2">Лошади на откорме</h2>
          <p className="text-amber-50/90 mt-1.5 text-xs leading-relaxed">
            Раздел предназначен для мониторинга продуктивного откорма. Здесь фиксируется дата постановки на откорм, 
            заданный срок и весовой прирост. По завершении срока животное может быть переведено обратно на пастбище или направлено на забой.
          </p>
        </div>

        {/* Headcount Stat Widget */}
        <div className="bg-amber-950/20 backdrop-blur-md border border-amber-500/25 p-4.5 rounded-2xl text-center shrink-0 w-full md:w-auto min-w-[170px] shadow-sm">
          <span className="text-[10px] text-amber-200 font-extrabold uppercase tracking-wider block">Общее количество</span>
          <span className="text-4xl font-black block mt-1 tracking-tight text-white">{activeFatteningHorses.length}</span>
          <span className="text-[11px] text-amber-100/80 font-medium block mt-1">голов на откорме</span>
        </div>
      </div>

      {/* Main List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2/3 size) - Active Fattening List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-950 text-base">Текущая группа нажировки ({activeFatteningHorses.length} голов)</h3>
            <span className="text-xs text-slate-400 font-semibold">Список активных животных</span>
          </div>
          
          {activeFatteningHorses.length > 0 ? (
            <div className="space-y-4">
              {activeFatteningHorses.map(horse => {
                const record = fattenings.find(f => f.horseId === horse.id);
                if (!record) return null;

                const startWeight = record.startWeight || 400;
                const currentWeight = record.currentWeight || startWeight;
                const gain = currentWeight - startWeight;
                const daysElapsed = Math.round(
                  (new Date().getTime() - new Date(record.startDate).getTime()) / (1000 * 60 * 60 * 24)
                );
                const percentElapsed = Math.min(100, Math.max(5, Math.round((daysElapsed / record.durationDays) * 100)));

                return (
                  <div 
                    key={horse.id} 
                    id={`fattening-card-${horse.id}`}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                      {/* Horse Basic Info */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60 shadow-2xs">
                          <img 
                            src={horse.imageUrl || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=100&auto=format&fit=crop&q=80"} 
                            alt={horse.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-extrabold text-slate-900 text-sm">{horse.name}</h4>
                            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-100/50 px-2 py-0.5 rounded-full font-extrabold">
                              {getAgeText(horse.birthDate)}
                            </span>
                            {(() => {
                              const kazakhCat = getKazakhCategory(horse.birthDate, horse.gender);
                              return (
                                <span className={`text-[9px] border px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${kazakhCat.color}`} title={kazakhCat.description}>
                                  {kazakhCat.name}
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">Масть: <strong className="text-slate-700">{horse.coat}</strong> • Владелец: {horse.owner}</p>
                          <span className="inline-block mt-1 text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Срок: {record.durationDays} дн.
                          </span>
                        </div>
                      </div>

                      {/* Weight progress card */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex items-center gap-4 shrink-0 shadow-2xs">
                        <div className="text-center px-1">
                          <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Старт</span>
                          <span className="font-extrabold text-slate-800 text-xs">{startWeight} кг</span>
                        </div>
                        <div className="text-center text-emerald-600 font-bold text-sm">
                          →
                        </div>
                        <div className="text-center px-1">
                          <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Текущий вес</span>
                          <span className="font-black text-slate-900 text-xs">{currentWeight} кг</span>
                        </div>
                        <div className="text-center bg-emerald-55 text-emerald-800 px-2.5 py-1 rounded-xl">
                          <span className="text-[8px] font-extrabold block uppercase leading-none tracking-wider">Прирост</span>
                          <span className="font-black text-xs">+{gain} кг</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Progress Bar */}
                    <div className="space-y-3.5">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3.5 text-xs text-slate-700">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[10px] block font-extrabold uppercase tracking-wider">Имя (Кличка)</span>
                          <strong className="text-slate-900 font-extrabold text-sm">{horse.name}</strong>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[10px] block font-extrabold uppercase tracking-wider">Возраст</span>
                          <strong className="text-slate-900 font-extrabold text-sm">{getAgeText(horse.birthDate)}</strong>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[10px] block font-extrabold uppercase tracking-wider">Какого числа поставили</span>
                          <strong className="text-slate-900 font-extrabold text-sm text-amber-700">{record.startDate}</strong>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[10px] block font-extrabold uppercase tracking-wider">Сколько уже стоит на откорме</span>
                          <strong className="text-slate-900 font-black text-sm text-emerald-700">{Math.max(0, daysElapsed)} дн.</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400 text-[10px] block font-medium">Заданный срок</span>
                          <strong className="text-slate-800 font-semibold">{record.durationDays} дн.</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block font-medium">Планируемый забой / финиш</span>
                          <strong className="text-slate-800 font-semibold">{record.endDate}</strong>
                        </div>
                      </div>

                      {/* Progress bar visual */}
                      <div>
                        <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1">
                          <span>Прогресс срока откорма</span>
                          <span>{percentElapsed}% времени</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percentElapsed}%` }}
                          ></div>
                        </div>
                      </div>

                      {record.notes && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          Заметка кормления: &ldquo;{record.notes}&rdquo;
                        </p>
                      )}

                      {/* Action buttons on fattening record */}
                      <div className="pt-2 border-t border-slate-50 flex flex-wrap gap-2 justify-end">
                        <button 
                          id={`update-weight-btn-${horse.id}`}
                          onClick={() => openWeightModal(record)}
                          className="px-3 py-1.5 border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Scale className="w-3.5 h-3.5" /> Взвесить
                        </button>
                        
                        <button 
                          id={`complete-to-pasture-${horse.id}`}
                          onClick={() => onCompleteFattening(horse.id, 'pasture')}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> На пастбище
                        </button>

                        <button 
                          id={`complete-to-slaughter-${horse.id}`}
                          onClick={() => onCompleteFattening(horse.id, 'slaughter')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all shadow-xs"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> На забой
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm text-slate-400">В данный момент нет лошадей на откорме.</p>
              <p className="text-xs text-slate-400 mt-1">Вы можете перевести любую лошадь на откорм через вкладку Базы Данных.</p>
            </div>
          )}
        </div>

        {/* Right column (1/3 size) - Information & Feeding Standards */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-amber-600" /> Сроки и Нормы нажировки
            </h3>
            
            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="border-l-2 border-amber-500 pl-3">
                <h4 className="font-semibold text-slate-800">Короткий откорм (30-45 дней)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Применяется весной-летом для взрослого нагульного скота на сочных пастбищах с добавлением ячменя.</p>
              </div>

              <div className="border-l-2 border-amber-500 pl-3">
                <h4 className="font-semibold text-slate-800">Интенсивный откорм (60-90 дней)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Осенне-зимний стойловый откорм молодняка. Рацион включает качественное сено бобовых, овес, отруби и жмых.</p>
              </div>

              <div className="bg-amber-50/50 p-3 rounded-xl text-[11px] text-amber-900 border border-amber-100/50">
                <h5 className="font-bold mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" /> Зоотехнический совет:
                </h5>
                При правильной организации интенсивного откорма среднесуточный прирост взрослого животного должен составлять от 800 до 1200 граммов. Контролируйте вес каждые 15 дней.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- WEIGHT UPDATE DIALOG --- */}
      <Modal
        open={showWeightModal && !!selectedRecord}
        onClose={() => setShowWeightModal(false)}
        panelId="update-weight-modal"
        panelClassName="bg-white rounded-2xl shadow-xl max-w-xs w-full p-6 space-y-4"
      >
        {selectedRecord && (
          <>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Контрольное взвешивание</h3>
              <button onClick={() => setShowWeightModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Введите новый текущий вес для <strong>{selectedRecord.horseName}</strong>.
            </p>

            <form onSubmit={handleUpdateWeightSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Новый вес (кг)</label>
                <div className="relative">
                  <input 
                    type="number"
                    required
                    min="1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-slate-50/50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">кг</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Предыдущий вес: {selectedRecord.currentWeight || selectedRecord.startWeight} кг</p>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Заметка кормления / Рацион (Корректировка вручную)</span>
                </label>
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-slate-50/50 h-20 leading-relaxed font-medium"
                  placeholder="Например: Люцерна, овес, витаминные добавки..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowWeightModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold"
                >
                  Обновить вес
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

    </div>
  );
}
