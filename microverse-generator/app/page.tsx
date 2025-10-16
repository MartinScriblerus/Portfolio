// app/page.tsx
import React from 'react';
import { BabylonCanvas, ChuckSetup, PhilosopherGuide, IntentDebugPanel } from '../src/components';
import DevtoolsHider from '../src/components/DevtoolsHider';
import DevLogger from '../src/components/DevLogger';

export default function Page() {
  return <>
    <BabylonCanvas />
    <ChuckSetup />
    <PhilosopherGuide />
    {process.env.NODE_ENV === 'development' && <DevtoolsHider />}
    {process.env.NODE_ENV === 'development' && <DevLogger />}
    {process.env.NODE_ENV === 'development' && <IntentDebugPanel />}
  </>;
}