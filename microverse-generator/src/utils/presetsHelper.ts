import bandedWGPresets, {stkVariableBandedWg, stkIdentifierBandedWg} from './STKPresets/bandedWGPresets';
import beeThreePresets, {stkVariableBeeThree, stkIdentifierBeeThree} from './STKPresets/beeThreePresets';
import blowBotlPresets, {stkVariableBlowBotl, stkIdentifierBlowBotl} from './STKPresets/blowBottlePresets';
import blowHolePresets, {stkVariableBlowHole, stkIdentifierBlowHole} from './STKPresets/blowHolePresets';
import bowedPresets, {stkVariableBowed, stkIdentifierBowed} from './STKPresets/bowedPresets';
import brassPresets, {stkVariableBrass, stkIdentifierBrass} from './STKPresets/brassPresets';
import chorusPresets, {
    stkVariableChorus, 
    stkIdentifierChorus, 
    stkVariableModulate, 
    stkIdentifierModulate, 
    // modulatePresets, 
    pitShiftPresets, 
    stkVariablePitShift, 
    stkIdentifierPitShift,
    modulatePresets} from './FXPresets/chorusModPitchPresets';
import jcRevPresets, {
    gainPresets,
    nRevPresets,
    prcRevPresets,
    stkIdentifierGain, 
    stkIdentifierJCRev, 
    stkIdentifierNRev, 
    stkIdentifierPRCRev,
    stkIdentifierGVerb, 
    stkVariableGVerb, 
    stkVariableGain, 
    stkVariableJCRev, 
    stkVariableNRev, 
    stkVariablePRCRev,
    gVerbPresets} from './FXPresets/reverbGainPresets';
import clarinetPresets, {stkVariableClarinet, stkIdentifierClarinet} from './STKPresets/clarinetPresets';

import delayPresets, {echoPresets, stkVariableEcho, stkIdentifierEcho, delayLPresets, delayAPresets, stkVariableDelayL, stkVariableDelayA, stkVariableDelay, stkIdentifierDelayL, stkIdentifierDelayA, stkIdentifierDelay} from './FXPresets/delayPresets';

import flutePresets, {stkVariableFlute, stkIdentifierFlute} from './STKPresets/flutePresets';

