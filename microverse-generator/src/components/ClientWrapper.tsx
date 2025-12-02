"use client";

import dynamic from 'next/dynamic';

const ChuckSetup = dynamic(() => import('./ChuckSetup'), { ssr: false });

const ClientWrapper = ({}) => {
  return <ChuckSetup />;
};
export default ClientWrapper;