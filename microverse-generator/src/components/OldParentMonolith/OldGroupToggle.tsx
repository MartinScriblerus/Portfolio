import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

type GroupToggleProps = {
  label?: string;
  name?: string;
  options: string[];
  handleSourceToggle?: (name: string, val: any) => void;
  callback?: (val: any) => void;
};

export default function GroupToggle(props: GroupToggleProps) {
  const { label, name, options, handleSourceToggle, callback } = props;

  const handle = (e: any) => {
    const v = e?.target?.value;
    if (handleSourceToggle) return handleSourceToggle(v, e);
    if (callback) return callback(v);
  };

  return (
    <FormControl
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        whiteSpace: 'nowrap',
        width: '100%',
      }}
   >
      <FormLabel
        sx={{
          color: 'rgba(245,245,245,0.78)',
          fontSize: '11px',
          paddingLeft: '8px',
          paddingRight: '8px',
          width: '100%',
        }}
        id="group-toggle-label"
      >
        {label || name || 'Options'}
      </FormLabel>
      <RadioGroup
        aria-labelledby="group-toggle-label"
        defaultValue={options?.[0]}
        name="group-toggle-radio-group"
        sx={{
          display: 'block',
          flexDirection: 'row',
          alignItems: 'left',
          justifyContent: 'center',
          gap: 1,
          paddingLeft: '8px',
          paddingRight: '2px',
          fontSize: '11px',
          width: 'calc(100% - 16px)',
        }}
      >
        {options &&
          options.length > 0 &&
          options.map((option, index) => (
            <FormControlLabel
              key={`${label || name}_${option}_radio_btn_${index}`}
              value={`${option}`}
              onChange={handle}
              control={<Radio />}
              label={`${option}`}
            />
          ))}
      </RadioGroup>
    </FormControl>
  );
}