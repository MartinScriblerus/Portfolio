import * as React from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { Box } from '@mui/material';

type NoteBuilderToggleProps = {
    noteBuilderFocus: string;
    handleNoteBuilderToggle: (e: any) => void;
}

export default function NoteBuilderToggle(props: NoteBuilderToggleProps) {
  const {noteBuilderFocus, handleNoteBuilderToggle} = props;
  const [alignment, setAlignment] = React.useState('Scale');

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string,
  ) => {
    console.log("new alignment: ", newAlignment);
    setAlignment(newAlignment);
    handleNoteBuilderToggle(newAlignment);
  };

  return (
    <Box sx={{
        width: '100%',
        justifyContent: 'center',
        display: 'flex',
        background: 'rgba(255,255,255,0.078)',
        flexDirection: 'row',
        alignItems: 'center',
        // padding: '8px',
        paddingBottom: '4px',
    }}>
        <ToggleButtonGroup
            id="toggleNoteBuilderGroup"
            key={`toggleNoteBuilderWrapper_${noteBuilderFocus}`}
            sx={{
              maxHeight: "32px",
              background: "green",
              color: 'rgba(255,255,255,0.78)'
            }}
            value={alignment}
            exclusive
            onChange={handleChange}
            aria-label="Note Builder Options"
        >
        {['Notes', 'Sampler', 'Analysis', 'MIDI'].map((option: string, idx: number) => {
            return <ToggleButton 
                key={`toggleWrapper_${idx}`}
                className={`option-button-source-toggle`}
                sx={{
                  background: '#eee',
                }}
                value={`${option}`}>
                {
                  option.includes('Analysis') ? 'Analysis' : 
                  option.includes('Notes') ? 'Notes' :
                  option.includes('Sampler') ? 'Sampler' : 
                  option.includes('MIDI') ? 'MIDI' : option
                }
                </ToggleButton>
            })
        }
        </ToggleButtonGroup>
    </Box>
  );
}