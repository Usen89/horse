/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vaccination } from '../types';

export type EffectiveVaccinationStatus = 'completed' | 'overdue' | 'planned';

/**
 * Единый источник истины для статуса вакцинации.
 *
 * Сохранённый статус ('planned') автоматически становится 'overdue', если срок
 * ревакцинации (nextDueDate) уже прошёл. Проведённые ('completed') записи и явно
 * помеченные 'overdue' сохраняют свой статус. Это устраняет расхождение между
 * счётчиками на главной панели и отображением в календаре вакцинации.
 */
export function getEffectiveVaccinationStatus(v: Vaccination): EffectiveVaccinationStatus {
  if (v.status === 'completed') return 'completed';
  if (v.status === 'overdue') return 'overdue';

  // status === 'planned' — проверяем срок ревакцинации по дате
  const due = new Date(v.nextDueDate);
  if (isNaN(due.getTime())) return 'planned';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due.getTime() < today.getTime() ? 'overdue' : 'planned';
}

/** Является ли запись просроченной с учётом даты. */
export function isVaccinationOverdue(v: Vaccination): boolean {
  return getEffectiveVaccinationStatus(v) === 'overdue';
}
