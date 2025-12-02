import { checkedFXList, currentEffectType, currentFX, currentScreen, currentStkTypeVar, doReturnToSynth, fxValsRef, moogGrandmotherEffects, stkKnobValsRef, universalSources, visibleFXKnobs } from "../../app/state/refs";
import { STKOption } from "./fixedOptionsDropdownData";
import { SetStateAction } from "react";
import { EffectsSettings, Sources, STKInstruments } from "../interfaces/audioTypes";

export const handleFXGroupChange = (
    e: any, 
    setCheckedEffectsListHook: React.Dispatch<SetStateAction<any>>
) => {
    console.log("E TARGET VALUE IN GROUP FX )CHANGE ", e.target.value);
    if (fxValsRef.current.indexOf(e.target.value) === -1 && fxValsRef.current.indexOf(e.target.value) === -1) {
        fxValsRef.current.push(e.target.value);
        checkedFXList.current.push(e.target.value);
        setCheckedEffectsListHook((x: any) => [...x, e.target.value]);
    } else {
        const index = fxValsRef.current.indexOf(e.target.value);
        fxValsRef.current.splice(index, 1);
        const indexChecked = checkedFXList.current.indexOf(e.target.value);
        checkedFXList.current.slice(indexChecked, 1);
    }
};

export const handleReturnToSynth = () => {
    if (currentScreen.current === "stk") {
    } else if (currentScreen.current !== "fx") {
        doReturnToSynth.current = !doReturnToSynth.current;
        currentScreen.current = "synth";
    }
};

export const updateCurrentFXScreen = (
    setFxKnobsCount: React.Dispatch<SetStateAction<any>>,
    doUpdateBabylonKey: (value: string) => void,
    babylonKey: string,
) => {
    // if (visibleFXKnobs.current && currentScreen.current.includes('stk') || currentScreen.current === 'fx_' || doReturnToSynth.current === true) {
    //     setFxKnobsCount(visibleFXKnobs.current.length);
    // } else if (currentScreen.current === 'synth') {
    setFxKnobsCount(visibleFXKnobs.current.length);
    // }
    doUpdateBabylonKey(`${babylonKey}1`);
};

export const updateCheckedFXList = async (
    e: any,
    setCheckedEffectsListHook: React.Dispatch<SetStateAction<any>>,
    doReturnToSynth: React.MutableRefObject<boolean>,
    setFxKnobsCount: React.Dispatch<SetStateAction<any>>,
    updateFlowNodesAndEdges: () => void,
    initFX: (x: any) => void,
    getConvertedRadio: (value: string) => string,
    fxRadioValue: string,
    ) => {

    currentEffectType.current = e.target.id ? e.target.id : e.target.value;

    if (checkedFXList.current.indexOf(e.target.value) === -1) {
        checkedFXList.current.push(e.target.value);
        setCheckedEffectsListHook((x: any) => [...x, e.target.value]);
    } else {
        doReturnToSynth.current = true;
        console.log("IN THE ELSE OF UPDATE CHECKED FX LIST />>> what is checkedFXList.current?: ", checkedFXList.current)
        console.log("E TARGET VALUE IN ELSE OF UPDATE CHECKED FX LIST: ", e.target.value);
        console.log("returning to synth in the else...");
        const index = checkedFXList.current.indexOf(e.target.value);
        checkedFXList.current.splice(index, 1);
        setCheckedEffectsListHook((x: any) => x.filter((y: any) => y !== e.target.value && y));

        currentFX.current = moogGrandmotherEffects.current;
        visibleFXKnobs.current = visibleFXKnobs.current || Object.values(moogGrandmotherEffects.current).map((i: any) => [i.label, i]);
        setFxKnobsCount(visibleFXKnobs.current.length);


        // // console.log("look good 2? ",  Object.values(moogGrandmotherEffects.current).map((i: any) => [i.label, i]))
        // visibleFXKnobs.current = Object.values(moogGrandmotherEffects.current).map((i: any) => [i.label, i]);
        // currentFX.current = moogGrandmotherEffects.current;
        // setFxKnobsCount(visibleFXKnobs.current.length);
    }

    universalSources.current &&
        universalSources.current[getConvertedRadio(fxRadioValue) as keyof Sources] &&
        Object.values(universalSources.current[getConvertedRadio(fxRadioValue) as keyof Sources]).length > 0 &&
        Object.values(universalSources.current[getConvertedRadio(fxRadioValue) as keyof Sources].effects).map((effect: any) => {
            if (effect.VarName === e.target.value && effect.On !== true) effect.On = true;
            else if (effect.VarName === e.target.value && effect.On === true) effect.On = false;
        });


    console.log("Checked List Current in Update: ", checkedFXList.current);

    // tk
    console.log("Nodes and edges updated successfully.");

    initFX(updateCurrentFXScreen);
    updateFlowNodesAndEdges();
    setFxKnobsCount(visibleFXKnobs.current.length);
    return;
};

