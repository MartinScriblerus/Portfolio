import React from 'react';
import { format } from '@visx/vendor/d3-format';
import { scaleLinear, scaleOrdinal, scaleThreshold, scaleQuantile } from '@visx/scale';
import { GlyphStar, GlyphWye, GlyphTriangle, GlyphDiamond } from '@visx/glyph';
import {
  Legend,
  LegendLinear,
  LegendQuantile,
  LegendOrdinal,
  LegendSize,
  LegendThreshold,
  LegendItem,
  LegendLabel,
} from '@visx/legend';
import { Box, Button } from '@mui/material';
import BrushChart from './BrushChart';


const oneDecimalFormat = format('.1f');

const sizeScale = scaleLinear<number>({
  domain: [0, 10],
  range: [5, 13],
});

const sizeColorScale = scaleLinear({
  domain: [0, 10],
  range: ['#75fcfc', '#3236b8'],
});


const quantileScale = scaleQuantile({
  domain: [0, 0.15],
  range: ['#eb4d70', '#f19938', '#6ce18b', '#78f6ef', '#9096f8'],
});

const chromaScale = scaleLinear({
    domain: [0, 11],
    range: ['#ed4fbb', '#e9a039'],
});

const thresholdScale = scaleThreshold({
  domain: [0.01, 0.02, 0.04, 0.06, 0.08],
  range: ['#f2f0f7', '#dadaeb', '#bcbddc', '#9e9ac8', '#756bb1', '#54278f'],
});

const ordinalColorScale = scaleOrdinal({
  domain: ['RMS', 'ZCR', 'Energy'],
  range: ['#66d981', '#4899f1', '#7d81f6'],
});

const inputSourceColorScale = scaleOrdinal({
    domain: ['Master', 'Osc', 'STK', 'Sample', 'Audio In'],
    range: ['#F2D249', '#49F284', '#494DF2', '#64659D', '#F53833'],
  });

const spectralColorScale = scaleOrdinal({
    domain: ["Amplitude Spectrum", "Power Spectrum", "Spectral Centroid", "Spectral Flatness", "Spectral Flux", "Spectral Scope", "Spectral Rolloff", "Spectral Spread", "Spectral Skewness", "Spectral Crest", "Chroma"],
    range: ["#65B896","#008BB8","#B89B00","#00B8A9","#00B82D","#0051B8","#0074B8","#B300B8","#7800B8","#B80051"]
})

// const ordinalColor2Scale = scaleOrdinal({
//   domain: ['a', 'b', 'c', 'd'],
//   range: ['#fae856', '#f29b38', '#e64357', '#8386f7'],
// });

// const shapeScale = scaleOrdinal<string, React.FC | React.ReactNode>({
//   domain: ['a', 'b', 'c', 'd', 'e'],
//   range: [
//     <GlyphStar key="a" size={50} top={50 / 6} left={50 / 6} fill="#dd59b8" />,
//     <GlyphWye key="b" size={50} top={50 / 6} left={50 / 6} fill="#de6a9a" />,
//     <GlyphTriangle key="c" size={50} top={50 / 6} left={50 / 6} fill="#de7d7b" />,
//     <GlyphDiamond key="d" size={50} top={50 / 6} left={50 / 6} fill="#df905f" />,
//     () => (
//       <text key="e" fontSize="12" dy="1em" dx=".33em" fill="#e0a346">
//         $
//       </text>
//     ),
//   ],
// });

function LegendHelper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="legend">
      <div className="title">{title}</div>
      {children}
      <style jsx>{`
        .legend {
          line-height: 0.9em;
          color: #efefef;
          font-size: 10px;
          // font-family: arial;
          padding: 10px 10px;
          float: left;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          margin: 5px 5px;
        }
        .title {
          font-size: 12px;
          margin-bottom: 10px;
          font-weight: 100;
        }
      `}</style>
    </div>
  );
}

const legendGlyphSize = 15;

// const handleLegendClicked = (label: any) => {
//      alert(`clicked: ${JSON.stringify(label)}`);
// };

