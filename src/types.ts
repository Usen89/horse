/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HorseGender = 'stallion' | 'mare' | 'gelding'; // жеребец, кобыла, мерин

export type HorseStatus = 'active' | 'fattening' | 'slaughtered' | 'sold';

export interface Horse {
  id: string;
  name: string;
  coat: string;        // Масть (например: Гнедая, Вороная, Серая, Рыжая, Саврасая)
  birthDate: string;   // Дата рождения (YYYY-MM-DD)
  gender: HorseGender;
  sireId: string | null; // Отец
  sireName?: string;     // Кэшированное имя отца для удобства
  damId: string | null;  // Мать
  damName?: string;      // Кэшированное имя матери
  owner: string;       // Владелец
  status: HorseStatus; // Статус
  imageUrl?: string;   // Фото/Иллюстрация
  kosekId: string | null; // Косяк (группа)
  isPregnant?: boolean;   // Беременность (только для кобыл)
  pregnancyDate?: string; // Дата спаривания / начала беременности
  pregnancyDueDate?: string; // Ожидаемая дата жеребности
  lastFoalingDate?: string; // Дата последних родов (выжеребки)
  notes?: string;
}

export interface Kosek {
  id: string;
  name: string;        // Название косяка (например, "Косяк Кокжала", "Западное пастбище")
  stallionId: string;  // Жеребец-вожак (stallion)
  description?: string;
  location?: string;   // Локация/пастбище
}

export interface Vaccination {
  id: string;
  horseId: string;
  horseName: string;
  disease: string;     // Заболевание (Сибирская язва, Сап, Грипп, Мыт, Трихофития)
  date: string;        // Дата вакцинации
  nextDueDate: string; // Срок следующей вакцинации
  veterinarian: string; // Ветеринар
  status: 'completed' | 'overdue' | 'planned';
}

export interface FatteningRecord {
  id: string;
  horseId: string;
  horseName: string;
  startDate: string;   // Дата постановки на откорм
  durationDays: number; // Срок откорма в днях
  endDate: string;     // Планируемая дата окончания
  startWeight?: number; // Начальный вес (кг)
  currentWeight?: number; // Текущий вес
  notes?: string;
}

export interface CullRecord {
  id: string;
  horseId: string;
  horseName: string;
  coat: string;
  gender: HorseGender;
  cullDate: string;    // Дата забоя
  weight: number;      // Вес (кг)
  meatYield?: number;  // Выход мяса (кг/%)
  reason: string;      // Причина забоя
  revenue?: number;    // Выручка (если применимо)
}
