import React from 'react';
import FixedOptionsDropdown from './OldFixedOptionsSelect';

interface Props {
    updateStkKnobs: any
    stkValues: any[];
    setStkValues: React.Dispatch<React.SetStateAction<any>>;
}

const STKManagerDropdown = (
    props : Props
) => {
    const {updateStkKnobs, stkValues, setStkValues} = props;
    return (
        <FixedOptionsDropdown 
            updateStkKnobs={
                (e: any) => updateStkKnobs(e)
            } 
            stkValues={stkValues} 
            setStkValues={setStkValues} 
        />

    )
}
export default STKManagerDropdown;