const nCol = 8;
const nRow = 1;
const patternarr: Array<any> = [];
let counter = 0;
Array.from(Array(7)).forEach(()=>{
  counter += 1;
  patternarr.push(counter);
});


type HeatmapData = { x: string; y: string; value: number }[];

let heatmapData: HeatmapData = [];

for (let x = 0; x < nCol; x++) {
  for (let y = 0; y < nRow; y++) {
    heatmapData.push({
      x: patternarr[x],
      y: patternarr[y],
      value: x % 2 === 0 ? 0 : x,

    });
  }
}

export { heatmapData };