export const updateStkKnobs = (
    knobVals: STKOption[],
    setFxKnobsCount: React.Dispatch<SetStateAction<any>>,
    // setNeedsUpdate: React.Dispatch<SetStateAction<any>>,
    getSTK1Preset: (value: string) => { type: string; var: string; presets: any[] },
    setBabylonKey: React.Dispatch<SetStateAction<any>>,
    babylonKey: string,
    updateCurrentFXScreen: (
        setFxKnobsCount: React.Dispatch<SetStateAction<any>>,
        setBabylonKey: React.Dispatch<SetStateAction<any>>,
        babylonKey: string, 
    ) => void,
) => {
        console.log("yup knobs: ", knobVals)
        stkKnobValsRef.current = [];
        stkKnobValsRef.current.push(...knobVals);
        if (!stkKnobValsRef.current[stkKnobValsRef.current.length - 1]) {
            
            visibleFXKnobs.current = Object.values(moogGrandmotherEffects.current).map((i: any) => [i.label, i]);
            setFxKnobsCount(moogGrandmotherEffects.current.length);
            updateCurrentFXScreen(        
                setFxKnobsCount,
                setBabylonKey,
                babylonKey );
            // setNeedsUpdate(true);
            return;
        }
        currentStkTypeVar.current = (`${getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value).type}#${getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value).var}`)
        if (universalSources.current) {
            console.log('@@@@@@@@@@@ knob vals / STK VALS REF CURRENT ', getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value));
            const stk: any = universalSources.current.stk1
            visibleFXKnobs.current = Object.values(getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value).presets).map((i: any) => [i.label, i]);
            const instType = getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value).type
            currentFX.current = getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value);
            if (universalSources.current.stk1.instruments) {
                Object.entries(universalSources.current.stk1.instruments as STKInstruments).map((i: [string, EffectsSettings]) => {
                    if (i[0] === instType) {
                        i[1].Visible = true;
                        i[1].On = true;
                        if (i[1].presets) i[1].presets = Object.values(getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value).presets);
                    } else {
                        i[1].Visible = false
                    }
                })
            }
            setFxKnobsCount(visibleFXKnobs.current.length);
            currentFX.current = getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value);


            currentScreen.current = `stk_${currentFX.current.type}`;

            if (Object.values(stk.instruments).filter((inst: any) => inst.On).length > 0) {

                stk.instruments[`${getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value).type}`].Type = getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value).type; ///// LOOK HERE!!!!
                stk.instruments[`${getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value).type}`].VarName = getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value).var;
                stk.instruments[`${getSTK1Preset(stkKnobValsRef.current[stkKnobValsRef.current.length - 1].value).type}`].On = true;

                currentFX.current = stkKnobValsRef.current;

                const knobsCountTemp = Object.values(stk.instruments).filter((i: any) => i.Visible).map((i: any) => i.presets).length;

                setFxKnobsCount(knobsCountTemp);
                updateCurrentFXScreen(
                    setFxKnobsCount,
                    setBabylonKey,
                    babylonKey,
                );
            }
        }
}

export const valuetext = (value: number) => {
    return `${value}`;
};
