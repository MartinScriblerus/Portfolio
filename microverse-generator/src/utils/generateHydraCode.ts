import { HydraOperationChain } from '../store/useHydraControlsStore';

/**
 * Converts Hydra operation chains to Hydra code string
 */
export function generateHydraCode(chains: HydraOperationChain[]): string {
  if (chains.length === 0) {
    return '// No operations configured\nosc().out()';
  }

  // Filter to only enabled chains
  const enabledChains = chains.filter(c => c.enabled);
  if (enabledChains.length === 0) {
    return '// No enabled operations\nosc().out()';
  }

  // Build root chains (no parent)
  const rootChains = enabledChains
    .filter(c => !c.parentId)
    .sort((a, b) => a.order - b.order);

  if (rootChains.length === 0) {
    return '// No root operations\nosc().out()';
  }

  // Build code for each root chain
  const codeLines: string[] = [];
  
  rootChains.forEach((rootChain, index) => {
    const chainCode = buildChainCode(rootChain, enabledChains);
    if (chainCode) {
      // For the last root chain, add .out()
      if (index === rootChains.length - 1) {
        codeLines.push(`${chainCode}.out()`);
      } else {
        // For other chains, assign to output buffers (o1, o2, etc.)
        const outputVar = `o${index + 1}`;
        codeLines.push(`${outputVar} = ${chainCode}`);
      }
    }
  });

  return codeLines.join('\n') || 'osc().out()';
}

/**
 * Recursively builds Hydra code for a chain and its children
 */
function buildChainCode(
  chain: HydraOperationChain,
  allChains: HydraOperationChain[],
  visited: Set<string> = new Set()
): string {
  if (visited.has(chain.id)) {
    return ''; // Prevent circular references
  }
  visited.add(chain.id);

  // Build the base operation with parameters
  let code = buildOperationCode(chain);

  // Build nested children (transforms/compositors that nest under this chain)
  const children = allChains
    .filter(c => c.parentId === chain.id && c.enabled)
    .sort((a, b) => a.order - b.order);

  for (const child of children) {
    if (child.type === 'compositor') {
      // Compositors need special handling - they take an inner source as argument
      const compositorOp = child.operation as string;
      
      // Build inner source if specified
      let innerSourceCode = '';
      if (child.innerSourceId) {
        const innerSource = allChains.find(c => c.id === child.innerSourceId && c.enabled);
        if (innerSource) {
          innerSourceCode = buildChainCode(innerSource, allChains, new Set(visited));
        }
      }
      
      // If no inner source specified, use default (noise)
      if (!innerSourceCode) {
        innerSourceCode = 'noise()';
      }
      
      // Build compositor arguments
      const compositorArgs = buildCompositorArgs(child, innerSourceCode);
      const compositorCall = `${compositorOp}(${compositorArgs})`;
      
      // Chain the compositor onto the base
      code = `${code}.${compositorCall}`;
    } else {
      // Transforms chain normally
      const childCode = buildChainCode(child, allChains, new Set(visited));
      if (childCode) {
        code = `${code}.${childCode}`;
      }
    }
  }

  return code;
}

/**
 * Builds the operation code with parameters
 */
function buildOperationCode(chain: HydraOperationChain): string {
  const op = chain.operation;
  const params = chain.params || {};

  // Build parameter arguments
  const args: string[] = [];

  switch (op) {
    case 'osc':
      if (params.freq) args.push(formatParam(params.freq.value));
      if (params.sync !== undefined) args.push(formatParam(params.sync.value));
      if (params.offset !== undefined) args.push(formatParam(params.offset.value));
      break;
    case 'noise':
      if (params.scale !== undefined) args.push(formatParam(params.scale.value));
      break;
    case 'shape':
      if (params.sides !== undefined) args.push(formatParam(params.sides.value));
      if (params.radius !== undefined) args.push(formatParam(params.radius.value));
      break;
    case 'gradient':
      if (params.speed !== undefined) args.push(formatParam(params.speed.value));
      break;
    case 'src':
      // src() takes no parameters - it references s0 (video buffer)
      break;
    case 'repeat':
      if (params.x !== undefined) args.push(formatParam(params.x.value));
      if (params.y !== undefined) args.push(formatParam(params.y.value));
      break;
    case 'kaleid':
      if (params.sides !== undefined) args.push(formatParam(params.sides.value));
      if (params.segments !== undefined) args.push(formatParam(params.segments.value));
      break;
    case 'pixelate':
      if (params.amount !== undefined) args.push(formatParam(params.amount.value));
      break;
    case 'rotate':
      if (params.angle !== undefined) args.push(formatParam(params.angle.value));
      if (params.speed !== undefined && params.speed.value !== 0) {
        args.push(formatParam(params.speed.value));
      }
      break;
    case 'scale':
      if (params.amount !== undefined) args.push(formatParam(params.amount.value));
      break;
    case 'scrollX':
      if (params.amount !== undefined) args.push(formatParam(params.amount.value));
      if (params.speed !== undefined && params.speed.value !== 0) {
        args.push(formatParam(params.speed.value));
      }
      break;
    case 'scrollY':
      if (params.amount !== undefined) args.push(formatParam(params.amount.value));
      if (params.speed !== undefined && params.speed.value !== 0) {
        args.push(formatParam(params.speed.value));
      }
      break;
    case 'saturate':
    case 'contrast':
    case 'brightness':
    case 'hue':
    case 'invert':
    case 'colorama':
    case 'modulate':
    case 'modulateHue':
    case 'modulateScale':
    case 'modulateRotate':
    case 'blend':
    case 'add':
    case 'mult':
    case 'diff':
    case 'layer':
    case 'mask':
      if (params.amount !== undefined) args.push(formatParam(params.amount.value));
      break;
    case 'posterize':
      if (params.levels !== undefined) args.push(formatParam(params.levels.value));
      break;
    case 'luma':
      if (params.threshold !== undefined) args.push(formatParam(params.threshold.value));
      break;
  }

  // Build the operation call
  if (args.length > 0) {
    return `${op}(${args.join(', ')})`;
  } else {
    return `${op}()`;
  }
}

/**
 * Builds compositor arguments (includes inner source)
 */
function buildCompositorArgs(chain: HydraOperationChain, innerSourceCode: string): string {
  const params = chain.params || {};
  const args: string[] = [];

  // Add inner source as first argument
  args.push(innerSourceCode);

  // Add amount parameter if present and non-zero
  if (params.amount !== undefined && params.amount.value !== 0) {
    args.push(formatParam(params.amount.value));
  }

  return args.join(', ');
}

/**
 * Formats a parameter value for code output
 */
function formatParam(value: number): string {
  // Use fixed decimal places for readability, but remove trailing zeros
  const formatted = value.toFixed(3).replace(/\.?0+$/, '');
  return formatted;
}
