import React, { useRef, useState, useMemo } from 'react';
import { scaleUtc, scaleTime, scaleLinear, scaleLog, scaleBand, ScaleInput, coerceNumber } from '@visx/scale';
import { Axis, Orientation, SharedAxisProps, AxisScale } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { AnimatedAxis, AnimatedGridRows, AnimatedGridColumns } from '@visx/react-spring';

import appleStock, { AppleStock } from '@visx/mock-data/lib/mocks/appleStock';
import { Brush } from '@visx/brush';
import { Bounds } from '@visx/brush/lib/types';
import BaseBrush, { BaseBrushState, UpdateBrush } from '@visx/brush/lib/BaseBrush';
import { PatternLines } from '@visx/pattern';
import { Group } from '@visx/group';
import { LinearGradient } from '@visx/gradient';
import { max, extent, range } from '@visx/vendor/d3-array';
import { BrushHandleRenderProps } from '@visx/brush/lib/BrushHandle';
import AreaChart from './AreaChart';

// Initialize some variables
let stock = appleStock.slice(1000);
// console.log("STOCK: ", stock);

const brushMargin = { top: 10, bottom: 15, left: 50, right: 20 };
const chartSeparation = 30;
const PATTERN_ID = 'brush_pattern';
const GRADIENT_ID = 'brush_gradient';
export const accentColor = '#f6acc8';
export const background = 'pink';
export const background2 = '#93ced6';
const selectedBrushStyle = {
  fill: `url(#${PATTERN_ID})`,
  stroke: 'white',
};

// accessors
const getDate = (d: AppleStock) => parseFloat(d.date);
const getStockValue = (d: AppleStock) => d.close;

export type BrushProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  compact?: boolean;
  meydaData?: any;
};

function BrushChart({
  compact = false,
  width,
  height,
  margin = {
    top: 6,
    left: 24,
    bottom: 6,
    right: 6,
  },
  meydaData
}: BrushProps) {
  console.log("APPLE STOCK: ", meydaData);
  const brushRef = useRef<BaseBrush | null>(null);
  const [filteredStock, setFilteredStock] = useState<unknown | any>(meydaData.map((i:any) => i));

  const onBrushChange = (domain: Bounds | null) => {

    if (!domain) return;
    const { x0, x1, y0, y1 } = domain;
   
    
    const stockCopy = meydaData.map((i:any) => i).filter((s: AppleStock) => {
      const x = getDate(s);
      const y = getStockValue(s);

      return x > x0 && x < x1 && y > y0 && y < y1;
    });
    setFilteredStock(stockCopy);
  };

  const innerHeight = height - margin.top - margin.bottom;
  const topChartBottomMargin = compact ? chartSeparation / 2 : chartSeparation + 10;
  const topChartHeight = 0.8 * innerHeight - topChartBottomMargin;
  const bottomChartHeight = innerHeight - topChartHeight - chartSeparation;

  // bounds
  const xMax = Math.max(width - margin.left - margin.right, 0);
  const yMax = Math.max(topChartHeight, 0);
  const xBrushMax = Math.max(width - brushMargin.left - brushMargin.right, 0);
  const yBrushMax = Math.max(bottomChartHeight - brushMargin.top - brushMargin.bottom, 0);
  // const getMinMax = (vals: (number | { valueOf(): number })[]) => {
  //   const numericVals = vals.map(coerceNumber);
  //   return [Math.min(...numericVals), Math.max(...numericVals)];
  // };
  // scales
  const dateScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [0, xMax],
        // domain: [0, filteredStock.length] as [number, number],
        domain: extent(filteredStock, getDate) as [number, number],
      }),
    [xMax, filteredStock],
  );
  const stockScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        // domain: [0, max(meydaData, getStockValue) || 0],
        domain: [0, max(meydaData, getStockValue) || 0],
        nice: true,
      }),
    [yMax, meydaData],
  );
  const brushDateScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [0, xBrushMax],
        domain: extent(meydaData.map((i:any) => i), getDate) as [number, number],
        // domain: [0, (meydaData).length] as [number, number],
      }),
    [xBrushMax, meydaData],
  );
  const brushStockScale = useMemo(
    () =>
      scaleLinear({
        range: [yBrushMax, 0],
        domain: [0,max(meydaData, getStockValue) || 0] as [number, number],
        // domain: extent(meydaData, getDate) as [number, number],
        nice: true,
      }),
    [yBrushMax, meydaData],
  );



  const initialBrushPosition = useMemo(
    () => ({
      // start: { x: brushDateScale(meydaData[50]) },
      // end: { x: brushDateScale(meydaData[100]) },
      start: {x: brushDateScale(getDate(meydaData.map((i:any) => i[0])))},
      end: {x: brushDateScale(getDate(meydaData.map((i:any) => i[50])))}
    }),
    [brushDateScale, meydaData],
  );

  // event handlers
  const handleClearClick = () => {
    if (brushRef?.current) {
      setFilteredStock(meydaData.map((i:any) => i));
      brushRef.current.reset();
    }
  };

  const handleResetClick = () => {
    console.log("clicliclicliclick ", brushRef?.current);
    if (brushRef?.current) {
      const updater: UpdateBrush = (prevBrush) => {
        const newExtent = brushRef.current!.getExtent(
          initialBrushPosition.start,
          initialBrushPosition.end,
        );

        const newState: BaseBrushState = {
          ...prevBrush,
          start: { y: newExtent.y0, x: newExtent.x0 },
          end: { y: newExtent.y1, x: newExtent.x1 },
          extent: newExtent,
        };

        return newState;
      };
      brushRef.current.updateBrush(updater);
    }
  };
