'use client';
import { useEffect } from 'react';

export default function ChuckSetup() {
  useEffect(() => {
    import('webchuck').then((mod) => {
      console.log('WebChucK loaded', mod);
    });
  }, []);

  return null;
}