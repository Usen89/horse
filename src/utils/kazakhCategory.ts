/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HorseGender, Horse } from '../types';

export interface KazakhCategory {
  name: string;
  description: string;
  color: string; // Tailwind color classes for badges
}

/** Возраст в месяцах. Пустая/некорректная дата → Infinity (считаем взрослым). */
export function ageInMonths(birthDateStr: string): number {
  if (!birthDateStr) return Infinity;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return Infinity;
  const today = new Date();
  return (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
}

/** Жеребёнок — младше 12 месяцев. */
export function isFoal(birthDateStr: string): boolean {
  return ageInMonths(birthDateStr) < 12;
}

/**
 * Пол/тип для отображения С УЧЁТОМ ВОЗРАСТА. Молодняк до года показывается
 * как «Жеребёнок (мальчик/девочка)», а не «Жеребец»/«Кобыла».
 */
export function getSexTypeShort(birthDateStr: string, gender: HorseGender): string {
  if (isFoal(birthDateStr)) {
    if (gender === 'mare') return 'Жеребёнок ♀';
    if (gender === 'gelding') return 'Жеребёнок';
    return 'Жеребёнок ♂';
  }
  return gender === 'stallion' ? 'Жеребец' : gender === 'mare' ? 'Кобыла' : 'Мерин';
}

export interface CategoryCounts {
  foals: number;   // Жеребята (Құлын + Жабағы, до 1 года)
  tai: number;     // Тай (1–2 года)
  baital: number;  // Байтал (кобылки 2–3 года)
  kunan: number;   // Құнан (жеребчики 2–3 года)
  donen: number;   // Дөнен (3–4 года)
  adults: number;  // Взрослые (Бие/Айғыр/Ат, 4+)
}

/** Подсчёт поголовья по традиционным возрастным категориям. */
export function getCategoryBreakdown(horses: Horse[]): CategoryCounts {
  const counts: CategoryCounts = { foals: 0, tai: 0, baital: 0, kunan: 0, donen: 0, adults: 0 };
  for (const h of horses) {
    const name = getKazakhCategory(h.birthDate, h.gender).name;
    if (name.startsWith('Құлын') || name.startsWith('Жабағы')) counts.foals++;
    else if (name.startsWith('Тай')) counts.tai++;
    else if (name.startsWith('Байтал')) counts.baital++;
    else if (name.startsWith('Құнан')) counts.kunan++;
    else if (name.startsWith('Дөнен')) counts.donen++;
    else counts.adults++;
  }
  return counts;
}

/**
 * Calculates the traditional Kazakh life-stage category of a horse based on birthdate and gender.
 */
export function getKazakhCategory(birthDateStr: string, gender: HorseGender): KazakhCategory {
  if (!birthDateStr) {
    return { name: 'Жылқы', description: 'Лошадь', color: 'bg-slate-100 text-slate-800 border-slate-200' };
  }

  const birth = new Date(birthDateStr);
  const today = new Date();

  // Calculate age in exact years and months
  let ageYears = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    ageYears--;
  }

  const ageMonths = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();

  if (ageMonths < 6) {
    return {
      name: 'Құлын (Кулын)',
      description: 'Жеребенок-сосун (до 6 мес.)',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-100'
    };
  } else if (ageMonths < 12) {
    return {
      name: 'Жабағы (Жабагы)',
      description: 'Жеребенок-отъемыш (6-12 мес.)',
      color: 'bg-purple-50 text-purple-800 border-purple-100'
    };
  } else if (ageYears < 2) {
    return {
      name: 'Тай',
      description: 'Годовик (1-2 года)',
      color: 'bg-amber-50 text-amber-800 border-amber-100'
    };
  } else if (ageYears < 3) {
    if (gender === 'mare') {
      return {
        name: 'Байтал',
        description: 'Молодая кобылка (2-3 года)',
        color: 'bg-rose-50 text-rose-800 border-rose-100'
      };
    } else {
      return {
        name: 'Құнан (Кунан)',
        description: 'Молодой жеребчик (2-3 года)',
        color: 'bg-sky-50 text-sky-800 border-sky-100'
      };
    }
  } else if (ageYears < 4) {
    if (gender === 'mare') {
      return {
        name: 'Дөнен бие',
        description: 'Кобыла-трехлетка (3-4 года)',
        color: 'bg-teal-50 text-teal-800 border-teal-100'
      };
    } else {
      return {
        name: 'Дөнен (Донен)',
        description: 'Жеребец-трехлетка (3-4 года)',
        color: 'bg-blue-50 text-blue-800 border-blue-100'
      };
    }
  } else {
    // 4+ years (Adult)
    if (gender === 'mare') {
      return {
        name: 'Бие',
        description: 'Взрослая кобыла',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-100'
      };
    } else if (gender === 'stallion') {
      return {
        name: 'Айғыр (Айгыр)',
        description: 'Жеребец-производитель',
        color: 'bg-violet-50 text-violet-800 border-violet-100 font-extrabold'
      };
    } else {
      return {
        name: 'Ат (Мерин)',
        description: 'Мерин (рабочий конь)',
        color: 'bg-slate-100 text-slate-800 border-slate-200'
      };
    }
  }
}
