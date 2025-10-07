'use client';

import { ReactNode } from 'react';
import WebChucKClient from '../src/components/WebChuckClient';

export default function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <>
      <WebChucKClient /> {/* Top-level WebChucK */}
      {children}
    </>
  );
}