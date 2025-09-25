import SETTINGS from "@/global-settings-spherical";
import { SECircle } from "@/models-spherical/SECircle";
import { SEEllipse } from "@/models-spherical/SEEllipse";
import { SELine } from "@/models-spherical/SELine";
import { SENodule } from "@/models-spherical/SENodule";
import { SEParametric } from "@/models-spherical/SEParametric";
import { SESegment } from "@/models-spherical/SESegment";
import { SEOneDimensional } from "@/types";
import { Vector3 } from "three";

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

// Return the *UNIT* center of the circle passing through three units vectors
// Two of these vectors can be collinear or the same (upto tolerance)
export function getThreeCircleCenter(
  v1: Vector3,
  v2: Vector3,
  v3: Vector3,
  oldLocation?: Vector3
): Vector3 {
  const tempVector1 = new Vector3();
  const tempVector2 = new Vector3();
  const tempVector3 = new Vector3();
  const returnVector = new Vector3();

  if (oldLocation == undefined) {
    oldLocation = new Vector3(0, 0, 1); // sets the old vector to the north pole.
  }

  // if points 1 and 2 are the same the center is the cross of points 1 and 3 that is nearest the old location vector
  if (tempVector1.subVectors(v1, v2).isZero(SETTINGS.tolerance)) {
    tempVector2.crossVectors(v1, v3).normalize();
    // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
    if (tempVector2.dot(oldLocation) < 0) {
      tempVector2.multiplyScalar(-1);
    }
    returnVector.copy(tempVector2);
  }
  // if points 1 and 3 are the same the center is the cross of points 2 and 3 that is nearest the old location vector
  else if (tempVector1.subVectors(v1, v3).isZero(SETTINGS.tolerance)) {
    tempVector2.crossVectors(v2, v3).normalize();
    // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
    if (tempVector2.dot(oldLocation) < 0) {
      tempVector2.multiplyScalar(-1);
    }
    returnVector.copy(tempVector2);
  }
  // if points 2 and 3 are the same the center is the cross of points 1 and 3 that is nearest the old location vector
  else if (tempVector1.subVectors(v2, v3).isZero(SETTINGS.tolerance)) {
    tempVector2.crossVectors(v1, v3).normalize();
    // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
    if (tempVector2.dot(oldLocation) < 0) {
      tempVector2.multiplyScalar(-1);
    }
    returnVector.copy(tempVector2);
  }
  // It is the not the case that any two points are the same
  else {
    // if points 1 and 3 are antipodal then the center is th cross of points 1 and 2 that is closest to the old location
    if (tempVector1.crossVectors(v1, v3).isZero()) {
      tempVector3.crossVectors(v1, v2).normalize();

      // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
      if (tempVector3.dot(oldLocation) < 0) {
        tempVector3.multiplyScalar(-1);
      }
      returnVector.copy(tempVector3);
    }
    // if points 1 and 2 are antipodal then the center is th cross of points 1 and 3 that is closest to the old location
    else if (tempVector1.crossVectors(v1, v2).isZero()) {
      tempVector3.crossVectors(v1, v3).normalize();

      // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
      if (tempVector3.dot(oldLocation) < 0) {
        tempVector3.multiplyScalar(-1);
      }
      returnVector.copy(tempVector3);
    } // if points 2 and 3 are antipodal then the center is th cross of points 1 and 3 that is closest to the old location
    else if (tempVector1.crossVectors(v2, v3).isZero()) {
      tempVector3.crossVectors(v1, v3).normalize();

      // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
      if (tempVector3.dot(oldLocation) < 0) {
        tempVector3.multiplyScalar(-1);
      }
      returnVector.copy(tempVector3);
    }
    // it is not the case that any pair of points are antipodal and it is not thee case that any pair of points are the same
    else {
      tempVector1.subVectors(v1, v3);
      tempVector2.subVectors(v1, v2);
      tempVector3.crossVectors(tempVector1, tempVector2).normalize();

      // if the potential new location vector is more than Pi/2 off from the old, reverse the potential new location
      if (tempVector3.dot(oldLocation) < 0) {
        tempVector3.multiplyScalar(-1);
      }
      returnVector.copy(tempVector3);
    }
  }
  // disallow a three point circle center to be further than pi/2 away from the points defining it.
  if (returnVector.angleTo(v1) > Math.PI / 2 + 0.000001) {
    returnVector.multiplyScalar(-1);
  }

  return returnVector;
}
