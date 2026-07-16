/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Фирменный логотип «Табун-Реестр»: подкова на изумрудном градиенте.
 * Векторный (SVG) — чёткий на любом размере и плотности экрана.
 * Тот же дизайн используется как favicon в index.html.
 */
export default function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Логотип Табун-Реестр"
    >
      <defs>
        {/* userSpaceOnUse — один градиент на все фигуры, «отверстия» подковы
            заливаются тем же градиентом и выглядят прозрачными */}
        <linearGradient
          id="tr-logo-bg"
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Фон — скруглённый квадрат с лёгкой светлой окантовкой */}
      <rect x="1" y="1" width="46" height="46" rx="12" fill="url(#tr-logo-bg)" />
      <rect
        x="1.5"
        y="1.5"
        width="45"
        height="45"
        rx="11.5"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.22"
      />

      {/* Подкова: внешняя дуга R14, внутренняя R8, скруглённые концы */}
      <path
        d="M 10 36
           L 10 22
           A 14 14 0 0 1 38 22
           L 38 36
           A 3 3 0 0 1 32 36
           L 32 22
           A 8 8 0 0 0 16 22
           L 16 36
           A 3 3 0 0 1 10 36
           Z"
        fill="#ffffff"
      />

      {/* Гвоздевые отверстия — залиты тем же градиентом (эффект сквозных) */}
      <g fill="url(#tr-logo-bg)">
        <circle cx="24" cy="11" r="1.6" />
        <circle cx="16.2" cy="14.2" r="1.6" />
        <circle cx="31.8" cy="14.2" r="1.6" />
        <circle cx="13" cy="27" r="1.6" />
        <circle cx="35" cy="27" r="1.6" />
        <circle cx="13" cy="33" r="1.6" />
        <circle cx="35" cy="33" r="1.6" />
      </g>
    </svg>
  );
}
