/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Резервное копирование и восстановление данных хозяйства.
 *
 * Все данные приложения хранятся в localStorage браузера. Эти функции позволяют
 * выгрузить полную копию в JSON-файл и восстановить её на этом же или другом
 * устройстве — на случай очистки браузера, переустановки или переноса.
 */

/** Ключи localStorage, в которых хранятся данные хозяйства. */
export const FARM_STORAGE_KEYS = [
  'horses_farm_data',
  'koseks_farm_data',
  'vaccinations_farm_data',
  'fattenings_farm_data',
  'culls_farm_data',
  'farm_administrators',
  'active_administrator',
] as const;

const BACKUP_APP_ID = 'tabun-reestr';
const BACKUP_VERSION = 1;

export interface FarmBackup {
  app: string;
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

/** Собирает все данные хозяйства в один объект резервной копии. */
export function collectFarmData(): FarmBackup {
  const data: Record<string, unknown> = {};
  for (const key of FARM_STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        // На случай повреждённого значения — сохраняем как строку.
        data[key] = raw;
      }
    }
  }
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/** Выгружает резервную копию в JSON-файл (скачивание в браузере). */
export function exportFarmData(): void {
  const backup = collectFarmData();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const stamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const link = document.createElement('a');
  link.href = url;
  link.download = `tabun-reestr-backup-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Освобождаем object URL чуть позже, чтобы скачивание успело стартовать.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ImportResult {
  success: boolean;
  message: string;
  restoredKeys?: number;
}

/**
 * Восстанавливает данные хозяйства из JSON-файла резервной копии.
 * Возвращает результат; при успехе вызывающий код должен перезагрузить
 * страницу, чтобы приложение считало восстановленные данные.
 */
export function importFarmData(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = () =>
      resolve({ success: false, message: 'Не удалось прочитать файл.' });

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));

        if (!parsed || typeof parsed !== 'object' || typeof parsed.data !== 'object') {
          resolve({
            success: false,
            message: 'Файл не является корректной резервной копией Табун-Реестра.',
          });
          return;
        }

        if (parsed.app && parsed.app !== BACKUP_APP_ID) {
          resolve({
            success: false,
            message: 'Этот файл создан другим приложением.',
          });
          return;
        }

        // Восстанавливаем только известные ключи хозяйства.
        let restored = 0;
        for (const key of FARM_STORAGE_KEYS) {
          if (key in parsed.data) {
            localStorage.setItem(key, JSON.stringify(parsed.data[key]));
            restored++;
          }
        }

        if (restored === 0) {
          resolve({
            success: false,
            message: 'В файле не найдено данных хозяйства для восстановления.',
          });
          return;
        }

        resolve({
          success: true,
          message: `Восстановлено разделов: ${restored}. Приложение перезагрузится…`,
          restoredKeys: restored,
        });
      } catch {
        resolve({
          success: false,
          message: 'Файл повреждён или не является корректным JSON.',
        });
      }
    };

    reader.readAsText(file);
  });
}
