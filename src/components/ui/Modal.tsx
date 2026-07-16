/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';

interface ModalProps {
  /** Открыто ли окно. */
  open: boolean;
  /** Закрытие: клик по фону, клавиша Esc или программно. */
  onClose: () => void;
  /** Классы панели (перенесите сюда стили внутреннего контейнера модалки). */
  panelClassName?: string;
  /** id панели (для совместимости с прежними якорями/тестами). */
  panelId?: string;
  /** Дополнительные классы фона (затемнения). */
  backdropClassName?: string;
  children: React.ReactNode;
}

/**
 * Переиспользуемое модальное окно на основе Headless UI `Dialog`.
 *
 * Даёт из коробки: захват фокуса (focus trap), закрытие по Esc и клику по фону,
 * блокировку прокрутки фона, корректные ARIA-роли и плавные анимации появления/
 * скрытия. Заменяет самодельные оверлеи `fixed inset-0 …` по всему приложению.
 */
export default function Modal({
  open,
  onClose,
  panelClassName = '',
  panelId,
  backdropClassName = '',
  children,
}: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Затемнённый фон */}
      <DialogBackdrop
        transition
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 ease-out data-[closed]:opacity-0 ${backdropClassName}`}
      />

      {/* Центрирующий контейнер с прокруткой при высоком содержимом */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <DialogPanel
          id={panelId}
          transition
          className={`transition duration-200 ease-out data-[closed]:opacity-0 data-[closed]:scale-95 ${panelClassName}`}
        >
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
