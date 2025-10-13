// app/page.tsx
import React from 'react';
import BabylonCanvas from '../src/components/BabylonCanvas';
import ChuckSetup from '../src/components/ChuckSetup';

export default function Page() {
  return <>
    <BabylonCanvas />
    <ChuckSetup />
  </>;
}