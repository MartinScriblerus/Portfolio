import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material"

type StepRadioBtnProps = {
    doAutoAssignPatternNumber: number | null;
    handleAssignPatternNumber: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
const StepRadioButtons = (props: StepRadioBtnProps) => {
    const { doAutoAssignPatternNumber, handleAssignPatternNumber } = props;
    return (
                            <FormControl
                              sx={{
                                width: "calc(100% - 16px)",
                              }}
                            >
                              <FormLabel
                                sx={{
                                    color: 'rgba(245,245,245,0.78)',
                                    fontSize: '11px',
                                    paddingLeft: '8px',
                                    paddingRight: '8px',
                                }}
                                id="repeats-select-label"
                              >Sequence Patterns</FormLabel>
                              <RadioGroup
                                aria-labelledby="demo-radio-buttons-group-label"
                                value={doAutoAssignPatternNumber ? doAutoAssignPatternNumber.toString() : "0"}
                                name="radio-buttons-group"
                                onChange={handleAssignPatternNumber}
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  paddingLeft: '8px',
                                }}
                              >
                                <FormControlLabel value="0" control={<Radio />} label="0" />
                                <FormControlLabel value="10" control={<Radio />} label="1" />
                                <FormControlLabel value="1" control={<Radio />} label="2" />
                                <FormControlLabel value="2" control={<Radio />} label="4" />
                                <FormControlLabel value="3" control={<Radio />} label="8" />
                                <FormControlLabel value="4" control={<Radio />} label="16" />
                              </RadioGroup>
                            </FormControl>
    )
};
export default StepRadioButtons;