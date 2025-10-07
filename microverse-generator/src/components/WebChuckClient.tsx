'use client';

import { useEffect } from 'react';

export default function WebChucKClient() {
  useEffect(() => {
    // Dynamic import ensures this only runs in the browser
    import('webchuck').then((mod) => {
      const Chuck = mod.Chuck;
      console.log('WebChucK loaded', Chuck);
    });
  }, []);

  return null; // no DOM output needed
}