// app/page.tsx
import React from 'react';
import { 
  BabylonCanvas, 
  IntentDebugPanel, 
} from '../src/components';

// import IntroDetails from '../src/components/IntroDetails';
// import DevtoolsHider from '../src/components/DevtoolsHider';
// import DevLogger from '../src/components/DevLogger';
import ClientWrapper from '../src/components/ClientWrapper';
// import OldParentMonolith from '../src/components/OldParentMonolith/OldParentMonolith';

export default function Page() {
  return <>
    <BabylonCanvas />
    {/* <IntroDetails/> */}
    <ClientWrapper />
    {/* {process.env.NODE_ENV === 'development' && <DevtoolsHider />}
    {process.env.NODE_ENV === 'development' && <DevLogger />}
    {process.env.NODE_ENV === 'development' && <IntentDebugPanel />} */}
  </>;
}