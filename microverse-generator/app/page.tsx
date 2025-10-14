// app/page.tsx
import React from 'react';
import BabylonCanvas from '../src/components/BabylonCanvas';
import ChuckSetup from '../src/components/ChuckSetup';
import PhilosopherGuide from '../src/components/PhilosopherGuide';
import AskPanel from '../src/components/AskPanel';

export default function Page() {
  return <>
    <BabylonCanvas />
    <ChuckSetup />
    <PhilosopherGuide />
    <AskPanel />
  </>;
}