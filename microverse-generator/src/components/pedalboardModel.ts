// pedalboardModel.ts
// Pure builder for a linear audio/effect chain diagram using explicit link creation.

import {
  DefaultLinkModel,
  DefaultNodeModel,
  DiagramModel
} from '@projectstorm/react-diagrams';

export type ChainId = string;

export interface PedalboardBuildResult {
  model: DiagramModel;
  nodes: {
    source: DefaultNodeModel;
    outlet: DefaultNodeModel;
    effects: DefaultNodeModel[];
  };
}

/**
 * Safely create a link between two ports (if both exist).
 */
function makeLink(
  from: ReturnType<DefaultNodeModel['getPort']> | null | undefined,
  to: ReturnType<DefaultNodeModel['getPort']> | null | undefined
): DefaultLinkModel | null {
  if (!from || !to) return null;
  const link = new DefaultLinkModel();
  link.setSourcePort(from);
  link.setTargetPort(to);
  return link;
}

/**
 * Build a diagram model:
 * source -> effect0 -> effect1 -> ... -> effectN -> outlet
 */
export function buildPedalboardModel(
  chain: readonly ChainId[],
  sourceId: string
): PedalboardBuildResult {
  const model = new DiagramModel();

  // Source
  const sourceNode = new DefaultNodeModel({
    name: `${sourceId} source`,
    color: '#147d80'
  });
  sourceNode.setPosition(32, 220);

  // Outlet
  const outletNode = new DefaultNodeModel({
    name: `${sourceId} outlet`,
    color: '#147d80'
  });
  outletNode.setPosition(720, 220);



  // Effects
  const effects: DefaultNodeModel[] = chain && chain.map((fx, idx) => {
    const node = new DefaultNodeModel({
      name: `${fx}_${sourceId}`,
      color: '#c49a2c'
    });
    const x = 160 + idx * 120;
    const band = (idx % 3) - 1; // -1,0,1 vertical band
    const y = 140 + band * 60;
    node.setPosition(x, y);
    node.addInPort('In');
    node.addOutPort('Out');
    return node;
  }) || [];

  // Add all nodes first
  model.addAll(sourceNode, outletNode, ...effects);

  // Ports we need
  const sourceOut = sourceNode.addOutPort('Out');

  if (effects.length === 0) {
    // Direct connection: source -> outlet
    const outletIn = outletNode.addInPort('In');
    const link = makeLink(sourceOut, outletIn);
    if (link) model.addLink(link);
    return { model, nodes: { source: sourceNode, outlet: outletNode, effects } };
  }

  // source -> first effect
  const firstIn = effects[0].getPort('In');
  const initialLink = makeLink(sourceOut, firstIn);
  if (initialLink) model.addLink(initialLink);

  // Chain each effect to next, last to outlet
  effects.forEach((node, idx) => {
    const outPort = node.getPort('Out');
    if (!outPort) return;
    const isLast = idx === effects.length - 1;
    if (!isLast) {
      const nextIn = effects[idx + 1].getPort('In');
      const link = makeLink(outPort, nextIn);
      if (link) model.addLink(link);
    } else {
      const outletIn = outletNode.addInPort('In');
      const link = makeLink(outPort, outletIn);
      if (link) model.addLink(link);
    }
  });

  return {
    model,
    nodes: { source: sourceNode, outlet: outletNode, effects }
  };
}