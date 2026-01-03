'use client';
import React, { useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { universalSources } from '../../app/state/refs';
import type { Sources } from '../interfaces/audioTypes';

interface PedalboardVisualizationProps {
    sourceName: keyof Sources;
    width?: number;
    height?: number;
}

interface EffectNode {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
}

export default function PedalboardVisualization({
    sourceName,
    width = 800,
    height = 200
}: PedalboardVisualizationProps) {
    const sourcesRef = universalSources as React.MutableRefObject<Sources | undefined>;

    // Build signal chain from source to mixer
    const signalChain = useMemo(() => {
        if (!sourcesRef.current?.[sourceName]?.effects) return [];

        const chain: EffectNode[] = [];
        const effects = sourcesRef.current[sourceName].effects;

        // Get active effects in order
        Object.entries(effects).forEach(([key, fx]) => {
            if (fx.On) {
                chain.push({
                    id: `${fx.VarName}_${sourceName}`,
                    name: fx.Type || key,
                    type: fx.Type || key,
                    isActive: true
                });
            }
        });

        return chain;
    }, [sourceName, sourcesRef.current]);

    // Source name mapping
    const sourceLabels: Record<keyof Sources, string> = {
        osc1: 'Oscillator',
        stk1: 'STK',
        sampler: 'Sampler',
        audioin: 'Audio Input'
    };

    const sourceLabel = sourceLabels[sourceName] || sourceName;

    // Calculate positions
    const nodeWidth = 100;
    const nodeHeight = 60;
    const spacing = 120;
    const startX = 80;
    const startY = height / 2 - nodeHeight / 2;
    const mixerX = width - 80;
    const mixerY = height / 2 - nodeHeight / 2;

    return (
        <Box
            sx={{
                width: '100%',
                height,
                position: 'relative',
                backgroundColor: 'rgba(26, 28, 32, 0.5)',
                borderRadius: 2,
                p: 2,
                overflow: 'auto'
            }}
        >
            <svg width={width} height={height} style={{ overflow: 'visible' }}>
                {/* Source node */}
                <rect
                    x={startX - nodeWidth / 2}
                    y={startY}
                    width={nodeWidth}
                    height={nodeHeight}
                    rx={4}
                    fill="#147d80"
                    stroke="#00D9FF"
                    strokeWidth={2}
                />
                <text
                    x={startX}
                    y={startY + nodeHeight / 2}
                    textAnchor="middle"
                    fill="#F5F7FA"
                    fontSize="12"
                    fontWeight="600"
                >
                    {sourceLabel}
                </text>

                {/* Effect nodes */}
                {signalChain.map((effect, idx) => {
                    const x = startX + spacing * (idx + 1);
                    const y = startY + (idx % 2 === 0 ? 0 : -20); // Alternate vertical position

                    return (
                        <g key={effect.id}>
                            {/* Connection line */}
                            <line
                                x1={idx === 0 ? startX + nodeWidth / 2 : startX + spacing * idx + nodeWidth / 2}
                                y1={startY + nodeHeight / 2}
                                x2={x - nodeWidth / 2}
                                y2={y + nodeHeight / 2}
                                stroke="#00D9FF"
                                strokeWidth={2}
                                markerEnd="url(#arrowhead)"
                            />
                            {/* Effect node */}
                            <rect
                                x={x - nodeWidth / 2}
                                y={y}
                                width={nodeWidth}
                                height={nodeHeight}
                                rx={4}
                                fill={effect.isActive ? "#c49a2c" : "rgba(196, 154, 44, 0.3)"}
                                stroke={effect.isActive ? "#00D9FF" : "rgba(0, 217, 255, 0.3)"}
                                strokeWidth={effect.isActive ? 2 : 1}
                            />
                            <text
                                x={x}
                                y={y + nodeHeight / 2}
                                textAnchor="middle"
                                fill="#F5F7FA"
                                fontSize="10"
                                fontWeight={effect.isActive ? "600" : "400"}
                            >
                                {effect.name.length > 12 ? effect.name.substring(0, 10) + '...' : effect.name}
                            </text>
                        </g>
                    );
                })}

                {/* Connection to mixer */}
                {signalChain.length > 0 && (
                    <line
                        x1={startX + spacing * (signalChain.length) + nodeWidth / 2}
                        y1={startY + nodeHeight / 2}
                        x2={mixerX - nodeWidth / 2}
                        y2={mixerY + nodeHeight / 2}
                        stroke="#00D9FF"
                        strokeWidth={2}
                        markerEnd="url(#arrowhead)"
                    />
                )}

                {/* Mixer node */}
                <rect
                    x={mixerX - nodeWidth / 2}
                    y={mixerY}
                    width={nodeWidth}
                    height={nodeHeight}
                    rx={4}
                    fill="#147d80"
                    stroke="#00D9FF"
                    strokeWidth={2}
                />
                <text
                    x={mixerX}
                    y={mixerY + nodeHeight / 2}
                    textAnchor="middle"
                    fill="#F5F7FA"
                    fontSize="12"
                    fontWeight="600"
                >
                    Mixer
                </text>

                {/* Arrow marker definition */}
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3, 0 6" fill="#00D9FF" />
                    </marker>
                </defs>
            </svg>

            {/* Legend */}
            <Box 
                sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}
                role="list"
                aria-label={`Active effects for ${sourceLabel}`}
            >
                <Typography variant="caption" component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                    Active Effects:
                </Typography>
                {signalChain.length === 0 ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        No effects enabled
                    </Typography>
                ) : (
                    signalChain.map(effect => (
                        <Chip
                            key={effect.id}
                            label={effect.name}
                            size="small"
                            role="listitem"
                            aria-label={`${effect.name} effect, ${effect.isActive ? 'active' : 'inactive'}`}
                            sx={{
                                backgroundColor: effect.isActive ? 'rgba(196, 154, 44, 0.3)' : 'transparent',
                                color: effect.isActive ? '#F5F7FA' : 'rgba(255,255,255,0.5)',
                                border: `1px solid ${effect.isActive ? '#00D9FF' : 'rgba(0, 217, 255, 0.3)'}`,
                                fontSize: '0.7rem',
                                height: '20px'
                            }}
                        />
                    ))
                )}
            </Box>
        </Box>
    );
}

