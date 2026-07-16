/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Horse } from '../types';
import { GitBranch, Award } from 'lucide-react';

interface OffspringTreeProps {
  horse: Horse;
  allHorses: Horse[];
  onSelectHorse: (horseId: string) => void;
}

/**
 * Карта потомства выбранной лошади: дети → внуки → правнуки.
 * (Родословное древо предков удалено по требованию хозяйства —
 * оставлен только учёт потомков.)
 */
export default function OffspringTree({ horse, allHorses, onSelectHorse }: OffspringTreeProps) {
  const children = allHorses.filter(h => h.sireId === horse.id || h.damId === horse.id);

  return (
    <div id="offspring-tree-container" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
          <GitBranch className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-base">Потомство: {horse.name}</h3>
          <p className="text-xs text-slate-500">
            Интерактивная карта потомков: кто родился от данной лошади (дети, внуки, правнуки).
          </p>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500 font-medium">
          У этой лошади пока нет зарегистрированных потомков первого поколения в системе.<br />
          <span className="text-[10px] text-slate-400">При регистрации рождения укажите эту лошадь в качестве матери или отца.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {children.map(child => {
            const grandchildren = allHorses.filter(h => h.sireId === child.id || h.damId === child.id);
            return (
              <div key={child.id} className="relative pl-6 border-l-2 border-emerald-100 last:border-l-transparent">
                {/* Horizontal connector line */}
                <div className="absolute top-6 left-0 w-6 h-[2px] bg-emerald-100"></div>

                {/* Child Node Card */}
                <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 max-w-md shadow-xs hover:border-emerald-300 transition-all">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-200 border-2 border-white shadow-xs">
                    <img src={child.imageUrl} alt={child.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="grow">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{child.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        child.gender === 'stallion' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {child.gender === 'stallion' ? 'Жеребец' : 'Кобыла'}
                      </span>
                    </div>
                    <div className="flex gap-2 text-[10px] text-slate-400 font-bold mt-0.5">
                      <span>Масть: {child.coat}</span>
                      <span>•</span>
                      <span>Рождение: {child.birthDate}</span>
                    </div>
                    <button
                      onClick={() => onSelectHorse(child.id)}
                      className="mt-1.5 text-[10px] text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center gap-0.5"
                    >
                      Смотреть потомство этого потомка →
                    </button>
                  </div>
                </div>

                {/* Grandchildren Layer */}
                {grandchildren.length > 0 && (
                  <div className="mt-3 ml-6 space-y-3 pl-6 border-l-2 border-amber-100 last:border-l-transparent relative">
                    {grandchildren.map(grand => {
                      const greatGrandchildren = allHorses.filter(h => h.sireId === grand.id || h.damId === grand.id);
                      return (
                        <div key={grand.id} className="relative">
                          <div className="absolute top-5 -left-12 w-12 h-[2px] bg-amber-100"></div>
                          <div className="flex items-start gap-3 bg-amber-50/40 border border-amber-200/60 rounded-xl p-2.5 max-w-sm shadow-xs hover:border-amber-400 transition-all">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-200 border border-white shadow-xs">
                              <img src={grand.imageUrl} alt={grand.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="grow">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 text-[11px]">{grand.name}</span>
                                <span className={`text-[7px] px-1 py-0.2 rounded-full font-bold uppercase ${
                                  grand.gender === 'stallion' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                                }`}>
                                  {grand.gender === 'stallion' ? 'Внук' : 'Внучка'}
                                </span>
                              </div>
                              <div className="flex gap-1.5 text-[9px] text-slate-400 font-bold">
                                <span>Масть: {grand.coat}</span>
                                <span>•</span>
                                <span>Рожд: {grand.birthDate}</span>
                              </div>
                              <button
                                onClick={() => onSelectHorse(grand.id)}
                                className="mt-1 text-[9px] text-amber-700 hover:text-amber-800 font-extrabold"
                              >
                                Перейти →
                              </button>
                            </div>
                          </div>

                          {/* Great Grandchildren */}
                          {greatGrandchildren.length > 0 && (
                            <div className="mt-2 ml-6 pl-4 border-l-2 border-emerald-200 last:border-l-transparent space-y-2 relative">
                              {greatGrandchildren.map(great => (
                                <div key={great.id} className="relative">
                                  <div className="absolute top-4 -left-8 w-8 h-[2px] bg-emerald-200"></div>
                                  <div className="flex items-center gap-2 bg-emerald-50/30 border border-emerald-100 rounded-lg p-1.5 max-w-xs">
                                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                                      <img src={great.imageUrl} alt={great.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="grow">
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-700 text-[10px]">{great.name}</span>
                                        <span className="text-[7px] text-emerald-700 font-bold uppercase">Правнук/ца</span>
                                      </div>
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
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2 text-xs text-amber-800">
        <Award className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          <strong>Племенной учёт потомства:</strong> при регистрации рождения жеребёнка укажите
          отца и мать из базы данных — потомок автоматически появится на этой карте, а также
          в разделах матери и отца.
        </p>
      </div>
    </div>
  );
}
