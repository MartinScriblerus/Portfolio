export const initialNodesDefaults = [
    {
        id: 'Osc1_In',
        data: { label: 'Osc1_In' },
        position: { x: 0, y: 0 },
        type: 'input',
        style: {
            height: 40,
            width: 100,
            // backgroundColor: theme.palette.primaryA
        },
    },
    {
        id: 'Osc1_Out',
        data: { label: 'Osc1_Out' },
        position: { x: 20, y: 0 },
        style: {
            height: 40,
            width: 100,
            // backgroundColor: theme.palette.primaryA
        },
    },

    // {
    //     id: 'Osc2_In',
    //     data: { label: 'Osc2_In' },
    //     position: { x: 0, y: -100 },
    //     type: 'input',
    //     style: {
    //         height: 40,
    //         width: 100,
    //         // backgroundColor: theme.palette.secondaryA
    //     },
    // },
    // {
    //     id: 'Osc2_Out',
    //     data: { label: 'Osc2_Out' },
    //     position: { x: 200, y: -100 },
    //     style: {
    //         height: 40,
    //         width: 100,
    //         // backgroundColor: theme.palette.secondaryA
    //     },
    // },
    {
        id: 'STK_In',
        data: { label: 'STK_In' },
        position: { x: 0, y: -200 },
        type: 'input',
        style: {
            height: 40,
            width: 100,
            // backgroundColor: theme.palette.secondaryA
        },
    },
    {
        id: 'STK_Out',
        data: { label: 'STK_Out' },
        position: { x: 200, y: -200 },
        style: {
            height: 40,
            width: 100,
            // backgroundColor: theme.palette.secondaryA
        },
    },
    {
        id: 'Sampler_In',
        data: { label: 'Sampler_In' },
        position: { x: 0, y: 100 },
        type: 'input',
        style: {
            height: 40,
            width: 100,
            // backgroundColor: theme.palette.secondaryA
        },
    },
    {
        id: 'Sampler_Out',
        data: { label: 'Sampler_Out' },
        position: { x: 200, y: 100 },
        style: {
            height: 40,
            width: 100,
            // backgroundColor: theme.palette.secondaryA
        },
    },
    {
        id: 'AudioIn_In',
        data: { label: 'AudioIn_In' },
        position: { x: 0, y: 200 },
        type: 'input',
        style: {
            height: 40,
            width: 100,
            // backgroundColor: theme.palette.secondaryA
        },
    },
    {
        id: 'AudioIn_Out',
        data: { label: 'AudioIn_Out' },
        position: { x: 200, y: 200 },
        style: {
            height: 40,
            width: 100,
            // backgroundColor: theme.palette.secondaryA
        },
    }
];

export const initialEdgesDefaults = [
    { id: 'edgefrom_Osc1_In', source: 'Osc1_In', target: 'Osc1_Out'},
    // { id: 'edgefrom_Osc2_In', source: 'Osc2_In', target: 'Osc2_Out'},
    { id: 'edgefrom_STK_In', source: 'STK_In', target: 'STK_Out'},
    { id: 'edgefrom_Sampler_In', source: 'Sampler_In', target: 'Sampler_Out'},
    { id: 'edgefrom_AudioIn_In', source: 'AudioIn_In', target: 'AudioIn_Out'},
];