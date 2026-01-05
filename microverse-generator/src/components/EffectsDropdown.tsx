import { useAudioInSettingsStore } from "../utils/audioInSettingsHelper";
import { EFFECTS } from "../constants";
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState } from "react";
import { audioInEffectSlidersHelper } from '../utils/utils';

// Props for this dropdown component
type FxDropProps = {
    chuckRef: React.MutableRefObject<any>;
    updateSelectedAudioInSetting: (effect: string) => void;
    showAudioInDropdown?: boolean;
};

function EffectSliders({ effect, chuckRef, updateSelectedAudioInSetting }: { 
    effect: string, 
    chuckRef: any, 
    updateSelectedAudioInSetting: any 
}) {
    const audioInSettingsHelperHash = useAudioInSettingsStore(s => s.audioInSettings);
    const setAudioInSetting = useAudioInSettingsStore(s => s.setAudioInSetting);
    const sliderNames = audioInEffectSlidersHelper(effect);
    const transformedKeyNames: string[] = sliderNames.map(name =>
        `${effect.trim().toLowerCase().replace(' ', '_')}_${name.name.trim().toLowerCase().replace(' ', '')}`
    );

    // Local state for slider values
    const [values, setValues] = useState(() => transformedKeyNames.map((n: any) => (audioInSettingsHelperHash as any)[n]));

    // Sync local state to store when effect changes
    useEffect(() => {
        const valsForEffect: any = transformedKeyNames.map((n: any) => (audioInSettingsHelperHash as any)[n]);
        setValues(valsForEffect);
        updateSelectedAudioInSetting(effect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effect, audioInSettingsHelperHash]);

    // Only update Zustand and ChucK when values change
    useEffect(() => {
        (async () => {
            let updated = false;
            for (let i = 0; i < sliderNames.length; i++) {
                const key = transformedKeyNames[i];
                const transformByThousandSliderArray = ['lisa_trigger_rate', 'grain_rate', 'random_reverse_rate'];
                const value = values[i];
                // Only update if value differs from store
                if ((audioInSettingsHelperHash as any)[key] !== value) {
                    setAudioInSetting(key, value);
                    if (chuckRef.current) {
                        console.log("SANITY CHECK GOT KEY AND VALUE? ", key, value)
                        await chuckRef.current.setAssociativeFloatArrayValue("audioInSettingsHelperHash", key, transformByThousandSliderArray.includes(key) ? +((value * 1.0) / 1000).toFixed(3) : +(value * 1.0).toFixed(3));
                        await chuckRef.current.broadcastEvent("fxUpdate");
                        updated = true;
                    }
                }
            }
        })();
    // Only run when values change, not when store changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values]);

    return (
        <div style={{ padding: '12px 8px 8px 8px', background: 'rgba(0,0,0,0.10)', borderRadius: 4 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{effect} Controls</div>
            {sliderNames.map((name: { name: boolean | Key | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; min: string | number | undefined; max: string | number | undefined; }, i: number) => (
                <div key={String(name.name)} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 13, color: '#e9f1ff', marginBottom: 2, display: 'block' }}>
                        {name.name}
                    </label>
                    <input
                        type="range"
                        min={name.min}
                        max={name.max}
                        value={values[i]}
                        onChange={e => {
                            const v = Number(e.target.value);
                            setValues((vals: any) => {
                                const newVals = vals.map((val: any, idx: number) => (idx === i ? v : val));
                                console.log(`[EffectSliders] setValues: index ${vals[i]} changed to`, v, "New values:", newVals);
                                return newVals;
                            });
                        }}
                        style={{ zIndex: 99999, width: 180, accentColor: '#6cf', height: 4 }}
                    />
                    <span style={{ marginLeft: 10, fontSize: 12, color: '#b7d6ff' }}>{values[i]}</span>
                </div>
            ))}
        </div>
    );
}

export default function EffectsDropdown({ chuckRef, updateSelectedAudioInSetting, showAudioInDropdown }: FxDropProps) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [minimizeAudioInDropdown, setMinimizeAudioInDropdown] = useState(false);

    return (
        <div style={{ width: '100%' }}>
            <div
                style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    userSelect: 'none',
                    background: 'royalblue'
                }}
                onClick={() => {
                    if (selected === '' && !minimizeAudioInDropdown) {
                        setMinimizeAudioInDropdown(true);
                    } else {
                        setMinimizeAudioInDropdown(false);
                    }
                    setSelected('');
                }}
            >
                {selected || 'Select Effect'}
                <span
                    className="effects-dropdown-arrow"
                    style={{
                        rotate: selected ? '180deg' : '0deg',
                    }}
                >
                    ▼
                </span>
            </div>

            {!minimizeAudioInDropdown && (
                <div className="effects-dropdown-wrapper">
                    {EFFECTS.map(effect => (
                        <div
                            key={effect}
                            className="effects-dropdown-item"
                            style={{
                                background:
                                    selected === effect ? 'rgba(255,255,255,0.10)' : 'transparent',
                            }}
                            onClick={() => {
                                // updateSelectedAudioInSetting
                                setSelected(effect);
                                setOpen(!open);
                                updateSelectedAudioInSetting(effect);
                            }}
                        >
                            {effect}
                            {selected === effect && (
                                <EffectSliders
                                    effect={selected}
                                    chuckRef={chuckRef}
                                    updateSelectedAudioInSetting={updateSelectedAudioInSetting}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}