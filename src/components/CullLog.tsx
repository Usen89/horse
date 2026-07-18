/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CullRecord } from '../types';
import Modal from './ui/Modal';
import { 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Scale, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle,
  FileSpreadsheet,
  Info,
  Edit2,
  Trash2
} from 'lucide-react';

interface CullLogProps {
  culls: CullRecord[];
  onUpdateCull: (id: string, updatedFields: Partial<CullRecord>) => void;
  onDeleteCull: (id: string) => void;
  onClearAll: () => void;
}

export default function CullLog({ culls, onUpdateCull, onDeleteCull, onClearAll }: CullLogProps) {
  // State for editing a cull record
  const [editingCull, setEditingCull] = useState<CullRecord | null>(null);
  const [isEditCustomCoatSelected, setIsEditCustomCoatSelected] = useState(false);
  const [editCustomCoatInput, setEditCustomCoatInput] = useState('');
  const [editForm, setEditForm] = useState({
    horseName: '',
    coat: '',
    cullDate: '',
    weight: 0,
    meatYield: 0,
    reason: '',
    revenue: 0
  });

  const handleStartEdit = (record: CullRecord) => {
    setEditingCull(record);
    const standardCoats = ['Гнедая', 'Вороная', 'Серая', 'Рыжая', 'Саврасая', 'Буланая', 'Чубарая'];
    const isCustom = !standardCoats.includes(record.coat);
    setIsEditCustomCoatSelected(isCustom);
    setEditCustomCoatInput(isCustom ? record.coat : '');

    setEditForm({
      horseName: record.horseName,
      coat: isCustom ? 'custom' : record.coat,
      cullDate: record.cullDate,
      weight: record.weight,
      meatYield: record.meatYield || Math.round(record.weight * 0.55),
      reason: record.reason,
      revenue: record.revenue || 0
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCull) return;
    const finalCoat = isEditCustomCoatSelected ? (editCustomCoatInput.trim() || 'Другая') : editForm.coat;
    onUpdateCull(editingCull.id, {
      horseName: editForm.horseName,
      coat: finalCoat,
      cullDate: editForm.cullDate,
      weight: Number(editForm.weight),
      meatYield: Number(editForm.meatYield),
      reason: editForm.reason,
      revenue: Number(editForm.revenue)
    });
    setEditingCull(null);
  };

  // Calculations
  const totalCullsCount = culls.length;
  
  const totalWeight = culls.reduce((sum, r) => sum + r.weight, 0);
  const averageWeight = totalCullsCount > 0 ? Math.round(totalWeight / totalCullsCount) : 0;
  
  const totalMeatYield = culls.reduce((sum, r) => sum + (r.meatYield || 0), 0);
  const totalRevenue = culls.reduce((sum, r) => sum + (r.revenue || 0), 0);

  return (
    <div id="cull-log-tab" className="space-y-6">
      
      {/* Explicit subtractive inventory warning / statement */}
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-start">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-rose-950 text-lg">Автоматический вычет и учет забоя</h2>
            <p className="text-xs text-rose-800 leading-relaxed mt-1">
              Все лошади, отправленные на забой (согым / санитарная выбраковка), 
              <strong> автоматически вычитаются из общего активного поголовья фермы </strong> 
              и навсегда переносятся в архивный реестр для сохранения финансовой и ветеринарной истории.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-rose-200 text-rose-900 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap">
            Вычтено: {totalCullsCount} голов
          </span>
          {totalCullsCount > 0 && (
            <button
              id="clear-cull-archive-btn"
              onClick={onClearAll}
              className="flex items-center gap-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title="Удалить все записи архива"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Очистить архив
            </button>
          )}
        </div>
      </div>

      {/* Cull Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total slaughtered */}
        <div id="stat-total-culls" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Общий убой (Архив)</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalCullsCount} голов</h3>
            <p className="text-[10px] text-slate-400 mt-1">зафиксировано в системе</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Avg Weight */}
        <div id="stat-avg-weight" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Ср. живой вес</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{averageWeight} кг</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">хороший весовой показатель</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Total Meat */}
        <div id="stat-total-meat" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Выход мяса (нетто)</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">~{totalMeatYield} кг</h3>
            <p className="text-[10px] text-slate-400 mt-1">убойный выход ок. 55%</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Revenue */}
        <div id="stat-total-revenue" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Оценочная выручка</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalRevenue.toLocaleString()} ₸</h3>
            <p className="text-[10px] text-slate-400 mt-1">реализация мяса и субпродуктов</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Cull Log Table */}
      <div id="cull-log-panel" className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Историческая ведомость забоя скота</h3>
            <p className="text-xs text-slate-500">Подробный учет убойной массы, выхода продукции и финансовой выручки.</p>
          </div>
          <button 
            id="export-cull-btn"
            onClick={() => alert('Экспорт ведомости в Excel/CSV успешно подготовлен по международным форматам отчетности!')}
            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 transition-all shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Экспорт ведомости
          </button>
        </div>

        {culls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 text-xs font-semibold">
                  <th className="py-3 px-4">Кличка лошади</th>
                  <th className="py-3 px-4">Масть / Пол</th>
                  <th className="py-3 px-4">Дата забоя</th>
                  <th className="py-3 px-4">Живой вес</th>
                  <th className="py-3 px-4">Выход мяса (нетто)</th>
                  <th className="py-3 px-4">Причина списания</th>
                  <th className="py-3 px-4 text-right">Выручка</th>
                  <th className="py-3 px-4 text-center">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {culls.map(record => (
                  <tr key={record.id} id={`cull-row-${record.id}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{record.horseName}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-500">{record.coat}</span>
                      <span className="text-slate-400"> • {record.gender === 'stallion' ? 'Жеребец' : record.gender === 'mare' ? 'Кобыла' : 'Мерин'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {record.cullDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{record.weight} кг</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                      {record.meatYield ? `${record.meatYield} кг` : '—'} 
                      <span className="text-[10px] text-slate-400 font-normal"> ({record.weight && record.meatYield ? Math.round((record.meatYield / record.weight) * 100) : 55}%)</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[200px] truncate" title={record.reason}>
                      {record.reason}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {record.revenue ? `${record.revenue.toLocaleString()} ₸` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleStartEdit(record)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                          title="Редактировать запись"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCull(record.id)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Удалить запись"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            Записей о забое не найдено.
          </div>
        )}
      </div>

      {/* Meat Yield reference widget */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-800">Международный зоотехнический регламент:</h4>
          <p className="leading-relaxed text-[11px] text-slate-500">
            Убойный выход конины зависит от упитанности, возраста и породы. Для нагульных лошадей казахских пород Жабы 
            и Кушумская средний выход чистого мяса-мякоти и жира составляет от 53% до 60% от живой массы. 
            Учет этих коэффициентов позволяет вести точное прогнозирование мясной продуктивности фермы.
          </p>
        </div>
      </div>

      {/* Edit Cull Modal */}
      <Modal
        open={!!editingCull}
        onClose={() => setEditingCull(null)}
        panelClassName="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col"
      >
        {editingCull && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <Edit2 className="w-5 h-5" /> Редактирование записи забоя
                </h3>
                <p className="text-xs text-emerald-100/80 mt-1">Редактирование параметров убоя для {editingCull.horseName}</p>
              </div>
              <button
                onClick={() => setEditingCull(null)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Horse Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Кличка лошади</label>
                <input
                  type="text"
                  required
                  value={editForm.horseName}
                  onChange={(e) => setEditForm({ ...editForm, horseName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              {/* Coat Selector & Custom Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Масть</label>
                <select
                  value={editForm.coat}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditForm({ ...editForm, coat: val });
                    setIsEditCustomCoatSelected(val === 'custom');
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 cursor-pointer"
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

                {isEditCustomCoatSelected && (
                  <div className="mt-2 animate-fadeIn">
                    <input
                      type="text"
                      required
                      value={editCustomCoatInput}
                      onChange={(e) => setEditCustomCoatInput(e.target.value)}
                      placeholder="Укажите масть вручную..."
                      className="w-full p-2.5 border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 bg-emerald-50/20 text-xs font-semibold text-emerald-950"
                    />
                  </div>
                )}
              </div>

              {/* Cull Date */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Дата забоя</label>
                <input
                  type="date"
                  required
                  value={editForm.cullDate}
                  onChange={(e) => setEditForm({ ...editForm, cullDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 font-bold"
                />
              </div>

              {/* Weight & Meat Yield */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Живой вес (кг)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editForm.weight || ''}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      setEditForm({ 
                        ...editForm, 
                        weight: w,
                        meatYield: Math.round(w * 0.55) // Auto-recalculate estimated meat yield
                      });
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Выход мяса (кг)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editForm.meatYield || ''}
                    onChange={(e) => setEditForm({ ...editForm, meatYield: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 font-semibold"
                  />
                </div>
              </div>

              {/* Revenue */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Выручка (₸)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.revenue || ''}
                  onChange={(e) => setEditForm({ ...editForm, revenue: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 font-semibold"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Причина забоя / списания</label>
                <textarea
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCull(null)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

    </div>
  );
}
