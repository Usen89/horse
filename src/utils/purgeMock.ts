/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Разовая (при каждой загрузке) точечная очистка демонстрационных записей,
 * которые могли осесть в localStorage браузера до перехода на «чистый лист».
 *
 * Удаляются ТОЛЬКО записи с известными демо-идентификаторами — данные,
 * добавленные пользователем (id вида `h-<время>-<код>`), не затрагиваются.
 */

// Демо-лошади: id вида h-stallion-1, h-mare-3, h-foal-kulan, h-fattening-2, h-archive-1…
const MOCK_HORSE_ID = /^h-(stallion|mare|young|foal|fattening|archive)-/;

const MOCK_KOSEK_IDS = new Set(['k-1', 'k-2', 'k-3']);
const MOCK_VACCINE_IDS = new Set(['v-1', 'v-2', 'v-3', 'v-4', 'v-5', 'v-foal-kulan-1', 'v-foal-aisapy-1']);
const MOCK_FATTENING_IDS = new Set(['fr-1', 'fr-2']);
const MOCK_CULL_IDS = new Set(['cr-1', 'cr-2']);
const MOCK_HISTORY_IDS = new Set(['e-1', 'e-2', 'e-3', 'e-4', 'e-5']);
const MOCK_ADMIN_LOGINS = new Set(['yerzhan', 'admin', 'ahmetov']);

function filterKey(key: string, keep: (item: any) => boolean): void {
  const raw = localStorage.getItem(key);
  if (!raw) return;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    const cleaned = arr.filter(keep);
    if (cleaned.length !== arr.length) {
      localStorage.setItem(key, JSON.stringify(cleaned));
    }
  } catch {
    // повреждённое значение — не трогаем
  }
}

/** Удаляет известные демо-записи из локального хранилища. */
export function purgeMockData(): void {
  filterKey('horses_farm_data', (h) => !(h && typeof h.id === 'string' && MOCK_HORSE_ID.test(h.id)));
  filterKey('koseks_farm_data', (k) => !(k && MOCK_KOSEK_IDS.has(k.id)));
  filterKey(
    'vaccinations_farm_data',
    (v) => !(v && (MOCK_VACCINE_IDS.has(v.id) || (typeof v.horseId === 'string' && MOCK_HORSE_ID.test(v.horseId))))
  );
  filterKey(
    'fattenings_farm_data',
    (f) => !(f && (MOCK_FATTENING_IDS.has(f.id) || (typeof f.horseId === 'string' && MOCK_HORSE_ID.test(f.horseId))))
  );
  filterKey('culls_farm_data', (c) => !(c && MOCK_CULL_IDS.has(c.id)));
  filterKey('farm_history_events', (e) => !(e && MOCK_HISTORY_IDS.has(e.id)));

  // Устаревший локальный список администраторов (заменён авторизацией)
  filterKey('farm_administrators', (a) => !(a && MOCK_ADMIN_LOGINS.has(a.login)));
  const activeRaw = localStorage.getItem('active_administrator');
  if (activeRaw) {
    try {
      const a = JSON.parse(activeRaw);
      if (a && MOCK_ADMIN_LOGINS.has(a.login)) localStorage.removeItem('active_administrator');
    } catch {
      /* ignore */
    }
  }
}
