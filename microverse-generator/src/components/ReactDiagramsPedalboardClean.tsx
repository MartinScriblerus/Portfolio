'use client';
import React, { useEffect, useRef, useState } from 'react';
import createEngine from '@projectstorm/react-diagrams';
import type { DiagramEngine } from '@projectstorm/react-diagrams';
import { DefaultNodeModel } from '@projectstorm/react-diagrams';
import { CanvasWidget } from '@projectstorm/react-canvas-core';
import { buildPedalboardModel, ChainId } from './pedalboardModel';

type Props = {
  chain: readonly ChainId[];
  sourceId: string;
  onSelectEffect?: (effectNodeName: string) => void;
  height?: number | string;
};

export default function ReactDiagramsPedalboardClean({
  chain,
  sourceId,
  onSelectEffect,
  height = 300
}: Props) {
  const engineRef = useRef<DiagramEngine | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const unsubsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = createEngine();
      setEngineReady(true);
    }
    return () => {
      unsubsRef.current.forEach(fn => fn());
      unsubsRef.current = [];
      engineRef.current = null;
      setEngineReady(false);
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    unsubsRef.current.forEach(fn => fn());
    unsubsRef.current = [];

    const { model } = buildPedalboardModel(chain, sourceId);
    engine.setModel(model);

    if (onSelectEffect) {
      model.getNodes().forEach(node => {
        const handle = node.registerListener({
          selectionChanged: (evt: any) => {
            const isSelected =
              (evt && typeof evt.isSelected === 'boolean' && evt.isSelected) ||
              (typeof (node as any).isSelected === 'function' && (node as any).isSelected());

            if (!isSelected) return;

            let effectName: string;
            if (node instanceof DefaultNodeModel) {
              effectName = String(node.getOptions().name || node.getOptions().id);
            } else {
              effectName = String(node.getOptions().id);
            }

            onSelectEffect(effectName);
          }
        });

        const dereg =
          handle && typeof (handle as any).deregister === 'function'
            ? () => (handle as any).deregister()
            : () => {};
        unsubsRef.current.push(dereg);
      });
    }
  }, [chain, sourceId, onSelectEffect]);

  if (!engineReady || !engineRef.current) {
    return <div style={{ width: '100%', height }} />;
  }

  return (
    <div style={{ width: '100%', height }}>
      <CanvasWidget engine={engineRef.current as any} />
    </div>
  );
}