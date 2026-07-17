/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  username: string;
  email: string; // необязательный контактный email
  name: string;
  role: string;
}

export interface AuthResult {
  ok: boolean;
  needConfirm?: boolean;
  message: string;
}

/**
 * Supabase Auth работает через email, а вход в приложении — по имени
 * пользователя. Поэтому логин детерминированно преобразуется в «служебный»
 * email вида `логин@tabun-reestr.app` (пользователь его не видит). Реальный
 * email — необязательный, хранится в метаданных как контактный.
 *
 * ВАЖНО: для входа по имени пользователя в проекте Supabase должно быть
 * ОТКЛЮЧЕНО подтверждение email (Authentication → Providers → Email →
 * «Confirm email»), иначе служебные адреса нельзя подтвердить.
 */
const SYNTH_DOMAIN = 'tabun-reestr.app';

// Транслитерация кириллицы (рус./каз.) в латиницу для локальной части email
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  ә: 'a', ғ: 'g', қ: 'k', ң: 'n', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', і: 'i',
};

/** Нормализует имя пользователя в безопасную локальную часть email. */
export function normalizeUsername(username: string): string {
  const lower = username.trim().toLowerCase();
  let out = '';
  for (const ch of lower) {
    if (Object.prototype.hasOwnProperty.call(TRANSLIT, ch)) out += TRANSLIT[ch];
    else if (/[a-z0-9._-]/.test(ch)) out += ch;
    else if (/\s/.test(ch)) out += '.';
    // прочие символы пропускаем
  }
  return out.replace(/\.+/g, '.').replace(/^[._-]+|[._-]+$/g, '');
}

/** Служебный email из имени пользователя (пустая строка — если имя недопустимо). */
export function usernameToEmail(username: string): string {
  const local = normalizeUsername(username);
  return local ? `${local}@${SYNTH_DOMAIN}` : '';
}

/** Перевод типовых ошибок Supabase Auth на русский. */
function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Неверное имя пользователя или пароль.';
  if (m.includes('email not confirmed'))
    return 'Вход не активирован. Администратору нужно отключить подтверждение email в настройках Supabase.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Это имя пользователя уже занято.';
  if (m.includes('password should be at least')) return 'Пароль слишком короткий (минимум 6 символов).';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Слишком много попыток подряд. Если включено подтверждение email — отключите его в Supabase и повторите.';
  if (m.includes('invalid') && m.includes('email'))
    return 'Имя пользователя содержит недопустимые символы. Используйте буквы и цифры.';
  if (m.includes('failed to fetch') || m.includes('networkerror'))
    return 'Нет связи с сервером. Проверьте интернет.';
  return msg;
}

/** Регистрация: имя пользователя (логин) + пароль. Имя/роль/контактный email — в метаданных. */
export async function signUpUser(
  username: string,
  password: string,
  name: string,
  role: string,
  contactEmail?: string
): Promise<AuthResult> {
  const email = usernameToEmail(username);
  if (!email) {
    return { ok: false, message: 'Имя пользователя должно содержать буквы или цифры.' };
  }
  try {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          role: role.trim(),
          username: username.trim(),
          contact_email: (contactEmail || '').trim(),
        },
      },
    });
    if (error) return { ok: false, message: translateError(error.message) };

    if (data.session) {
      return { ok: true, needConfirm: false, message: 'Регистрация успешна! Вход выполнен.' };
    }
    // Сессии нет — в проекте включено подтверждение email (для служебных
    // адресов это не сработает). Подсказываем администратору.
    return {
      ok: true,
      needConfirm: true,
      message:
        'Аккаунт создан, но вход требует активации. Администратору: отключите «Confirm email» в Supabase, затем войдите.',
    };
  } catch (e: any) {
    return { ok: false, message: translateError(e?.message || 'Ошибка регистрации.') };
  }
}

/** Вход по имени пользователя и паролю. */
export async function signInUser(username: string, password: string): Promise<AuthResult> {
  const email = usernameToEmail(username);
  if (!email) {
    return { ok: false, message: 'Введите имя пользователя.' };
  }
  try {
    const sb = getSupabase();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: translateError(error.message) };
    return { ok: true, message: 'Вход выполнен.' };
  } catch (e: any) {
    return { ok: false, message: translateError(e?.message || 'Ошибка входа.') };
  }
}

export async function signOutUser(): Promise<void> {
  await getSupabase().auth.signOut();
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

/** Подписка на изменения авторизации (вход/выход/обновление токена). */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

/**
 * Профиль текущего пользователя. Сначала пробуем таблицу public.profiles,
 * иначе берём данные из метаданных — авторизация работает без ручной настройки SQL.
 */
export async function getUserProfile(session: Session): Promise<UserProfile> {
  const uid = session.user.id;
  const authEmail = session.user.email || '';
  const md = (session.user.user_metadata || {}) as {
    name?: string;
    role?: string;
    username?: string;
    contact_email?: string;
  };
  const fallbackUsername = md.username || authEmail.split('@')[0] || 'user';

  try {
    const sb = getSupabase();
    const { data } = await sb
      .from('profiles')
      .select('name, role, username, contact_email')
      .eq('id', uid)
      .maybeSingle();
    if (data) {
      return {
        id: uid,
        username: data.username || fallbackUsername,
        email: data.contact_email || md.contact_email || '',
        name: data.name || md.name || fallbackUsername,
        role: data.role || md.role || 'Зоотехник',
      };
    }
  } catch {
    // profiles может не быть — используем метаданные
  }

  return {
    id: uid,
    username: fallbackUsername,
    email: md.contact_email || '',
    name: md.name || fallbackUsername,
    role: md.role || 'Зоотехник',
  };
}
