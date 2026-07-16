/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HorseGender } from '../types';

export interface KazakhCategory {
  name: string;
  description: string;
  color: string; // Tailwind color classes for badges
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