import fmVoicesPresets, {stkVariableFMVoices, stkIdentifierFMVoices} from './STKPresets/fmVoices';
import frencHrnPresets, {stkVariableFrencHrn, stkIdentifierFrencHrn} from './STKPresets/frenchHornPresets';
import krstlChrPresets, {stkVariableKrstlChr, stkIdentifierKrstlChr} from './STKPresets/krstlChrPresets';
import mandolinPresets, {stkVariableMandolin, stkIdentifierMandolin} from './STKPresets/mandolinPresets';
import modalBarPresets, {stkVariableModalBar, stkIdentifierModalBar} from './STKPresets/modalBarPresets';
// import modulatePresets, {stkVariableModulate, stkIdentifierModulate} from '@/utils/FXPresets/modulatePresets';
import moogPresets, {stkVariableMoog, stkIdentifierMoog} from './STKPresets/moogPresets';
import percFlutPresets, {stkVariablePercFlut, stkIdentifierPercFlut} from './STKPresets/percFlutPresets';
// import pitShiftPresets, {stkVariablePitShift, stkIdentifierPitShift} from '@/utils/FXPresets/pitchShiftPresets';
import rhodeyPresets, {stkVariableRhodey, stkIdentifierRhodey} from './STKPresets/rhodesPresets';
import hevyMetlPresets, {stkIdentifierHevyMetl, stkVariableHevyMetl} from './STKPresets/hevyMetlPresets';
import hnkyTonkPresets, {stkVariableHnkyTonk, stkIdentifierHnkyTonk} from './STKPresets/hnkyTonk';
import saxofonyPresets, {stkIdentifierSaxofony, stkVariableSaxofony} from './STKPresets/saxPresets';
import sitarPresets, {stkVariableSitar, stkIdentifierSitar} from './STKPresets/sitarPresets';
import stifKarpPresets, {stkVariableStifKarp, stkIdentifierStifKarp} from './STKPresets/stifKarpPresets';
import shakersPresets, {stkVariableShakers, stkIdentifierShakers} from './STKPresets/shakersPresets';
import tubeBellPresets, {stkVariableTubeBell, stkIdentifierTubeBell} from './STKPresets/tubeBell';
import voicFormPresets, {stkVariableVoicForm, stkIdentifierVoicForm} from './STKPresets/voicFormPresets';
import wurleyPresets, {stkVariableWurley, stkIdentifierWurley} from './STKPresets/wurleyPresets';
import ambPan3Presets, { stkIdentifierAmbPan3, stkVariableAmbPan3 } from './FXPresets/ambPanPresets';
import bitcrusherPresets, { stkIdentifierBitcrusher, stkVariableBitcrusher } from './FXPresets/bitcrusherPresets';
import ellipticPresets, { stkIdentifierElliptic, stkVariableElliptic } from './FXPresets/ellipticPresets';
import expDelayPresets, { stkIdentifierExpDelay, stkVariableExpDelay } from './FXPresets/expDelayPresets';
import expEnvPresets, { stkIdentifierExpEnv, stkVariableExpEnv } from './FXPresets/expEnvPresets';
import foldbackSaturatorPresets, { stkIdentifierFoldbackSaturator, stkVariableFoldbackSaturator } from './FXPresets/foldbackSaturatorPresets';
import kasFilterPresets, { stkIdentifierKasFilter, stkVariableKasFilter } from './FXPresets/kasFilterPresets';
import multicombPresets, { stkIdentifierMulticomb, stkVariableMulticomb } from './FXPresets/MulticombPresets';
import pitchTrackPresets, { stkIdentifierPitchTrack, stkVariablePitchTrack } from './FXPresets/pitchTrackPresets';
import powerADSRPresets, { stkIdentifierPowerADSR, stkVariablePowerADSR } from './FXPresets/powerADSR';
import sigmundPresets, { stkIdentifierSigmund, stkVariableSigmund } from './FXPresets/sigmundPresets';
import spectaclePresets, { stkIdentifierSpectacle, stkVariableSpectacle } from './FXPresets/spectaclePresets';
import winFuncEnvPresets, { stkIdentifierWinFuncEnv, stkVariableWinFuncEnv } from './FXPresets/winFuncEnv';
import wpDiodeLadderPresets, { stkIdentifierWPDiodeLadder, stkVariableWPDiodeLadder } from './FXPresets/wpDiodeLadder';
import wpKorg35Presets, { stkIdentifierWPKorg35, stkVariableWPKorg35 } from './FXPresets/WPKorg35';
import adsrPresets, { stkIdentifierADSR, stkVariableADSR } from './FXPresets/adsrPresets';
import sndBufPresets, {stkIdentifierSndBuf, stkVariableSndBuf, stkIdentifierLisa, stkVariableLisa, lisaPresets} from './FXPresets/sndBufLisaPresets';



