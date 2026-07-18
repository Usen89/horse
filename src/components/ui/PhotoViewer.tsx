/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { X } from 'lucide-react';

/**
 * Полноэкранный просмотр фотографии (лайтбокс). Открывается по клику/тапу на
 * фото в карточке — в маленьких карточках изображение плохо видно. Закрытие:
 * клик по фону, крестик или Esc.
 */
export default function PhotoViewer({
  src,
  alt = '',
  onClose,
}: {
  src: string | null;
  alt?: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!src} onClose={onClose} className="relative z-[60]">
      <DialogBackdrop className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm animate-fadeIn" />
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        {src && (
          <DialogPanel className="animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <img
              src={src}
              alt={alt}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
          </DialogPanel>
        )}
      </div>
    </Dialog>
  );
}
