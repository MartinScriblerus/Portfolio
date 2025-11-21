import { Box } from '@mui/material';
import React from 'react';
import { useTheme } from '@mui/material/styles';
import { BPMModule } from '../../interfaces/audioInterfaces';
import { TimingSubdivisionSelect } from './TimingSubdivisionSelect';
import { intervalMs, measureMs, quarterMs } from '../../utils/siteHelpers';
import { useTimingSubdivision } from '../../store/useTimingSubdivision';

const BPMModuleFun = (props: BPMModule) => {
    const {
        bpm,
        beatsNumerator,
        beatsDenominator,
    } = props;
    const theme = useTheme();

    const {subdivision, setSubdivision} = useTimingSubdivision();

    return (
        <Box sx={{ mt: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <TimingSubdivisionSelect
                bpm={bpm}
                beatsNumerator={beatsNumerator}
                beatsDenominator={beatsDenominator}
                onChange={setSubdivision}
            />
            {/* Live ms readout (monospace) */}
            <Box sx={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(245,245,245,0.78)' }}>
                q={Math.round(quarterMs(bpm))}ms · beat={Math.round((quarterMs(bpm) * 4) / Math.max(1, beatsDenominator))}ms ·
                interval={Math.round(intervalMs(bpm, subdivision))}ms · measure={Math.round(measureMs(bpm, beatsNumerator, beatsDenominator))}ms
            </Box>
        </Box>
    )
}
export default BPMModuleFun;