console.log("HEYA FILT STOCK: ", filteredStock);
  return (
    <div style={{marginLeft: "-0px", paddingTop: "116px"}}>
  {filteredStock && (
    <>
      <svg width={width} height={height}>
        <LinearGradient id={GRADIENT_ID} from={background} to={background2} rotate={45} />
        <rect x={0} y={0} width={width} height={height} fill={`url(#${GRADIENT_ID})`} rx={14} />
        <AreaChart
          hideBottomAxis={compact}
          data={filteredStock || []}
          width={width}
          margin={{ ...margin, bottom: topChartBottomMargin }}
          yMax={yMax}
          xScale={dateScale}
          yScale={stockScale}
          gradientColor={background2}
        />
        <AreaChart
          hideBottomAxis
          hideLeftAxis
          data={meydaData}
          width={width}
          yMax={yBrushMax}
          xScale={brushDateScale}
          yScale={brushStockScale}
          margin={brushMargin}
          top={topChartHeight + topChartBottomMargin + margin.top}
          gradientColor={background2}
        >
          <PatternLines
            id={PATTERN_ID}
            height={8}
            width={8}
            stroke={accentColor}
            strokeWidth={1}
            orientation={['diagonal']}
          />
          {/* <Brush
            xScale={brushDateScale}
            yScale={brushStockScale}
            width={xBrushMax}
            height={yBrushMax}
            margin={brushMargin}
            handleSize={8}
            innerRef={brushRef}
            resizeTriggerAreas={['left', 'right']}
            brushDirection="horizontal"
            initialBrushPosition={initialBrushPosition}
            onChange={onBrushChange}
            onClick={() => setFilteredStock(meydaData.map((i:any) => i))}
            selectedBoxStyle={selectedBrushStyle}
            useWindowMoveEvents
            renderBrushHandle={(props) => <BrushHandle {...props} />}
          /> */}
        </AreaChart>
      </svg>
      {/* <button style={{pointerEvents: "auto", cursor: "pointer"}} onClick={handleClearClick}>Clear</button>&nbsp;
      <button style={{pointerEvents: "auto", cursor: "pointer"}} onClick={handleResetClick}>Reset</button> */}
    </>
  )
}
    </div>
  );
}
// We need to manually offset the handles for them to be rendered at the right position
function BrushHandle({ x, height, isBrushActive }: BrushHandleRenderProps) {
  const pathWidth = 8;
  const pathHeight = 15;
  if (!isBrushActive) {
    return null;
  }
  return (
    <Group left={x + pathWidth / 2} top={(height - pathHeight) / 2}>
      <path
        fill="#f2f2f2"
        d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
        stroke="#999999"
        strokeWidth="1"
        style={{ pointerEvents: "auto", cursor: 'ew-resize' }}
      />
    </Group>
  );
}

export default BrushChart;