'use client';

import { useEffect } from 'react';

export default function DevtoolsHider() {
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-hide-next-devtools', 'true');
    style.innerHTML = `
      /* Hide Next.js DevTools indicator/badge in dev */
      #devtools-indicator,
      .nextjs-toast,
      [data-next-badge-root] { display: none !important; }
    `;
    document.head.appendChild(style);
    return () => { try { document.head.removeChild(style); } catch {} };
  }, []);
  return null;
}
