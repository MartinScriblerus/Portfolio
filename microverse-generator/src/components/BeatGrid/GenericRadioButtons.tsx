import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

type GenericRadioProps = {
    label: string;
    options: any[]; 
    callback: (msg: any) => void;
}

export default function GenericRadioButtons(props: GenericRadioProps) {
    const { label, options, callback } = props;
  return (
    <FormControl sx={{
        display: "inline-flex",
        flexDirection: "column",
        whiteSpace: "nowrap",
        width: "100%"
    }}>
      <FormLabel
        sx={{
          color: 'rgba(245,245,245,0.78)',
          fontSize: '11px',
          paddingLeft: '8px',
          paddingRight: '8px',
          width: "100%",
        }}
        id="scale-direction-select-label"
      >Scale Direction</FormLabel>
      <RadioGroup
        aria-labelledby="demo-radio-buttons-group-label"
        defaultValue="asc"
        name="radio-buttons-group"
        sx={{
            display: "block",
            flexDirection: "row",
            alignItems: "left",
            justifyContent: "center",
            gap: 1,
            paddingLeft: "8px",
            paddingRight: "2px",
            fontSize: '11px',
            width: "calc(100% - 16px)",
        }}
      >
        {options && options.length > 0 && options.map((option, index) => (
        <FormControlLabel 
            key={`${label}_${option}_radio_btn_${index}`}
            value={`${option}`} 
            onChange={(option) => callback(option)} 
            control={<Radio />} 
            label={`${option}`} 
        />))
        }
      </RadioGroup>
    </FormControl>
  );
}