export const getSTK1Preset = (stkVal: string) => {
    // console.log("STK VAL::: ", stkVal); // Holy moly this runs alot -- edit this....
    let theStk1Fx;
    if (stkVal === 'saxofony' || stkVal === 'Saxofony') {
        theStk1Fx = {
            presets: saxofonyPresets,
            type: stkIdentifierSaxofony,
            var: stkVariableSaxofony,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'clarinet' || stkVal === 'Clarinet') {
        theStk1Fx = {
            presets: clarinetPresets,
            type: stkIdentifierClarinet,
            var: stkVariableClarinet,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'karplus' || stkVal === 'stifkrp' || stkVal === "m" || stkVal === 'stifkarp') {
        theStk1Fx = {
            presets: stifKarpPresets,
            type: stkIdentifierStifKarp,
            var: stkVariableStifKarp,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'sitar' || stkVal === 'Sitar') {
        theStk1Fx = {
            presets: sitarPresets,
            type: stkIdentifierSitar,
            var: stkVariableSitar,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'moog' || stkVal === 'Moog') {
        theStk1Fx = {
            presets: moogPresets,
            type: stkIdentifierMoog,
            var: stkVariableMoog,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'frenchrn' || stkVal === 'FrencHrn' || stkVal === 'frenchhorn') {
        theStk1Fx = {
            presets: frencHrnPresets,
            type: stkIdentifierFrencHrn,
            var: stkVariableFrencHrn,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } 
    else if (stkVal === 'electricguitar' || stkVal === 'hevyMetl' || stkVal === 'hevymetl') {
        theStk1Fx = {
            presets: hevyMetlPresets,
            type: stkIdentifierHevyMetl,
            var: stkVariableHevyMetl,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'honkeytonk' || stkVal === 'hnkytonk') {
        theStk1Fx = {
            presets: hnkyTonkPresets,
            type: stkIdentifierHnkyTonk,
            var: stkVariableHnkyTonk,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'rhodey') {
        theStk1Fx = {
            presets: rhodeyPresets,
            type: stkIdentifierRhodey,
            var: stkVariableRhodey,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'mandolin') {
        theStk1Fx = {
            presets: mandolinPresets,
            type: stkIdentifierMandolin,
            var: stkVariableMandolin,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'bandedwaveguide' || stkVal === 'bandedWg' || stkVal === 'bandedwg') {
        theStk1Fx = {
            presets: bandedWGPresets,
            type: stkIdentifierBandedWg,
            var: stkVariableBandedWg,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'bottle' || stkVal === 'blowbotl' || stkVal === 'blowbtl') {
        theStk1Fx = {
            presets: blowBotlPresets,
            type: stkIdentifierBlowBotl,
            var: stkVariableBlowBotl,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'blowhole') {
        theStk1Fx = {
            presets: blowHolePresets,
            type: stkIdentifierBlowHole,
            var: stkVariableBlowHole,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'bowed') {
        theStk1Fx = {
            presets: bowedPresets,
            type: stkIdentifierBowed,
            var: stkVariableBowed,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'brass') {
        theStk1Fx = {
            presets: brassPresets,
            type: stkIdentifierBrass,
            var: stkVariableBrass,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'flute') {
        theStk1Fx = {
            presets: flutePresets,
            type: stkIdentifierFlute,
            var: stkVariableFlute,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'modalBar' || stkVal === 'modalbar') {
        theStk1Fx = {
            presets: modalBarPresets,
            type: stkIdentifierModalBar,
            var: stkVariableModalBar,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'shakers') {
        theStk1Fx = {
            presets: shakersPresets,
            type: stkIdentifierShakers,
            var: stkVariableShakers,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'voicForm' || stkVal === 'voicform') {
        theStk1Fx = {
            presets: voicFormPresets,
            type: stkIdentifierVoicForm,
            var: stkVariableVoicForm,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'b3' || stkVal === 'beeThree' || stkVal === 'beethree') {
        theStk1Fx = {
            presets: beeThreePresets,
            type: stkIdentifierBeeThree,
            var: stkVariableBeeThree,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'fmVoices' || stkVal === 'fmvoices') {
        theStk1Fx = {
            presets: fmVoicesPresets,
            type: stkIdentifierFMVoices,
            var: stkVariableFMVoices,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'chrystalchoir' || stkVal === 'krstlChr' || stkVal === 'krstlchr') {
        theStk1Fx = {
            presets: krstlChrPresets,
            type: stkIdentifierKrstlChr,
            var: stkVariableKrstlChr,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'percFlut' || stkVal === 'percFlut' || stkVal === 'percflut') {
        theStk1Fx = {
            presets: percFlutPresets,
            type: stkIdentifierPercFlut,
            var: stkVariablePercFlut,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'tubeBell' || stkVal === 'tubebell') {
        theStk1Fx = {
            presets: tubeBellPresets,
            type: stkIdentifierTubeBell,
            var: stkVariableTubeBell,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    } else if (stkVal === 'wurley') {
        theStk1Fx = {
            presets: wurleyPresets,
            type: stkIdentifierWurley,
            var: stkVariableWurley,
            fxType: 'stk',
            visible: true,
            checked: true
        };
    }
    else {
        console.log("******** WHY IN THE ELSE of STKVAL 1111 ??? ********* ", stkVal)
        theStk1Fx = {
            presets: frencHrnPresets,
            type: stkIdentifierFrencHrn,
            var: stkVariableFrencHrn
        };
    }
    // console.log("STK PRESETS: ", theStk1Fx.presets);

    return theStk1Fx;
}

export const getSTK2Preset = (stkVal: string) => {
    let theStk2Fx;
    if (stkVal === 'saxofony') {
        theStk2Fx = {
            presets: saxofonyPresets,
            type: stkIdentifierSaxofony,
            var: stkVariableSaxofony
        };
    } else if (stkVal === 'clarinet') {
        theStk2Fx = {
            presets: clarinetPresets,
            type: stkIdentifierClarinet,
            var: stkVariableClarinet
        };
    } else if (stkVal === 'm' || stkVal === 'karplus' || stkVal === 'stifkarp') {
        theStk2Fx = {
            presets: stifKarpPresets,
            type: stkIdentifierStifKarp,
            var: stkVariableStifKarp
        };
    } else if (stkVal === 'sitar') {
        theStk2Fx = {
            presets: sitarPresets,
            type: stkIdentifierSitar,
            var: stkVariableSitar
        };
    } else if (stkVal === 'moog') {
        theStk2Fx = {
            presets: moogPresets,
            type: stkIdentifierMoog,
            var: stkVariableMoog
        };
    } else if (stkVal === 'frenchhorn') {
        theStk2Fx = {
            presets: frencHrnPresets,
            type: stkIdentifierFrencHrn,
            var: stkVariableFrencHrn
        };
    } else if (stkVal === 'rhodey') {
        theStk2Fx = {
            presets: rhodeyPresets,
            type: stkIdentifierRhodey,
            var: stkVariableRhodey
        };
    } else if (stkVal === 'mandolin') {
        theStk2Fx = {
            presets: mandolinPresets,
            type: stkIdentifierMandolin,
            var: stkVariableMandolin
        };
    } else if (stkVal === 'bandedWg') {
        theStk2Fx = {
            presets: bandedWGPresets,
            type: stkIdentifierBandedWg,
            var: stkVariableBandedWg
        };
    } else if (stkVal === 'blowbotl') {
        theStk2Fx = {
            presets: blowBotlPresets,
            type: stkIdentifierBlowBotl,
            var: stkVariableBlowBotl
        };
    } else if (stkVal === 'blowhole') {
        theStk2Fx = {
            presets: blowHolePresets,
            type: stkIdentifierBlowHole,
            var: stkVariableBlowHole
        };
    } else if (stkVal === 'bowed') {
        theStk2Fx = {
            presets: bowedPresets,
            type: stkIdentifierBowed,
            var: stkVariableBowed
        };
    } else if (stkVal === 'brass') {
        theStk2Fx = {
            presets: brassPresets,
            type: stkIdentifierBrass,
            var: stkVariableBrass
        };
    } else if (stkVal === 'flute') {
        theStk2Fx = {
            presets: flutePresets,
            type: stkIdentifierFlute,
            var: stkVariableFlute
        };
    } else if (stkVal === 'modalBar') {
        theStk2Fx = {
            presets: modalBarPresets,
            type: stkIdentifierModalBar,
            var: stkVariableModalBar
        };
    } else if (stkVal === 'shakers') {
        theStk2Fx = {
            presets: shakersPresets,
            type: stkIdentifierShakers,
            var: stkVariableShakers
        };
    } else if (stkVal === 'voicForm') {
        theStk2Fx = {
            presets: voicFormPresets,
            type: stkIdentifierVoicForm,
            var: stkVariableVoicForm
        };
    } else if (stkVal === 'beeThree') {
        theStk2Fx = {
            presets: beeThreePresets,
            type: stkIdentifierBeeThree,
            var: stkVariableBeeThree
        };
    } else if (stkVal === 'krstlChr') {
        theStk2Fx = {
            presets: krstlChrPresets,
            type: stkIdentifierKrstlChr,
            var: stkVariableKrstlChr
        };
    } else if (stkVal === 'percFlut' || stkVal === 'percflut') {
        theStk2Fx = {
            presets: percFlutPresets,
            type: stkIdentifierPercFlut,
            var: stkVariablePercFlut
        };
    } else if (stkVal === 'tubeBell') {
        theStk2Fx = {
            presets: tubeBellPresets,
            type: stkIdentifierTubeBell,
            var: stkVariableTubeBell
        };
    } else if (stkVal === 'wurley') {
        theStk2Fx = {
            presets: wurleyPresets,
            type: stkIdentifierWurley,
            var: stkVariableWurley
        };
    } else {
        console.log("******** WHY IN THE ELSE of STKVal 2222??? *********")
        theStk2Fx = {
            presets: frencHrnPresets,
            type: stkIdentifierFrencHrn,
            var: stkVariableFrencHrn
        };
    }
    return theStk2Fx;
}

export const getFX1Preset = (fxVal: string) => {
    // console.log("FX VAL::: ", fxVal);
    const theFX1Fx = [];
    // if (fxVal === 'mod') {
    //     theFX1Fx.push({
    //         presets: modulatePresets,
    //         type: stkIdentifierModulate,
    //         var: stkVariableModulate,
    //     });
    // } else 
    if (fxVal === 'pitShift') {
        theFX1Fx.push({
            presets: pitShiftPresets,
            type: stkIdentifierPitShift,
            var: stkVariablePitShift,
        });
    } else if (fxVal === 'chor') {
        theFX1Fx.push({
            presets: chorusPresets,
            type: stkIdentifierChorus,
            var: stkVariableChorus,
        });
    } else if (fxVal === 'mod') {
        theFX1Fx.push({
            presets: modulatePresets,
            type: stkIdentifierModulate,
            var: stkVariableModulate,
        })
    } else if (fxVal === 'gain') {
        theFX1Fx.push({
            presets: gainPresets,
            type: stkIdentifierGain,
            var: stkVariableGain,
        });
    } else if (fxVal === 'prcr') {
        theFX1Fx.push({
            presets: prcRevPresets,
            type: stkIdentifierPRCRev,
            var: stkVariablePRCRev,
        });
    } else if (fxVal === 'nr') {
        theFX1Fx.push({
            presets: nRevPresets,
            type: stkIdentifierNRev,
            var: stkVariableNRev,
        });
    } else if (fxVal === 'jcr') {
        theFX1Fx.push({
            presets: jcRevPresets,
            type: stkIdentifierJCRev,
            var: stkVariableJCRev
        });
    }
    else if (fxVal === 'gverb') {
        theFX1Fx.push({
            presets: gVerbPresets,
            type: stkIdentifierGVerb, //
            var: stkVariableGVerb
        });
    }  
    else if (fxVal === 'delay') {
        theFX1Fx.push({
            presets: delayPresets,
            type: stkIdentifierDelay,
            var: stkVariableDelay
        });
    } else if (fxVal === 'delayA') {
        theFX1Fx.push({
            presets: delayAPresets,
            type: stkIdentifierDelayA,
            var: stkVariableDelayA
        });
    } else if (fxVal === 'delayL') {
        theFX1Fx.push({
            presets: delayLPresets,
            type: stkIdentifierDelayL,
            var: stkVariableDelayL
        });
    } else if (fxVal === 'echo') {
        theFX1Fx.push({
            presets: echoPresets,
            type: stkIdentifierEcho,
            var: stkVariableEcho
        });
    } 
    else if (fxVal === 'ambPan3') {
        theFX1Fx.push({
            presets: ambPan3Presets,
            type: stkIdentifierAmbPan3,
            var: stkVariableAmbPan3
        });
    } 
    else if (fxVal === 'bitcrusher') {
        theFX1Fx.push({
            presets: bitcrusherPresets,
            type: stkIdentifierBitcrusher,
            var: stkVariableBitcrusher
        });
    } 
    else if (fxVal === 'elliptic') {
        theFX1Fx.push({
            presets: ellipticPresets,
            type: stkIdentifierElliptic, //
            var: stkVariableElliptic
        });
    } 
    else if (fxVal === 'expDelay') {
        theFX1Fx.push({
            presets: expDelayPresets,
            type: stkIdentifierExpDelay, //
            var: stkVariableExpDelay
        });
    } 
    else if (fxVal === 'expenv') {
        theFX1Fx.push({
            presets: expEnvPresets,
            type: stkIdentifierExpEnv, //
            var: stkVariableExpEnv
        });
    } 
    else if (fxVal === 'foldbacksaturator') {
        theFX1Fx.push({
            presets: foldbackSaturatorPresets,
            type: stkIdentifierFoldbackSaturator, //
            var: stkVariableFoldbackSaturator
        });
    } 
    else if (fxVal === 'kasfilter') {
        theFX1Fx.push({
            presets: kasFilterPresets,
            type: stkIdentifierKasFilter, //
            var: stkVariableKasFilter
        });
    } 
    else if (fxVal === 'multicomb') {
        theFX1Fx.push({
            presets: multicombPresets,
            type: stkIdentifierMulticomb, //
            var: stkVariableMulticomb
        });
    } 
    else if (fxVal === 'pittrack') {
        console.log("YA HERE!!! ", {
            presets: pitchTrackPresets,
            type: stkIdentifierPitchTrack, //
            var: stkVariablePitchTrack
        })
        theFX1Fx.push({
            presets: pitchTrackPresets,
            type: stkIdentifierPitchTrack, //
            var: stkVariablePitchTrack
        });
    } 
    else if (fxVal === 'adsr') {
        theFX1Fx.push({
            presets: adsrPresets,
            type: stkIdentifierADSR, //
            var: stkVariableADSR
        });
    } 
    else if (fxVal === 'poweradsr') {
        theFX1Fx.push({
            presets: powerADSRPresets,
            type: stkIdentifierPowerADSR, //
            var: stkVariablePowerADSR
        });
    } 
    else if (fxVal === 'sigmund') {
        theFX1Fx.push({
            presets: sigmundPresets,
            type: stkIdentifierSigmund, //
            var: stkVariableSigmund
        });
    } 
    else if (fxVal === 'spectacle') {
        theFX1Fx.push({
            presets: spectaclePresets,
            type: stkIdentifierSpectacle, //
            var: stkVariableSpectacle
        });
    } 
    else if (fxVal === 'winfuncenv') {
        theFX1Fx.push({
            presets: winFuncEnvPresets,
            type: stkIdentifierWinFuncEnv, //
            var: stkVariableWinFuncEnv
        });
    }
    else if (fxVal === 'wpdiodeladder') {
        theFX1Fx.push({
            presets: wpDiodeLadderPresets,
            type: stkIdentifierWPDiodeLadder, //
            var: stkVariableWPDiodeLadder
        });
    }
    else if (fxVal === 'wpkorg35') {
        theFX1Fx.push({
            presets: wpKorg35Presets,
            type: stkIdentifierWPKorg35, //
            var: stkVariableWPKorg35
        });
    } 
    else if (fxVal === 'sndbuf') {
        theFX1Fx.push({
            presets: sndBufPresets,
            type: stkIdentifierSndBuf, //
            var: stkVariableSndBuf
        });
    } else if (fxVal === 'lisa') {
        theFX1Fx.push({
            presets: lisaPresets,
            type: stkIdentifierLisa,
            var: stkVariableLisa,
        })
    }
    else {
        console.log('ooof in presets helper')
        // console.log('in the else of PresetsHelper');
        // theFX1Fx.push({
        //     presets: {},
        //     type: '', //
        //     var: ''
        // });
    }
    return theFX1Fx;
}

export const tableIntToStringHelper: any = async(formattedValue: number) => {
    let theVal;
    switch(formattedValue){
        case 0:
            theVal = `("delay", "random")`;
        case 1:
            theVal = `("delay", "ascending")`;
        case 2:
            theVal = `("delay", "descending")`;
        case 3:
            theVal = `("eq", "random")`;
        case 4:
            theVal = `("eq", "ascending")`;
        case 5:
            theVal = `("eq", "descending")`;
        case 6:
            theVal = `("feedback", "random")`;
        case 7:
            theVal = `("feedback", "ascending")`;
        case 8:
            theVal = `("feedback", "descending")`;
        default:
            theVal = `("delay", "descending")`;
    }
    return await theVal;
}