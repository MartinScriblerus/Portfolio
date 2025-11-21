import React, { useState } from 'react';
import { Box, FormLabel, Slider } from '@mui/material';

const lenMarks = [
    {
        value: 0,
        label: '1/16',
    },
    {
        value: 1,
        label: '1/8',
    },
    {
        value: 2,
        label: '1/4',
    },
    {
        value: 3,
        label: '1/2',
    },
    {
        value: 4,
        label: '1',
    },
    {
        value: 5,
        label: '2',
    },
    {
        value: 6,
        label: '4',
    },
    {
        value: 7,
        label: '8',
    },
    {
        value: 8,
        label: '16',
    }
];

const lenVals = [0, 1, 2, 3, 4, 5, 6, 7];

function valuetext(value: number) {
    return `${value}`;
}

type VelocityLengthSlidersProps = {
    handleNoteLengthUpdate: (event: any, cellData: any, newValue: any) => void;
    cellData?: any;
    maxLen?: number;
    chuckIsRunning?: boolean;
    masterPatterns?: any;
}

const VelocityLengthSliders = (props: VelocityLengthSlidersProps) => {

    const { handleNoteLengthUpdate, cellData, maxLen, chuckIsRunning, masterPatterns } = props;
    
    // console.log("YOYO LEN ? ", lenMarks.map((i:any) => i.label.indexOf("/") > -1 ? (i.label.split("/")[0] / i.label.split("/")[1]) : (i.label / 1)), "MPL: ", masterPatterns?.length);
    
    const arr: any = lenMarks.map((i:any) => i.label.indexOf("/") > -1 ? (i.label.split("/")[0] / i.label.split("/")[1]) : (i.label / 1)) 
    const idx = arr.indexOf(masterPatterns?.length);


    // const [singleNoteLengthValue, setSingleNoteLengthValue] = useState<number | undefined>((idx && idx >= 0) ? idx : undefined);

    return (
        <Box sx={{
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            marginRight: '8px',
            marginLeft: '8px',
        }}>
            <FormLabel
                sx={{
                    color: 'rgba(245,245,245,0.78)',
                    fontSize: '11px',
                    // paddingLeft: '8px',
                    marginLeft: '-8px',
                    paddingRight: '8px',
                }}
                id="velocities-select-label"
            >Note Length</FormLabel>
            <Slider
                aria-label="Note Length"
                value={lenMarks[idx].value}
                onChange={(e, newValue) => {
                    console.log("NV! ", newValue);
                    // if (!chuckIsRunning && newValue && (newValue !== noteLengthValue)) {

                        // setNoteLengthValue(newValue as number);
                        handleNoteLengthUpdate(e, cellData, newValue);
                    // }
                }}
                getAriaValueText={valuetext}
                valueLabelDisplay="auto"
                step={1}
                sx={{
                    color: 'rgba(245,245,245,0.78)',
                    backgroundColor: 'rgba(28,28,28,0.78)',
                    width: '100%',
                }}
                marks={lenMarks}
                min={0}
                max={8}
            />
        </Box>
    )
};
export default VelocityLengthSliders;