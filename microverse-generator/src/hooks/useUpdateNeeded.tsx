import { useCallback, useState } from "react";

const useUpdatedNeeded = () => {
    const [updated, setUpdated] = useState<boolean>(false);
  
    const markUpdated: any = useCallback(() => {
      setUpdated((prev) => !prev);  // Toggle to track changes
    }, []);
  
    return [updated, markUpdated];
};
export default useUpdatedNeeded;