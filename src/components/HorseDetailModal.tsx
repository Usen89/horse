/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Horse } from '../types';
import CameraCapture from './CameraCapture';
import { 
  X, 
  Heart, 
  Calendar, 
  Baby, 
  Info, 
  User, 
  Bookmark, 
  Users, 
  Sparkles,
  GitBranch,
  ShieldCheck,
  Camera,
  Check,
  Trash2
} from 'lucide-react';

interface HorseDetailModalProps {
  horse: Horse | null;
  onClose: () => void;
  allHorses: Horse[]; // To find parents or offspring details
  onUpdateHorse?: (id: string, updatedFields: Partial<Horse>) => void;
}

export default function HorseDetailModal({
  horse,
  onClose,
  allHorses,
  onUpdateHorse
}: HorseDetailModalProps) {
  if (!horse) return null;

  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);

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

  // Find parents
  const sire = allHorses.find(h => h.id === horse.sireId);
  const dam = allHorses.find(h => h.id === horse.damId);

  // Find offspring
  const offspring = allHorses.filter(h => h.damId === horse.id || h.sireId === horse.id);

  // Render 12-day mating status for non-pregnant mares
  const renderMatingCalculation = () => {
    if (horse.gender !== 'mare' || horse.isPregnant || !horse.lastFoalingDate) return null;

    const foaledDate = new Date(horse.lastFoalingDate);
    const today = new Date();
    foaledDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - foaledDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const targetDate = new Date(foaledDate);
    targetDate.setDate(foaledDate.getDate() + 12);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    let bannerStyle = "bg-blue-50 border-blue-100 text-blue-950";
    let titleStyle = "text-blue-600";
    let desc = "";
    let badge = null;

    if (diffDays < 11) {
      const remaining = 12 - diffDays;
      desc = `До рекомендуемой даты случки (погулять) осталось ${remaining} дней. Кобыла восстанавливается после выжеребки.`;
      badge = (
        <span className="bg-blue-100 text-blue-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
          Период покоя
        </span>
      );
    } else if (diffDays >= 11 && diffDays <= 14) {
      bannerStyle = "bg-amber-50 border-amber-200 text-amber-950 animate-pulse";
      titleStyle = "text-amber-600";
      desc = `⚠️ Внимание: Время пришло! Ровно 12-й день после родов (${diffDays} дн. с момента родов). Настоятельно рекомендуется выгулять кобылу для повторного оплодотворения в период первой охоты.`;
      badge = (
        <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs animate-bounce">
          🔥 ПОРА ПОГУЛЯТЬ
        </span>
      );
    } else {
      bannerStyle = "bg-rose-50 border-rose-100 text-rose-950";
      titleStyle = "text-rose-600";
      desc = `⚠️ Пропущена первая охота после выжеребки. С момента родов прошло уже ${diffDays} дней. Рекомендуется показать кобылу ветеринару или спланировать случку в следующий цикл.`;
      badge = (
        <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
          Срок превышен
        </span>
      );
    }

    return (
      <div className={`p-4 rounded-2xl border ${bannerStyle} space-y-3`}>
        <div className="flex justify-between items-center">
          <span className={`text-[10px] font-black uppercase tracking-wider ${titleStyle} flex items-center gap-1`}>
            <Sparkles className="w-3.5 h-3.5" /> Контроль случки (12-й день после родов)
          </span>
          {badge}
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-slate-500 font-semibold">Дата выжеребки:</p>
            <p className="font-extrabold text-slate-800">{horse.lastFoalingDate}</p>
          </div>
          <div>
            <p className="text-slate-500 font-semibold">Рекомендуемая дата случки:</p>
            <p className="font-extrabold text-slate-800">{targetDateStr} (12-й день)</p>
          </div>
        </div>
        <p className="text-xs font-bold leading-relaxed">{desc}</p>
      </div>
    );
  };

  return (
    <div id="horse-detail-modal-overlay" className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Large Visible Photo Area */}
        <div className="relative h-64 md:h-72 w-full bg-slate-100 shrink-0">
          <img 
            src={horse.imageUrl || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&auto=format&fit=crop&q=80"} 
            alt={horse.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Gradients to ensure buttons readable */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>

          {/* Edit photo overlay button */}
          {onUpdateHorse && (
            <div className="absolute top-4 left-4 z-10 flex gap-1.5 flex-wrap">
              <button 
                onClick={() => setShowCamera(true)}
                className="bg-emerald-600/90 hover:bg-emerald-600 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md border border-white/20 active:scale-95"
                title="Снять фото на камеру"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Снять фото</span>
              </button>
              <button 
                onClick={() => document.getElementById('detail-photo-file-upload')?.click()}
                className="bg-slate-800/80 hover:bg-slate-800 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md border border-white/20 active:scale-95"
                title="Загрузить фотографию"
              >
                <span>Загрузить</span>
              </button>
              <input 
                id="detail-photo-file-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (typeof reader.result === 'string') {
                        onUpdateHorse(horse.id, { imageUrl: reader.result });
                        // Also update the local reference object in current modal
                        horse.imageUrl = reader.result;
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Core Info Overlayed on bottom of photo */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                horse.gender === 'stallion' 
                  ? 'bg-sky-500/80 border-sky-400/50' 
                  : horse.gender === 'mare'
                    ? 'bg-rose-500/80 border-rose-400/50'
                    : 'bg-amber-500/80 border-amber-400/50'
              }`}>
                {horse.gender === 'stallion' ? 'Жеребец-производитель' : horse.gender === 'mare' ? 'Кобыла' : 'Мерин'}
              </span>
              
              {horse.isPregnant && (
                <span className="bg-rose-600 border border-rose-400/50 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-white" /> Жеребая (Беременна)
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight mt-1 text-shadow">{horse.name}</h2>
            <p className="text-slate-200 text-xs mt-0.5 font-medium">
              Масть: <strong>{horse.coat}</strong> • {getAgeText(horse.birthDate)} ({horse.birthDate})
            </p>
          </div>
        </div>

        {/* Scrollable Information Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800">
          
          {/* Mating Status calculation if applicable */}
          {renderMatingCalculation()}

          {/* Grid fields */}
          <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Статус учета</span>
              <span className={`font-extrabold px-2.5 py-1 rounded-lg border inline-block ${
                horse.status === 'active' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                  : horse.status === 'fattening'
                    ? 'bg-amber-50 text-amber-800 border-amber-100 animate-pulse'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {horse.status === 'active' ? 'Активный выпас' : horse.status === 'fattening' ? 'На интенсивном откорме' : horse.status === 'slaughtered' ? 'Забит (Согым)' : 'Продан'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Владелец хозяйства</span>
              <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
                <User className="w-4 h-4 text-slate-400" />
                {horse.owner || 'Не указан'}
              </span>
            </div>
          </div>

          {/* Lineage / Parents */}
          <div className="space-y-3.5 border-b border-slate-100 pb-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-slate-400" /> Генеалогические корни (Родословная)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 font-bold block uppercase tracking-wider text-[8px] mb-1">Отец (Жеребец-производитель)</p>
                {sire ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-slate-200">
                      <img src={sire.imageUrl} alt={sire.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-extrabold text-slate-800">{sire.name}</span>
                  </div>
                ) : (
                  <span className="font-bold text-slate-500 italic">{horse.sireName || 'Неизвестен'}</span>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 font-bold block uppercase tracking-wider text-[8px] mb-1">Мать (Маточная кобыла)</p>
                {dam ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-slate-200">
                      <img src={dam.imageUrl} alt={dam.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-extrabold text-slate-800">{dam.name}</span>
                  </div>
                ) : (
                  <span className="font-bold text-slate-500 italic">{horse.damName || 'Неизвестна'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Offspring section */}
          {offspring.length > 0 && (
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Baby className="w-4 h-4 text-slate-400" /> Потомки ({offspring.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {offspring.map(off => (
                  <div key={off.id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-2 flex items-center gap-2.5 text-xs">
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-slate-200">
                      <img src={off.imageUrl} alt={off.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-800 block">{off.name}</span>
                      <span className="text-[8px] text-slate-400 block font-bold uppercase">{off.gender === 'stallion' ? 'Жеребчик' : 'Кобылка'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Дополнительные заметки фермы</span>
            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 font-medium leading-relaxed italic border border-slate-100">
              {horse.notes || 'Дополнительные примечания отсутствуют.'}
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl transition-all text-center cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" /> Закрыть карточку
          </button>
        </div>

      </div>

      {showCamera && (
        <CameraCapture 
          onCapture={(dataUrl) => {
            if (onUpdateHorse) {
              onUpdateHorse(horse.id, { imageUrl: dataUrl });
              horse.imageUrl = dataUrl;
            }
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
