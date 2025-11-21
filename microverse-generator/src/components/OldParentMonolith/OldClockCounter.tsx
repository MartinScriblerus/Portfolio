import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";

type ClockCounterProps = {
    chuckHook: any;
    currentPatternCount: number;
    currentDenomCount: number;
    currentNumerCountColToDisplay: number;
    currentBeatCountToDisplay: number;
    numeratorSignature: number;
    clockCounterKey: string;
}
const ClockCounter = (props: ClockCounterProps) => {
    const { chuckHook, currentPatternCount, currentDenomCount, currentNumerCountColToDisplay, currentBeatCountToDisplay, numeratorSignature, clockCounterKey } = props;

    const [cpCount, setCpCount] = useState<number>(0);
    const [cdCount, setCdCount] = useState<number>(0);
    const [cnCount, setCnCount] = useState<number>(0);
    const [cbCount, setCbCount] = useState<number>(0);

    useEffect(() => {
        setCpCount(currentPatternCount);
        setCdCount(currentDenomCount);
        setCnCount(currentNumerCountColToDisplay);
        setCbCount(Math.floor(Math.ceil(currentBeatCountToDisplay / numeratorSignature)));
    }, [
        clockCounterKey
    ])
    
    return (
        <Box
            id="clockCounterWrapper"
            sx={{
                top: '64px',
                position: 'absolute',
                right: '12px',
                zIndex: 9999,
            }}
        >
            <Box
            className="countWrapper"
            sx={{
                color: "rgba(245,245,245,0.78)",
                position: "relative",
                pointerEvents: "none",
                display: "flex",
                flexDirection: "row",
                textAlign: "center",
                justifyContent: "center",
                top: "8px",
            }}
            >
            <Typography sx={{ marginLeft: "12px", marginRight: "12px", fontSize: "24px !important" }}>
                {cpCount}
            </Typography>

            <Typography sx={{ marginLeft: "12px", marginRight: "12px", fontSize: "24px !important" }}>
                {cdCount}
            </Typography>

            <Typography sx={{ marginLeft: "12px", marginRight: "12px", fontSize: "24px !important" }}>
                {cnCount}
            </Typography>

            <Typography sx={{ marginLeft: "12px", marginRight: "12px", fontSize: "24px !important" }}>
                {/* {Math.floor(Math.ceil(cbCount / numeratorSignature))} */}
                {cbCount}
            </Typography>
            </Box>
        </Box>
    )
};
export default ClockCounter;