import CustomAriaLive from './MicrotonesSearch';
import { Tune } from '../tune';


type MicrotonesProps = { 
    tune: Tune;
    currentMicroTonalScale: (option: any) => void;
    updateMicroTonalScale: (option: any) => void;
};


const MicrotonesWrapper = (
    props: MicrotonesProps
) => {
    const { tune, currentMicroTonalScale, updateMicroTonalScale } = props;
    
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            // width: "100%",
        }}>
            <CustomAriaLive 
                tune={tune} 
                currentMicroTonalScale={currentMicroTonalScale}
                updateMicroTonalScale={updateMicroTonalScale}
            />
        </div>
    )
};
export default MicrotonesWrapper;