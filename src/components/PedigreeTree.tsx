/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Horse } from '../types';
import { ShieldAlert, Users, Award, ChevronRight, GitBranch } from 'lucide-react';

interface PedigreeTreeProps {
  horse: Horse;
  allHorses: Horse[];
  onSelectHorse: (horseId: string) => void;
}

export default function PedigreeTree({ horse, allHorses, onSelectHorse }: PedigreeTreeProps) {
  // Helper to find horse by ID or look it up by name
  const findHorse = (id: string | null, cachedName?: string): { horse: Horse | null; name: string } => {
    if (id) {
      const found = allHorses.find(h => h.id === id);
      if (found) return { horse: found, name: found.name };
    }
    if (cachedName) {
      const foundByName = allHorses.find(h => h.name.toLowerCase() === cachedName.toLowerCase());
      if (foundByName) return { horse: foundByName, name: foundByName.name };
      return { horse: null, name: cachedName };
    }
    return { horse: null, name: 'Неизвестно' };
  };

  // Generation 1
  const sireInfo = findHorse(horse.sireId, horse.sireName);
  const damInfo = findHorse(horse.damId, horse.damName);

  // Generation 2 (Paternal Grandparents)
  const paternalGrandfather = sireInfo.horse 
    ? findHorse(sireInfo.horse.sireId, sireInfo.horse.sireName)
    : { horse: null, name: 'Неизвестно' };
    
  const paternalGrandmother = sireInfo.horse
    ? findHorse(sireInfo.horse.damId, sireInfo.horse.damName)
    : { horse: null, name: 'Неизвестно' };

  // Generation 2 (Maternal Grandparents)
  const maternalGrandfather = damInfo.horse
    ? findHorse(damInfo.horse.sireId, damInfo.horse.sireName)
    : { horse: null, name: 'Неизвестно' };
    
  const maternalGrandmother = damInfo.horse
    ? findHorse(damInfo.horse.damId, damInfo.horse.damName)
    : { horse: null, name: 'Неизвестно' };

  // Render a single card in the pedigree tree
  const renderCard = (
    name: string,
    horseObj: Horse | null,
    role: string,
    type: 'sire' | 'dam' | 'subject'
  ) => {
    const isClickable = horseObj !== null;
    const isMale = type === 'sire' || (horseObj && horseObj.gender === 'stallion');
    
    return (
      <div 
        id={`pedigree-card-${name.replace(/\s+/g, '-')}`}
        onClick={() => horseObj && onSelectHorse(horseObj.id)}
        className={`p-3 rounded-lg border transition-all text-left ${
          type === 'subject' 
            ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
            : isClickable
              ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs hover:border-emerald-300 cursor-pointer'
              : 'bg-slate-50/50 text-slate-400 border-slate-100'
        }`}
      >
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className={`text-[10px] font-semibold tracking-wider uppercase ${
              type === 'subject' 
                ? 'text-emerald-100' 
                : isMale 
                  ? 'text-sky-600' 
                  : 'text-rose-500'
            }`}>
              {role}
            </span>
            <h4 className="font-semibold text-sm line-clamp-1">
              {name}
            </h4>
            {horseObj && (
              <div className="mt-1 text-[11px] opacity-90 space-y-0.5">
                <p className={type === 'subject' ? 'text-emerald-100' : 'text-slate-500'}>
                  Масть: {horseObj.coat}
                </p>
                <p className={type === 'subject' ? 'text-emerald-100' : 'text-slate-500'}>
                  Возраст: {getAgeText(horseObj.birthDate)}
                </p>
              </div>
            )}
          </div>
          {isClickable && (
            <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 ${type === 'subject' ? 'text-white' : 'text-slate-400'}`} />
          )}
        </div>
      </div>
    );
  };

  // Helper to calculate age from birthdate
  function getAgeText(birthDateStr: string) {
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age === 0) {
      // Calculate in months
      const months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
      if (months <= 0) return 'Меньше месяца';
      return `${months} мес.`;
    }
    
    if (age === 1) return '1 год';
    if (age > 1 && age < 5) return `${age} года`;
    return `${age} лет`;
  }

  return (
    <div id="pedigree-tree-container" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-base">Родословное древо</h3>
          <p className="text-xs text-slate-500">
            Интерактивная генеалогия до 3-го поколения. Кликните на лошадь, чтобы перейти к её профилю.
          </p>
        </div>
      </div>

      <div className="relative overflow-x-auto py-2">
        <div className="min-w-[650px] grid grid-cols-3 gap-6 items-center relative">
          
          {/* Column 1: Subject */}
          <div className="flex flex-col justify-center h-full">
            <div className="relative">
              {renderCard(horse.name, horse, 'Выбранная лошадь', 'subject')}
              
              {/* Connector from Subject to Parents */}
              <div className="absolute top-1/2 -translate-y-1/2 -right-6 w-6 h-[2px] bg-slate-200 z-0"></div>
            </div>
          </div>

          {/* Column 2: Parents */}
          <div className="flex flex-col justify-around h-full min-h-[300px] py-4 relative gap-8">
            {/* Top Connector bracket */}
            <div className="absolute left-0 top-[25%] bottom-[25%] w-[2px] bg-slate-200"></div>
            
            {/* Father (Sire) */}
            <div className="relative z-10 pl-2">
              {renderCard(sireInfo.name, sireInfo.horse, 'Отец (Сир)', 'sire')}
              {/* Connector to paternal grandparents */}
              <div className="absolute top-1/2 -translate-y-1/2 -right-6 w-6 h-[2px] bg-slate-200"></div>
              {/* Connector to subject bracket */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-2 h-[2px] bg-slate-200"></div>
            </div>

            {/* Mother (Dam) */}
            <div className="relative z-10 pl-2">
              {renderCard(damInfo.name, damInfo.horse, 'Мать (Дамба)', 'dam')}
              {/* Connector to maternal grandparents */}
              <div className="absolute top-1/2 -translate-y-1/2 -right-6 w-6 h-[2px] bg-slate-200"></div>
              {/* Connector to subject bracket */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-2 h-[2px] bg-slate-200"></div>
            </div>
          </div>

          {/* Column 3: Grandparents */}
          <div className="flex flex-col justify-between h-full min-h-[340px] py-1 gap-4 relative">
            {/* Top Paternal bracket */}
            <div className="absolute left-0 top-[12.5%] bottom-[62.5%] w-[2px] bg-slate-200"></div>
            {/* Bottom Maternal bracket */}
            <div className="absolute left-0 top-[62.5%] bottom-[12.5%] w-[2px] bg-slate-200"></div>

            {/* Paternal Grandfather */}
            <div className="pl-2 relative z-10">
              {renderCard(paternalGrandfather.name, paternalGrandfather.horse, 'Дедушка (по отцу)', 'sire')}
              <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-2 h-[2px] bg-slate-200"></div>
            </div>

            {/* Paternal Grandmother */}
            <div className="pl-2 relative z-10">
              {renderCard(paternalGrandmother.name, paternalGrandmother.horse, 'Бабушка (по отцу)', 'dam')}
              <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-2 h-[2px] bg-slate-200"></div>
            </div>

            {/* Maternal Grandfather */}
            <div className="pl-2 relative z-10">
              {renderCard(maternalGrandfather.name, maternalGrandfather.horse, 'Дедушка (по матери)', 'sire')}
              <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-2 h-[2px] bg-slate-200"></div>
            </div>

            {/* Maternal Grandmother */}
            <div className="pl-2 relative z-10">
              {renderCard(maternalGrandmother.name, maternalGrandmother.horse, 'Бабушка (по матери)', 'dam')}
              <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-2 h-[2px] bg-slate-200"></div>
            </div>
          </div>

        </div>
      </div>

      {/* --- ДРЕВО ПОКОЛЕНИЙ И ПОТОМСТВА (КТО ОТ КОГО) --- */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs mt-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Древо поколений и потомства</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Интерактивная карта потомков: кто родился от данной лошади</p>
          </div>
        </div>

        {allHorses.filter(h => h.sireId === horse.id || h.damId === horse.id).length === 0 ? (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500 font-medium">
            У этой лошади пока нет зарегистрированных потомков первого поколения в системе.<br />
            <span className="text-[10px] text-slate-400">При регистрации рождения укажите эту лошадь в качестве матери или отца.</span>
          </div>
        ) : (
          <div className="space-y-6">
            {allHorses
              .filter(h => h.sireId === horse.id || h.damId === horse.id)
              .map(child => {
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
                          Смотреть родословную этого потомка →
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
      </div>

      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2 text-xs text-amber-800">
        <Award className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          <strong>Международная практика племенного учета:</strong> Для полноценной родословной 
          необходимо, чтобы родители также были внесены в систему. При регистрации жеребенка выберите 
          отца и мать из существующей базы данных. Родословная построится автоматически.
        </p>
      </div>
    </div>
  );
}