export default function LegendVizx({ 
    events = true, 
    handleLegendClicked, 
    inFileAnalysisMode, 
    handleFileAnalysisMode
 } : { 
    events?: boolean, 
    handleLegendClicked: (label: any) => void, 
    inFileAnalysisMode: boolean, 
    handleFileAnalysisMode: () => void
}) {
  return (
    <div className="legends" style={{
        position: "absolute", 
        padding: "0px",
        // right: "160px",
        textAlign: "center",
        left: '0px',
        // left: '25%',
        // marginLeft: '28px',
        // marginTop: '-36px',
        paddingTop: '42px',
    
        justifyContent: 'center',
        alignItems: 'center',
        width: 'calc(100vw - 140px)',
        height: 'calc(100vh - 13rem)',
    }}>
      {legendGlyphSize && 
      <Box>
        <LegendHelper title="Input Source">
            <LegendOrdinal scale={inputSourceColorScale } labelFormat={(label) => `${label.toUpperCase()}`}>
            {(labels) => (
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                {labels.map((label, i) => (
                    <LegendItem
                    key={`legend-quantile-${i}`}
                    margin="0 5px"
                    onClick={() => {
                        if (events) {
                            handleLegendClicked(label);
                        }
                    }}
                    >
                    <svg width={legendGlyphSize} height={legendGlyphSize} style={{ margin: '2px 0' }}>
                        {/* <rect fill={label.value} width={legendGlyphSize} height={legendGlyphSize} /> */}
                        <circle fill={label.value} r={legendGlyphSize / 2} cx={legendGlyphSize / 2} cy={legendGlyphSize / 2} />
                    </svg>
                    <LegendLabel align="left" margin="0 0 0 4px">
                        {label.text}
                    </LegendLabel>
                    </LegendItem>
                ))}
                </div>
            )}
            </LegendOrdinal>
        </LegendHelper>

        <LegendHelper title="Time Domain Features">
            <LegendOrdinal scale={ordinalColorScale} labelFormat={(label) => `${label.toUpperCase()}`}>
            {(labels) => (
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                {labels.map((label, i) => (
                    <LegendItem
                    key={`legend-quantile-${i}`}
                    margin="0 5px"
                    onClick={() => {
                        if (events) {
                            handleLegendClicked(label);
                        }
                    }}
                    >
                    <svg width={legendGlyphSize} height={legendGlyphSize}>
                        <rect fill={label.value} width={legendGlyphSize} height={legendGlyphSize} />
                    </svg>
                    <LegendLabel align="left" margin="0 0 0 4px">
                        {label.text}
                    </LegendLabel>
                    </LegendItem>
                ))}
                </div>
            )}
            </LegendOrdinal>
        </LegendHelper>

     
        <Box style={{display: 'flex', marginTop: '-36px', flexDirection: 'column'}}>

            <Box style={{display: 'flex',  flexDirection: 'row'}}>
                <LegendHelper title="Chroma">
            <LegendLinear scale={chromaScale}>
              {(labels) =>
                labels.map((label, i) => (
                  <LegendItem
                    key={`legend-${i}`}
                    onClick={() => {
                        if (events) {
                            handleLegendClicked(label);
                        }
                    }}
                  >
                    <svg 
                        width={legendGlyphSize} 
                        height={legendGlyphSize} 
                        style={{
                            margin: '2px 0',
                            pointerEvents: 'auto' 
                        }}>
                      <circle
                        style={{pointerEvents: 'auto'}}
                        fill={label.value}
                        r={legendGlyphSize / 2}
                        cx={legendGlyphSize / 2}
                        cy={legendGlyphSize / 2}
                      />
                    </svg>
                    <LegendLabel align="left" margin="0 4px">
                      {label.text}
                    </LegendLabel>
                  </LegendItem>
                ))
              }
            </LegendLinear>
                </LegendHelper>
                <LegendHelper title="MFCC">
            <LegendQuantile scale={quantileScale}>
              {(labels) =>
                labels.map((label, i) => (
                  <LegendItem
                    key={`legend-${i}`}
                    onClick={() => {
                        if (events) {
                            handleLegendClicked(label);
                        }
                    }}
                  >
                    <svg width={legendGlyphSize} height={legendGlyphSize} style={{ margin: '2px 0' }}>
                      <circle
                        fill={label.value}
                        r={legendGlyphSize / 2}
                        cx={legendGlyphSize / 2}
                        cy={legendGlyphSize / 2}
                      />
                    </svg>
                    <LegendLabel align="left" margin="0 4px">
                      {label.text}
                    </LegendLabel>
                  </LegendItem>
                ))
              }
            </LegendQuantile>
                </LegendHelper>
            </Box>
            <Box sx={{display: "flex", flexDirection: "column"}}>
          <LegendHelper title="Spectral Features">
            <LegendOrdinal scale={spectralColorScale} labelFormat={(label) => `${label.toUpperCase()}`}>
              {(labels) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {labels.map((label, i) => (
                    <LegendItem
                      key={`legend-quantile-${i}`}
                      margin="0 5px"
                      onClick={() => {
                        if (events) {
                            handleLegendClicked(label);
                        }
                      }}
                    >
                      <svg width={legendGlyphSize} height={legendGlyphSize} style={{ margin: '2px 0' }}>
                      <circle
                        fill={label.value}
                        r={legendGlyphSize / 2}
                        cx={legendGlyphSize / 2}
                        cy={legendGlyphSize / 2}
                      />
                    </svg>
                      <LegendLabel align="left" margin="0 0 0 4px">
                        {label.text}
                      </LegendLabel>
                    </LegendItem>
                  ))}
                </div>
              )}
            </LegendOrdinal>
          </LegendHelper>
        </Box>
        </Box>

          <style jsx>{`
            .legends {
              // font-family: arial;
              font-weight: 900;
              border-radius: 14px;
              padding: 24px 24px 24px 32px;
              overflow-y: auto;
              flex-grow: 1;
              max-width: fit-content;
              background: transparent;
            }
            .chart h2 {
              margin-left: 10px;
            }
          `}</style>
        </Box>}
    </div>
  );
}