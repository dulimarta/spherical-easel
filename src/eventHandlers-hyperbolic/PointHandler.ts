import { Intersection, Mesh, Scene, Uniform, Vector2, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";
import * as THREE from "three/webgpu";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import {
  createBoundaryCone,
  createPoint,
  createPointAtInfinity,
  createPointAtInfinityTube
} from "@/plottables-hyperbolic/MeshFactory";
import { CustomPointMaterial } from "@/plottables-hyperbolic/MaterialFactory";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
const Z_AXIS = new Vector3(0, 0, 1);

export class PointHandler extends PoseTracker {
  protected tempPoint: Mesh;
  protected tempPointMaterial: CustomPointMaterial;
  protected tempPointAtInfinity: Mesh;
  protected tempPointAtInfinityMaterial: CustomPointMaterial;
  protected tempTube: Mesh;
  protected tempTubeMaterial: CustomPointMaterial;
  protected tempUpperCone: Mesh;
  protected tempLowerCone: Mesh;
  private tempPointInScene = false;
  private tempPointAtInfinityInScene = false;
  private tempPointAtInfinityUpperTubeInScene = false;
  private tempPointAtInfinityLowerTubeInScene = false;
  private somethingIsHit = false;
  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: HEPoint[] = [];
  /**
   * As the user moves the pointer around snap the temporary marker to this object temporarily
   */
  protected snapToObject = null; //fix when HEOneOrTwoDimensional is implemented
  //: HEOneOrTwoDimensional | null = null;

  constructor(scene: Scene) {
    super(scene);
    this.scene = scene;
    this.tempPoint = createPoint();
    this.tempPointMaterial = this.tempPoint.material as CustomPointMaterial;
    this.tempPointAtInfinity = createPointAtInfinity();
    this.tempPointAtInfinityMaterial = this.tempPointAtInfinity
      .material as CustomPointMaterial;
    this.tempTube = createPointAtInfinityTube();
    this.tempTubeMaterial = this.tempTube.material as CustomPointMaterial;
    this.tempLowerCone = createBoundaryCone({ upper: false });
    this.tempUpperCone = createBoundaryCone({ upper: true });
  }
  mousePressed(event: MouseEvent): void {}

  mouseMoved(event: MouseEvent): void {
    // Process the intersection list into HENodules and set the flags
    super.mouseMoved(event);

    this.somethingIsHit =
      PoseTracker.hyperStore.objectIntersections.length > 0 ||
      PoseTracker.hyperStore.surfaceIntersections.length > 0;

    //Uncomments when there are antipodal or intersection points
    //this.updateFilteredPointsList();
    //if (this.filteredIntersectionPointsList.length > 0) {
    if (this.hitHEPoints.length > 0) {
      this.hitHEPoints[0].glowing = true;
      this.snapToObject = null;
    }
    // else if (this.hitHESegments.length > 0) {
    //   this.hitHESegments[0].glowing = true;
    //   this.snapToTemporaryOneDimensional = this.hitHESegments[0];
    // }
    else {
      this.snapToObject = null;
    }

    if (this.somethingIsHit) {
      if (this.snapToObject === null) {
        if (PoseTracker.hyperStore.hyperboloidIsClosestIntersection) {
          if (!this.tempPointInScene) {
            this.tempPointInScene = true;
            this.scene.add(this.tempPoint);
          }
          this.tempPointMaterial.position =
            PoseTracker.hyperStore.surfaceIntersections[0].point;
        } else {
          if (this.tempPointInScene) {
            this.tempPointInScene = false;
            this.scene.remove(this.tempPoint);
          }
        }

        if (PoseTracker.hyperStore.pointAtInfinityStripIsClosestIntersection) {
          if (!this.tempPointAtInfinityInScene) {
            this.tempPointAtInfinityInScene = true;
            this.scene.add(this.tempTube);
            this.scene.add(this.tempPointAtInfinity);
          }
          const location = PoseTracker.hyperStore.surfaceIntersections[0].point;
          const angle = Math.atan2(location.y, location.x);
          const upper = location.z > 0;
          this.tempPointAtInfinityMaterial.upper = upper;
          this.tempPointAtInfinityMaterial.angle = angle;
          this.tempTubeMaterial.upper = upper;
          this.tempTubeMaterial.angle = angle;

          if (!this.tempPointAtInfinityLowerTubeInScene && !upper) {
            this.scene.add(this.tempLowerCone);
            this.tempPointAtInfinityLowerTubeInScene = true;
            this.tempPointAtInfinityUpperTubeInScene = false;
            this.scene.remove(this.tempUpperCone);
          }

          if (!this.tempPointAtInfinityUpperTubeInScene && upper) {
            this.scene.add(this.tempUpperCone);
            this.tempPointAtInfinityUpperTubeInScene = true;
            this.tempPointAtInfinityLowerTubeInScene = false;
            this.scene.remove(this.tempLowerCone);
          }
        } else {
          if (this.tempPointAtInfinityInScene) {
            this.tempPointAtInfinityInScene = false;
            this.tempPointAtInfinityUpperTubeInScene = false;
            this.tempPointAtInfinityLowerTubeInScene = false;
            this.scene.remove(this.tempTube);
            this.scene.remove(this.tempPointAtInfinity);
            this.scene.remove(this.tempLowerCone);
            this.scene.remove(this.tempUpperCone);
          }
        }
      } else {
        // snap to an object
        if (!this.tempPointInScene) {
          this.tempPointInScene = true;
          this.scene.add(this.tempPoint);
        }
        // this.tempPointMaterial.position = this.snapToObject.closestVector(
        //   PoseTracker.hyperStore.surfaceIntersections[0].point
        // );
      }
      // If there is a nearby (possibly user created or not) point turn off the temporary marker
      // if (this.filteredIntersectionPointsList.length > 0) {
      if (this.hitHEPoints.length > 0) {
        if (this.tempPointInScene) {
          // Remove the temporary point
          this.scene.remove(this.tempPoint);
          this.tempPointInScene = false;
          this.snapToObject = null;
        }
      }
    } else {
      // the event is not over the hyperboloid and is not over the point at infinity strip remove all temp objects
      this.removeAllTempObjects();
    }

    //////////////////////////
    // if (this.snapToTemporaryOneDimensional === null) {
    //   this.tempPointMaterial.position =
    //     PoseTracker.hyperStore.surfaceIntersections[0].point;
    // }
    // // else {
    // //   this.startMarker.positionVectorAndDisplay =
    // //     this.snapToTemporaryOneDimensional.closestVector(
    // //       PoseTracker.hyperStore.surfaceIntersections[0].point
    // //     );
    // // }
    // if (PoseTracker.hyperStore.hyperboloidIsClosestIntersection) {
    //   if (!this.tempPointInScene) {
    //     this.tempPointInScene = true;
    //     this.scene.add(this.tempPoint);
    //   }
    // } else if (
    //   PoseTracker.hyperStore.pointAtInfinityStripIsClosestIntersection
    // ) {
    //   if (!this.tempPointAtInfinityInScene) {
    //     this.tempPointAtInfinityInScene = true;
    //     this.scene.add(this.tempTube);
    //     this.scene.add(this.tempPointAtInfinity);
    //   }
    //   const location = PoseTracker.hyperStore.surfaceIntersections[0].point;
    //   const angle = Math.atan2(location.y, location.x);
    //   const upper = location.z > 0;
    //   this.tempPointAtInfinityMaterial.upper = upper;
    //   this.tempPointAtInfinityMaterial.angle = angle;
    //   this.tempTubeMaterial.upper = upper;
    //   this.tempTubeMaterial.angle = angle;

    //   if (
    //     !this.tempPointAtInfinityLowerTubeInScene &&
    //     !this.tempPointAtInfinityLowerTubeInScene
    //   ) {
    //     this.scene.add(upper ? this.tempUpperCone : this.tempLowerCone);
    //     this.scene.remove(upper ? this.tempLowerCone : this.tempUpperCone);
    //   }
    // } else if (
    //   !PoseTracker.hyperStore.hyperboloidIsClosestIntersection &&
    //   !PoseTracker.hyperStore.pointAtInfinityStripIsClosestIntersection &&
    //   this.snapToTemporaryOneDimensional !== null
    // ) {
    //   // the mouse is over an object and a point is glowing or the temp point is snapped to the object
    //   this.removeAllTempObjects();
    // }

    // if (intersectionList[0].object.name.match(/(Sheet)$/)) {
    //   this.tempPointMaterial.position = intersectionList[0].point;
    //   this.scene.add(this.tempPoint);
    // } else if (intersectionList[0].object.name.match(/(Infinity)$/)) {
    //   const location = intersectionList[0].point;
    //   const upper = location.z > 0 ? 1 : 0;
    //   const angle = Math.atan2(location.y, location.x);
    //   this.tempPointAtInfinityMaterial.upper = upper;
    //   this.tempPointAtInfinityMaterial.angle = angle;
    //   this.tempTubeMaterial.upper = upper;
    //   this.tempTubeMaterial.angle = angle;
    //   this.scene.add(this.tempTube);
    //   this.scene.add(this.tempPointAtInfinity);
    //   this.scene.add(upper ? this.tempUpperCone : this.tempLowerCone);
    // }
  }

  mouseReleased(event: MouseEvent): void {
    // throw new Error("Method not implemented.");
  }

  mouseLeave(event: MouseEvent): void {
    this.removeAllTempObjects();
  }

  activate(): void {
    // throw new Error("Method not implemented.");
  }
  deactivate(): void {
    super.deactivate();
  }

  removeAllTempObjects() {
    this.scene.remove(this.tempPoint);
    this.scene.remove(this.tempPointAtInfinity);
    this.scene.remove(this.tempTube);
    this.scene.remove(this.tempUpperCone);
    this.scene.remove(this.tempLowerCone);
    this.tempPointAtInfinityInScene = false;
    this.tempPointAtInfinityLowerTubeInScene = false;
    this.tempPointAtInfinityUpperTubeInScene = false;
    this.tempPointInScene = false;
    this.snapToObject = null;
    this.somethingIsHit = false;
  }

  // updateFilteredPointsList(): void {
  //   this.filteredIntersectionPointsList = this.hitHEPoints.filter(pt => {
  //     if (pt instanceof HEIntersectionPoint) {
  //       if (pt.isUserCreated) {
  //         return false;
  //       } else {
  //         if (pt.principleParent1.showing && pt.principleParent2.showing) {
  //           return true;
  //         } else {
  //           return false;
  //         }
  //       }
  //     } else if (pt instanceof HEAntipodalPoint) {
  //       if (pt.isUserCreated) {
  //         return pt.showing;
  //       } else {
  //         return true;
  //       }
  //     }
  //     return false; // do not suggest to the user they can create another point at an existing point
  //   });
  // }
}
