/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Сжимает изображение (data-URL) до разумного размера перед сохранением.
 *
 * Фото с телефона весит несколько МБ; в base64 оно ещё больше и переполняет
 * localStorage (особенно на мобильных браузерах, где лимит ~5 МБ) — из-за чего
 * приложение падало в белый экран при сохранении. Ресайз до maxDim и JPEG-сжатие
 * уменьшают фото до ~50–150 КБ без заметной потери качества для карточки.
 *
 * Возвращает сжатый data-URL, либо исходную строку, если сжать не удалось
 * (например, ссылка на внешний URL — её и так не храним в base64).
 */
export function compressImage(src: string, maxDim = 1024, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    // Сжимаем только загруженные/снятые изображения (data:...), не внешние URL
    if (!src || !src.startsWith('data:image')) {
      resolve(src);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const out = canvas.toDataURL('image/jpeg', quality);
        // Если сжатие вдруг не уменьшило размер — оставляем меньший вариант
        resolve(out.length < src.length ? out : src);
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
