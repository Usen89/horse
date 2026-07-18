/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Ловит ошибки рендера, чтобы вместо «белого экрана» показать понятный
 * экран восстановления. Данные при этом не теряются (они в localStorage).
 */
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Ошибка приложения:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500 text-2xl">
            ⚠️
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-base">Что-то пошло не так</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Произошла ошибка отображения. Ваши данные сохранены. Попробуйте перезагрузить страницу.
            </p>
            {this.state.message && (
              <p className="text-[10px] text-slate-400 mt-2 font-mono break-words bg-slate-50 rounded-lg p-2">
                {this.state.message}
              </p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl transition-all cursor-pointer active:scale-98"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }
}
