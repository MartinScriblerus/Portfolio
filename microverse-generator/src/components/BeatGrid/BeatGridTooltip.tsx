// Local copy of InteractionData to avoid coupling to removed OldHeatmap
type InteractionData = {
  xLabel: string;
  yLabel: string;
  xPos: number;
  yPos: number;
  value: number;
  instrument: string;
};
import { useMemo } from "react";

type TooltipProps = {
  interactionData: InteractionData | null;
  width: number;
  height: number;
  masterPatternsHashHook: Record<string, Record<string, any>>;
  isInPatternEditMode: boolean;
};

export const Tooltip = ({ 
  interactionData, 
  width, 
  height, 
  masterPatternsHashHook, 
  isInPatternEditMode
}: TooltipProps) => {

  if (!interactionData) {
    return null;
  }

  // Memoize the subdivisions value to prevent it from changing during hover
  const subdivisionsValue = useMemo(() => {
    const yKey = String(interactionData.yLabel);
    const xKey = String(interactionData.xLabel);
    return masterPatternsHashHook?.[yKey]?.[xKey]?.subdivisions ?? 1;
  }, [interactionData.yLabel, interactionData.xLabel, masterPatternsHashHook]);

  return (
    <div
      style={{
        width,
        height,
        position: "absolute",
        // top: 140,
        top: 240,
        fontFamily: "monospace",
        // left: !isInPatternEditMode ? -80 : 20,
        // zIndex: !isInPatternEditMode ? 9999 : 1,
        left: -220,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "464px",
          //left: interactionData.xPos * .7 : 200 + (parseInt(interactionData.xLabel) * 5),
          // top: interactionData.yPos * 1,
          width: 200,
          top: 40,
          background: "rgba(0, 0, 0, 0.78)",
        }}
      >
        <div>
          <TooltipRow label={"x"} value={interactionData.xLabel} />
          <TooltipRow label={"y"} value={interactionData.yLabel} />
          <TooltipRow label={"subdivisions"} value={String(subdivisionsValue)} />
        </div>
      </div>
    </div>
  );
};

type TooltipRowProps = {
  label: string;
  value: string;
};

const TooltipRow = ({ label, value }: TooltipRowProps) => (
  <div>
    <b>{label}</b>
    <span>: </span>
    <span>{value}</span>
  </div>
);
