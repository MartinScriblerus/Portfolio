import React from "react";
import { Autocomplete, Box, TextField } from "@mui/material";

type OldKeySelectorProps = {
  value: string;
  onChange: (key: string) => void;
  label?: string;
};

// 12-TET keys using sharps for simplicity; extend if you want flats shown
const KEY_OPTIONS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const OldKeySelector: React.FC<OldKeySelectorProps> = ({ value, onChange, label = "Key" }) => {
  return (
    <Box sx={{ minWidth: 160 }}>
      <Autocomplete
        disableClearable
        size="small"
        options={KEY_OPTIONS}
        value={value}
        onChange={(_, newVal) => onChange(newVal)}
        renderInput={(params) => (
          <TextField {...params} label={label} variant="outlined" />
        )}
      />
    </Box>
  );
};

export default OldKeySelector;
