/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResult {
  ok: boolean;
  needConfirm?: boolean;
  message: string;
}

/** Перевод типовых ошибок Supabase Auth на русский. */
function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Неверный email или пароль.';
  if (m.includes('email not confirmed')) return 'Email не подтверждён. Откройте письмо и перейдите по ссылке.';
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Пользователь с таким email уже зарегистрирован.';
  if (m.includes('password should be at least')) return 'Пароль слишком короткий (минимум 6 символов).';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'Некорректный email.';
  if (m.includes('signups not allowed') || m.includes('signup is disabled'))
    return 'Регистрация отключена в настройках проекта.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Слишком много попыток. Повторите позже.';
  if (m.includes('failed to fetch') || m.includes('networkerror'))
    return 'Нет связи с сервером. Проверьте интернет.';
  return msg;
}

/** Регистрация нового пользователя (email + пароль). Имя и роль хранятся в метаданных. */
export async function signUpUser(
  email: string,
  password: string,
  name: string,
  role: string
): Promise<AuthResult> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim(), role: role.trim() } },
    });
    if (error) return { ok: false, message: translateError(error.message) };

    // Если сессия сразу создана — подтверждение email отключено в проекте.
    if (data.session) {
      return { ok: true, needConfirm: false, message: 'Регистрация успешна! Вход выполнен.' };
    }
    return {
      ok: true,
      needConfirm: true,
      message: 'Мы отправили письмо на ' + email.trim() + '. Подтвердите email по ссылке, затем войдите.',
    };
  } catch (e: any) {
    return { ok: false, message: translateError(e?.message || 'Ошибка регистрации.') };
  }
}

/** Вход по email и паролю. */
export async function signInUser(email: string, password: string): Promise<AuthResult> {
  try {
    const sb = getSupabase();
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, message: translateError(error.message) };
    return { ok: true, message: 'Вход выполнен.' };
  } catch (e: any) {
    return { ok: false, message: translateError(e?.message || 'Ошибка входа.') };
  }
}

/** Отправка письма для сброса пароля. */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const sb = getSupabase();
    const { error } = await sb.auth.resetPasswordForEmail(email.trim());
    if (error) return { ok: false, message: translateError(error.message) };
    return { ok: true, message: 'Письмо для сброса пароля отправлено на ' + email.trim() + '.' };
  } catch (e: any) {
    return { ok: false, message: translateError(e?.message || 'Ошибка.') };
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
 * Профиль текущего пользователя. Сначала пробуем таблицу public.profiles
 * (если создана), иначе берём данные из метаданных пользователя — так
 * авторизация работает даже без ручной настройки SQL.
 */
export async function getUserProfile(session: Session): Promise<UserProfile> {
  const uid = session.user.id;
  const email = session.user.email || '';
  const md = (session.user.user_metadata || {}) as { name?: string; role?: string };

  try {
    const sb = getSupabase();
    const { data } = await sb.from('profiles').select('name, role, email').eq('id', uid).maybeSingle();
    if (data) {
      return {
        id: uid,
        email: data.email || email,
        name: data.name || md.name || email.split('@')[0],
        role: data.role || md.role || 'Зоотехник',
      };
    }
  } catch {
    // Таблицы profiles может не быть — это нормально, используем метаданные.
  }

  return {
    id: uid,
    email,
    name: md.name || email.split('@')[0] || 'Пользователь',
    role: md.role || 'Зоотехник',
  };
}
