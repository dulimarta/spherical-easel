import { SECircle } from "@/models/SECircle";
import { SEEllipse } from "@/models/SEEllipse";
import { SELine } from "@/models/SELine";
import { SENodule } from "@/models/SENodule";
import { SEParametric } from "@/models/SEParametric";
import { SESegment } from "@/models/SESegment";
import { SEOneDimensional } from "@/types";

/**
 * Returns the rank of a one dimensional
 * SELine => 1
 * SESegment => 2
 * SECircle => 3
 * SEEllipse => 4
 * SEParametric => 5
 * @param seOneDimensional
 * @returns
 */
export function rank_of_type(seOneDimensional: SEOneDimensional): number {
  if (seOneDimensional instanceof SELine) return 1;
  if (seOneDimensional instanceof SESegment) return 2;
  if (seOneDimensional instanceof SECircle) return 3;
  if (seOneDimensional instanceof SEEllipse) return 4;
  if (seOneDimensional instanceof SEParametric) return 5;
  return Number.MAX_VALUE;
}

export function getAncestors(startingNodules: SENodule[]): SENodule[] {
  const ancestors: SENodule[] = [...startingNodules];
  let totalParentsToCheck = ancestors.length;
  let parentsChecked = 0;
  while (parentsChecked < totalParentsToCheck) {
    const parent = ancestors[parentsChecked];
    parentsChecked += 1;
    // add all the unique parents of the nodule to the array
    parent.parents.forEach(parent => {
      if (
        !ancestors.some(ancestor => ancestor.id === parent.id) // add only unique ancestors to the array
      ) {
        ancestors.push(parent); //add the unique parent to the end of the array
        totalParentsToCheck += 1;
      }
    });
  }
  return ancestors;
}

export function getDescendants(startingNodules: SENodule[]): SENodule[] {
  const descendants: SENodule[] = [...startingNodules];
  let totalKidsToCheck = descendants.length;
  let kidsChecked = 0;
  while (kidsChecked < totalKidsToCheck) {
    const kid = descendants[kidsChecked];
    kidsChecked += 1;
    // add all the unique Kids of the nodule to the array
    kid.kids.forEach(kid => {
      if (
        !descendants.some(descendant => descendant.id === kid.id) // add only unique descendants to the array
      ) {
        descendants.push(kid); //add the unique kid to the end of the array
        totalKidsToCheck += 1;
      }
    });
  }
  return descendants;
}

export async function mergeIntoImageUrl(
  sourceURLs: Array<string>,
  // fileName: string,
  imageWidth: number,
  imageHeight: number,
  imageFormat: string
): Promise<string> {
  // Reference https://gist.github.com/tatsuyasusukida/1261585e3422da5645a1cbb9cf8813d6
  const offlineCanvas = document.createElement("canvas") as HTMLCanvasElement;
  offlineCanvas.width = imageWidth;
  offlineCanvas.height = imageHeight;
  // offlineCanvas.setAttribute("width", canvasWidth.value.toString());
  // offlineCanvas.setAttribute("height", canvasHeight.value.toString());
  const graphicsCtx = offlineCanvas.getContext("2d");
  const imageExtension = imageFormat.toLowerCase();
  const drawTasks = sourceURLs.map((dataUrl: string): Promise<string> => {
    return new Promise(resolve => {
      const offlineImage = new Image();
      offlineImage.addEventListener("load", () => {
        graphicsCtx?.drawImage(offlineImage, 0, 0, imageWidth, imageHeight);
        // FileSaver.saveAs(offlineCanvas.toDataURL(`image/png`), `hanspreview${index}.png`);
        resolve(dataUrl);
      });
      // Similar to <img :src="dataUrl" /> but programmatically
      offlineImage.src = dataUrl;
    });
  });
  await Promise.all(drawTasks);
  const imgURL = offlineCanvas.toDataURL(`image/${imageExtension}`);

  return imgURL;
}