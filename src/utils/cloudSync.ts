/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Облачная синхронизация с Supabase.
 *
 * Приложение остаётся офлайн-первым (все данные в localStorage), а Supabase
 * используется как облачная база: «Отправить в облако» выгружает полное
 * состояние хозяйства, «Загрузить из облака» восстанавливает его на любом
 * устройстве. Подключение (URL + anon key) пользователь вводит один раз в
 * настройках — ничего не «зашито» в код и не требует пересборки.
 *
 * Схема БД: supabase/schema.sql (в корне репозитория).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const CFG_URL_KEY = 'supabase_farm_url';
const CFG_ANON_KEY = 'supabase_farm_anon_key';

/** Соответствие: ключ localStorage → таблица Supabase (+ поле id). */
const SYNC_MAP: { storageKey: string; table: string; idField: string; label: string }[] = [
  { storageKey: 'horses_farm_data', table: 'horses', idField: 'id', label: 'Лошади' },
  { storageKey: 'koseks_farm_data', table: 'koseks', idField: 'id', label: 'Косяки' },
  { storageKey: 'vaccinations_farm_data', table: 'vaccinations', idField: 'id', label: 'Вакцинации' },
  { storageKey: 'fattenings_farm_data', table: 'fattening_records', idField: 'id', label: 'Откорм' },
  { storageKey: 'culls_farm_data', table: 'cull_records', idField: 'id', label: 'Забой' },
  { storageKey: 'farm_administrators', table: 'administrators', idField: 'login', label: 'Администраторы' },
];

export interface CloudConfig {
  url: string;
  anonKey: string;
}

export function getCloudConfig(): CloudConfig {
  return {
    url: localStorage.getItem(CFG_URL_KEY) || '',
    anonKey: localStorage.getItem(CFG_ANON_KEY) || '',
  };
}

export function saveCloudConfig(cfg: CloudConfig): void {
  localStorage.setItem(CFG_URL_KEY, cfg.url.trim());
  localStorage.setItem(CFG_ANON_KEY, cfg.anonKey.trim());
}

export function isCloudConfigured(): boolean {
  const { url, anonKey } = getCloudConfig();
  return url.startsWith('https://') && anonKey.length > 20;
}

function getClient(): SupabaseClient | { error: string } {
  const { url, anonKey } = getCloudConfig();
  if (!url.startsWith('https://')) {
    return { error: 'Укажите Project URL (начинается с https://…supabase.co).' };
  }
  if (anonKey.length < 20) {
    return { error: 'Укажите anon key из раздела Settings → API вашего проекта.' };
  }
  try {
    return createClient(url, anonKey);
  } catch {
    return { error: 'Не удалось создать подключение — проверьте URL и ключ.' };
  }
}

export interface SyncResult {
  success: boolean;
  message: string;
  details?: string[];
}

/** Выгружает все данные хозяйства из localStorage в Supabase (полная замена). */
export async function pushAllToCloud(): Promise<SyncResult> {
  const clientOrError = getClient();
  if ('error' in clientOrError) return { success: false, message: clientOrError.error };
  const supabase = clientOrError;

  const details: string[] = [];
  try {
    for (const { storageKey, table, idField, label } of SYNC_MAP) {
      const raw = localStorage.getItem(storageKey);
      const items: any[] = raw ? JSON.parse(raw) : [];

      // Полная замена: чистим таблицу, затем вставляем актуальные записи.
      const del = await supabase.from(table).delete().gte('id', '');
      if (del.error) throw new Error(`${label}: ${del.error.message}`);

      if (items.length > 0) {
        const rows = items
          .filter(it => it && it[idField])
          .map(it => ({ id: String(it[idField]), data: it }));
        const ins = await supabase.from(table).insert(rows);
        if (ins.error) throw new Error(`${label}: ${ins.error.message}`);
        details.push(`${label}: ${rows.length}`);
      } else {
        details.push(`${label}: 0`);
      }
    }
    return {
      success: true,
      message: 'Данные отправлены в облако.',
      details,
    };
  } catch (e: any) {
    return {
      success: false,
      message: `Ошибка выгрузки — ${e?.message || 'проверьте подключение и схему БД (supabase/schema.sql)'}`,
    };
  }
}

/**
 * Загружает все данные хозяйства из Supabase в localStorage (полная замена
 * локальных данных). После успеха вызывающий код должен перезагрузить страницу.
 */
export async function pullAllFromCloud(): Promise<SyncResult> {
  const clientOrError = getClient();
  if ('error' in clientOrError) return { success: false, message: clientOrError.error };
  const supabase = clientOrError;

  const details: string[] = [];
  try {
    const pulled: { storageKey: string; items: any[] }[] = [];

    for (const { storageKey, table, label } of SYNC_MAP) {
      const res = await supabase.from(table).select('data');
      if (res.error) throw new Error(`${label}: ${res.error.message}`);
      const items = (res.data || []).map((r: any) => r.data);
      pulled.push({ storageKey, items });
      details.push(`${label}: ${items.length}`);
    }

    const total = pulled.reduce((s, p) => s + p.items.length, 0);
    if (total === 0) {
      return {
        success: false,
        message: 'В облаке пока нет данных. Сначала выполните «Отправить в облако».',
      };
    }

    // Записываем только после того, как ВСЕ таблицы прочитаны успешно.
    for (const { storageKey, items } of pulled) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }

    return {
      success: true,
      message: 'Данные загружены из облака. Приложение перезагрузится…',
      details,
    };
  } catch (e: any) {
    return {
      success: false,
      message: `Ошибка загрузки — ${e?.message || 'проверьте подключение и схему БД'}`,
    };
  }
}
