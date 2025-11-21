import { FixedSimpleLabel } from '../interfaces/audioInterfaces';

export type STKOption = {
    readonly value: string;
    readonly label: string;
    readonly color: string;
    readonly isFixed?: boolean;
    readonly isDisabled?: boolean;
  };

  export type FXOption = {
    readonly value: string;
    readonly label: string;
    readonly color: string;
    readonly isFixed?: boolean;
    readonly isDisabled?: boolean;
  };
  
export const stkOptions: readonly STKOption[] = [
  { value: 'clarinet', label: 'Clarinet', color: 'rgb(144/255, 204/255, 212/255)' }, // presets written
  { value: 'm', label: 'Karplus', color: 'rgb(144/255, 204/255, 212/255)' }, // presets written
  { value: 'sitar', label: 'Sitar', color: 'rgb(144/255, 204/255, 212/255)' }, // presets written
  { value: 'moog', label: 'Moog', color: 'rgb(158/255, 210/255, 162/255)'}, // preset written
  { value: 'frenchhorn', label: 'FrencHrn', color: 'rgb(158/255, 210/255, 162/255)' }, // *** preset written
  { value: 'rhodey', label: 'Rhodey', color: 'rgb(236/255, 128/255, 139/255)' }, // *** preset written
  { value: 'saxofony', label: 'Saxofony', color: 'rgb(144/255, 204/255, 212/255)' }, // preset written
  { value: 'mandolin', label: 'Mandolin', color: 'rgb(144/255, 204/255, 212/255)' }, // preset written
  { value: 'bandedWg', label: 'Banded WaveGuide', color: 'rgb(158/255, 210/255, 162/255)' }, // preset written
  { value: 'blowbotl', label: 'BlowBtl', color: 'rgb(158/255, 210/255, 162/255)' }, // preset written
  { value: 'blowhole', label: 'BlowHole', color: 'rgb(158/255, 210/255, 162/255)' }, // preset written
  { value: 'bowed', label: 'Bowed', color: 'rgb(144/255, 204/255, 212/255)'}, // preset written
  { value: 'brass', label: 'Brass', color: 'rgb(144/255, 204/255, 212/255)' }, // preset written
  { value: 'flute', label: 'Flute', color: 'rgb(144/255, 204/255, 212/255)' }, // preset written
  { value: 'modalBar', label: 'Modal Bar', color: 'rgb(158/255, 210/255, 162/255)' }, // preset written
  { value: 'shakers', label: 'Shakers', color: 'rgb(158/255, 210/255, 162/255)' }, // preset written
  { value: 'voicForm', label: 'Voice Form', color: 'rgb(158/255, 210/255, 162/255)' }, // preset written
  { value: 'beeThree', label: 'B3', color: 'rgb(236/255, 128/255, 139/255)' }, // *** preset written
  { value: 'hevyMetl', label: 'Electric Guitar', color: 'rgb(236/255, 128/255, 139/255)' }, // *** preset written
  { value: 'hnkyTonk', label: 'Honky Tonk', color: 'rgb(236/255, 128/255, 139/255)' }, // *** preset written
  // { value: 'fm', label: 'FM', color: 'rgb(236/255, 128/255, 139/255)' }, // *** preset written
  { value: 'fmVoices', label: 'FM Voices', color: 'rgb(236/255, 128/255, 139/255 )' }, // *** preset written
  { value: 'krstlChr', label: 'Crystal Choir', color: 'rgb(236/255, 128/255, 139/255 )' }, // *** preset written
  { value: 'percFlut', label: 'PercFlut', color: 'rgb(236/255, 128/255, 139/255)'}, // *** preset writtem
  { value: 'tubeBell', label: 'Tube Bell', color: 'rgb(236/255, 128/255, 139/255)' }, // *** preset written
  { value: 'wurley', label: 'Wurley', color: 'rgb(236/255, 128/255, 139/255)' }, // *** preset written
];

