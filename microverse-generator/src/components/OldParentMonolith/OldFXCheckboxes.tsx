import * as React from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { FXGroupsArray } from '../../interfaces/audioInterfaces';
import '../../../app/globals.css';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


export default function FXCheckboxLabels(props: FXGroupsArray) {
    const { fxGroupsArrayList, checkedFXList, handleFXGroupChange, updateCheckedFXList, setCheckedEffectsListHook } = props;
    
    const fxGroupsArrayListNoDupes = React.useMemo(() => {
        return fxGroupsArrayList.length > 8 
            ? [...new Map(fxGroupsArrayList.map((item) => [item.label, item])).values()]
            : fxGroupsArrayList;
    }, [fxGroupsArrayList]);

    const [expanded, setExpanded] = React.useState<string | false>(false);

    // Memoized handleChange to avoid unnecessary re-renders
    const handleChange = React.useCallback(
        (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
            setExpanded(isExpanded ? panel : false);
        },
        []
    );

    return (
        <>
            {fxGroupsArrayListNoDupes.map((fxG: any, idx: number) => (
                <Accordion
                    id="checkboxAccordionOuter"
                    expanded={expanded === `panel${idx}`}
                    onChange={handleChange(`panel${idx}`)}
                    key={`${fxG.label.replace(' ', '_')}_fx_accordion`}
                >
                    <AccordionSummary
                        key={`${fxG.label.replace(' ', '_')}_fx_accordion_summary`}
                        expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(147, 206, 214, 1)' }} />}
                        aria-controls="panel1-content"
                        id="checkboxPanelHeader"
                    >
                        <Typography
                            sx={{
                                width: '100%',
                                padding: '2px',
                                fontWeight: '100'
                            }}
                            key={`${fxG.label.replace(' ', '_')}_fx_accordion_label`}
                        >
                            {fxG.label}
                        </Typography>
                    </AccordionSummary>

                    <AccordionDetails
                        key={`${fxG.label.replace(' ', '_')}_fx_accordion_details`}
                        sx={{
                            paddingTop: '0px',
                            paddingBottom: '0px',
                            margin: '0px',
                        }}
                    >
                        <Typography sx={{ margin: '0px', display: 'flex', flexDirection: 'column' }} key={`${fxG.label.replace(' ', '_')}_fx_accordion_fx_dropdown`}>
                            {fxG.effects.map((fxE: any) => {
                                const isChecked = checkedFXList.indexOf(fxE.effectVar) !== -1;
                                return (
                                    <FormControlLabel
                                        key={`${fxE.effectLabel.replace(' ', '_')}_fx_checkbox`}
                                        onChange={(e) => handleFXGroupChange(e, setCheckedEffectsListHook)}
                                        control={
                                            <Checkbox
                                                checked={isChecked}
                                                id={fxE.effectLabel.replace(' ', '_')}
                                                onChange={updateCheckedFXList}
                                            />
                                        }
                                        label={fxE.effectLabel || ''}
                                        value={fxE.effectVar || ''}
                                        sx={{
                                            color: 'rgba(228,225,209,1)',
                                            fill: 'rgba(228,225,209,1)',
                                        }}
                                    />
                                );
                            })}
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </>
    );
}
