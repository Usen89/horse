/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getCloudConfig } from './cloudSync';

/**
 * Единый клиент Supabase с сохранением сессии (для авторизации).
 *
 * В отличие от разовых операций синхронизации, здесь нужен один постоянный
 * клиент, который хранит сессию пользователя в localStorage и сам обновляет
 * токен. Это позволяет оставаться в системе между запусками и работать офлайн
 * с уже полученной сессией (важно для использования в поле без связи).
 */
let client: SupabaseClient | null = null;
let clientSignature = '';

export function getSupabase(): SupabaseClient {
  const { url, anonKey } = getCloudConfig();
  const signature = `${url}|${anonKey}`;
  if (!client || clientSignature !== signature) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'tabun_reestr_auth',
      },
    });
    clientSignature = signature;
  }
  return client;
}