export const fxGroupOptions: Array<FixedSimpleLabel> = [
  {
    label: "Gain/Distortion", 
    value: 0,
    effects: [
      {
        effectLabel: "Gain",
        effectVar: "gain"
      },
      {
        effectLabel: "Bitcrusher",
        effectVar: "bitcrusher"
      },
      {
        effectLabel: "FoldbackSaturator",
        effectVar: "foldbacksaturator"
      },
    ]
  },
	{
    label: "Delays/Echo", 
    value: 1,
    effects: [
      {
        effectLabel: "Delay",
        effectVar: "delay"
      },
      {
        effectLabel: "DelayL",
        effectVar: "delayL"
      },
      {
        effectLabel: "DelayA",
        effectVar: "delayA"
      },
      {
        effectLabel: "ExpDelay",
        effectVar: "expDelay"
      },
      {
        effectLabel: "Echo",
        effectVar: "echo"
      },
    ],
  },
	{
    label: "ChorusModPan", 
    value: 2,
    effects: [
      {
        effectLabel: "Chorus",
        effectVar: "chor"
      },
      {
        effectLabel: "Modulate",
        effectVar: "mod"
      },
      {
        effectLabel: "PitShift",
        effectVar: "pitShift"
      },
      {
        effectLabel: "AmbPan3",
        effectVar: "ambPan3"
      },
    ],
  },
	{
    label: "Reverbs", 
    value: 3,
    effects: [
      {
        effectLabel: "JCRev",
        effectVar: "jcr"
      },
      {
        effectLabel: "NRev",
        effectVar: "nr"
      },
      {
        effectLabel: "PRCRev",
        effectVar: "prcr"
      },
      {
        effectLabel: "GVerb",
        effectVar: "gverb"
      },
    ],
  },
	{
    label: "ADSRs", 
    value: 4,
    effects: [
      {
        effectLabel: "ADSR",
        effectVar: "adsr"
      },
      {
        effectLabel: "PowerADSR",
        effectVar: "poweradsr"
      },
    ],
  },
  {
    label: "Filters", 
    value: 5,
    effects: [
      {
        effectLabel: "Elliptic",
        effectVar: "elliptic"
      },
      {
        effectLabel: "KasFilter",
        effectVar: "kasfilter"
      },
      {
        effectLabel: "Multicomb",
        effectVar: "multicomb"
      },
      {
        effectLabel: "WPDiodeLadder",
        effectVar: "wpdiodeladder"
      },
      {
        effectLabel: "WPKorg35",
        effectVar: "wpkorg35"
      },
    ],
  }, 
	{
    label: "PitchTrackers", 
    value: 6,
    effects: [
      {
        effectLabel: "PitchTrack",
        effectVar: "pittrack"
      },
      {
        effectLabel: "Sigmund",
        effectVar: "sigmund"
      },
    ],
  },
 	{
    label: "Envelopes", 
    value: 7,
    effects: [
      {
        effectLabel: "ExpEnv",
        effectVar: "expenv"
      },
      {
        effectLabel: "Spectacle",
        effectVar: "spectacle"
      },
      {
        effectLabel: "WinFuncEnv",
        effectVar: "winfuncenv"
      },
    ],
  },
  {
    label: "Sampler", 
    value: 8,
    effects: [
      {
        effectLabel: "SndBuf",
        effectVar: "sndbuf"
      },
      {
        effectLabel: "LiSa",
        effectVar: "lisa"
      },
    ],
  },
]

export const fxOptions: readonly FXOption[] = [
  { value: 'gain', label: 'Gain', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'bitcrusher', label: 'Bit Crusher', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'chor', label: 'Chorus', color: 'rgb(158/255, 210/255, 162/255)' },
  { value: 'mod', label: 'Modulate', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'pitShift', label: 'Pitch Shift', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'prcr', label: 'PC Reverb', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'jcr', label: 'JC Reverb', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'nr', label: 'N Reverb', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'gverb', label: 'G Reverb', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'delay', label: 'Delay', color: 'rgb(158/255, 210/255, 162/255)' }, // 
  { value: 'delayA', label: 'Fract Delay', color: 'rgb(158/255, 210/255, 162/255)' },
  { value: 'delayL', label: 'Fract Linear Delay', color: 'rgb(158/255, 210/255, 162/255)' },
  { value: 'echo', label: 'Echo', color: 'rgb(158/255, 210/255, 162/255)' },
  { value: 'expDelay', label: 'Expon Delay', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'ambPan3', label: 'Ambisonic Pan', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'elliptic', label: 'Elliptic Filter', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'expenv', label: 'Expon Env', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'foldbacksaturator', label: 'Foldback Saturator', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'kasfilter', label: 'Kas Filter', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'multicomb', label: 'Multicomb', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'pittrack', label: 'Pitch Tracker', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'poweradsr', label: 'Power ADSR', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'sigmund', label: 'Sigmund', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'spectacle', label: 'Spectacle', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'winfuncenv', label: 'Window Env', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'wpdiodeladder', label: 'Diode Ladder', color: 'rgb(158/255, 210/255, 162/255)'},
  { value: 'wpkorg35', label: 'Korg 35', color: 'rgb(158/255, 210/255, 162/255)'},
];

