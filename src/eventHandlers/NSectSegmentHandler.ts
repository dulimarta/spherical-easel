import EventBus from "@/eventHandlers/EventBus";
import Highlighter from "./Highlighter";
import { NotEqualStencilFunc, Vector3 } from "three";
import { SEStore } from "@/store";
import { SESegment } from "@/models/SESegment";
import { SENSectPoint } from "@/models/SENSectPoint";
import Point from "@/plottables/Point";
import { DisplayStyle } from "@/plottables/Nodule";
import Two from "two.js";
import NonFreePoint from "@/plottables/NonFreePoint";
import { CommandGroup } from "@/commands/CommandGroup";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { AddNSectPointCommand } from "@/commands/AddNSectPointCommand";
// import { SEPoint } from "@/models/SEPoint";
// import { SELine } from "@/models/SELine";
// import { SESegment } from "@/models/SESegment";
export default class NSectSegmentHandler extends Highlighter {
  private selectedNValue = 2;

  private bisectionOnly = false;

  private temporaryPoints: Point[] = []; // indicates to the user where a new points will be created
  private temporaryPointsAdded: boolean[] = []; // indicates if the temporary point has been added.

  private temporarilySelectedSegment: SESegment | null = null;

  private tmpVector = new Vector3();

  constructor(layers: Two.Group[], bisectOnly?: boolean) {
    super(layers);

    // Create and style the temporary antipode/point marking the antipode/point being created
    for (let i = 0; i < 9; i++) {
      this.temporaryPoints.push(new Point());
      this.temporaryPoints[i].stylize(DisplayStyle.ApplyTemporaryVariables);
      SEStore.addTemporaryNodule(this.temporaryPoints[i]);
      this.temporaryPointsAdded.push(false);
    }
    if (bisectOnly === true) {
      this.bisectionOnly = bisectOnly;
    }
    if (!this.bisectionOnly) {
      this.selectedNValue = 3;
    }
  }

  /**
   * This handles the keyboard events
   * the user can specify how many pieces to divide segment into
   * @param keyEvent A keyboard event -- only the digits are interpreted
   */
  keyPressHandler = (keyEvent: KeyboardEvent): void => {
    // This is the only place the selectedNValue can be changed so disable it if bisection is the only thing allowed
    if (this.bisectionOnly) return;
    // console.log(keyEvent.key);

    // revert the selectedNValue back to the default
    // this.selectedNValue = 2;

    if (keyEvent.key.match(/[0-9]/)) {
      const N = Number(keyEvent.key);
      if (N === 1) {
        EventBus.fire("show-alert", {
          key: `handlers.nEqualOneSegmentNSect`,
          keyOptions: {},
          type: "error"
        });
        return;
      }
      if (N === 0) {
        //N=0 is really N=10
        this.selectedNValue = 10;
      } else {
        this.selectedNValue = Number(keyEvent.key);
      }
      this.updateTemporaryPoints();
      EventBus.fire("show-alert", {
        key: `handlers.nSetSegmentNSect`,
        keyOptions: { number: this.selectedNValue },
        type: "success"
      });
    }
  };

  updateTemporaryPoints(): void {
    // add/remove the appropriate temporary objects
    this.temporaryPoints.forEach((tempPt, ind) => {
      if (this.temporarilySelectedSegment !== null) {
        if (ind > this.selectedNValue - 2) {
          // if this temp has been added before remove it
          if (this.temporaryPointsAdded[ind]) {
            tempPt.removeFromLayers();
            this.temporaryPointsAdded[ind] = false;
          }
        } else {
          // add this temp point, but only once
          if (!this.temporaryPointsAdded[ind]) {
            tempPt.addToLayers(this.layers);
            this.temporaryPointsAdded[ind] = true;
          }
          //calculate the location of this point
          const startVector = new Vector3();
          startVector.copy(
            this.temporarilySelectedSegment.startSEPoint.locationVector
          );
          const arcLength = this.temporarilySelectedSegment.arcLength;
          const normalVector = this.temporarilySelectedSegment.normalVector;

          const toAxis = new Vector3();
          toAxis
            .crossVectors(normalVector, startVector)
            .multiplyScalar(arcLength > Math.PI ? -1 : 1)
            .normalize();
          // this point is located at
          // startVector*cos(arcLength * index/N) + toAxis*sin(arcLength * index/N)
          startVector.multiplyScalar(
            Math.cos((arcLength * (ind + 1)) / this.selectedNValue)
          );
          toAxis.multiplyScalar(
            Math.sin((arcLength * (ind + 1)) / this.selectedNValue)
          );
          this.tmpVector.addVectors(startVector, toAxis).normalize();

          // Update the current location in the plottable (also updates display)
          tempPt.positionVector = this.tmpVector;
        }
      }
    });
  }
  mousePressed(event: MouseEvent): void {
    if (!this.isOnSphere) return;

    if (this.hitSESegments.length > 0) {
      const candidateSegment = this.hitSESegments[0];
      if (
        SEStore.sePoints
          .filter(pt => pt instanceof SENSectPoint)
          .map(pt => pt as SENSectPoint)
          .some(pt => {
            return (
              pt.seSegmentParent.name === candidateSegment.name &&
              pt.N === this.selectedNValue
            );
          })
      ) {
        if (this.selectedNValue === 2) {
          EventBus.fire("show-alert", {
            key: `handlers.bisectedSegmentAlready`,
            keyOptions: {
              segment: candidateSegment.name,
              number: this.selectedNValue
            },
            type: "error"
          });
        } else {
          EventBus.fire("show-alert", {
            key: `handlers.nSectedSegmentAlready`,
            keyOptions: {
              segment: candidateSegment.name,
              number: this.selectedNValue
            },
            type: "error"
          });
        }
      } else {
        // create the points
        this.createNSection(candidateSegment);
        // clear the values to prepare for the next N-section
        this.mouseLeave(event);
        if (this.selectedNValue === 2) {
          EventBus.fire("show-alert", {
            key: `handlers.segmentSuccessfullyBisected`,
            keyOptions: {
              segment: candidateSegment.name
            },
            type: "success"
          });
        } else {
          EventBus.fire("show-alert", {
            key: `handlers.segmentSuccessfullyNSected`,
            keyOptions: {
              segment: candidateSegment.name,
              number: this.selectedNValue
            },
            type: "success"
          });
        }
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);

    // glow a segment that hasn't been n-sected before
    if (this.hitSESegments.length > 0) {
      if (
        !SEStore.sePoints
          .filter(pt => pt instanceof SENSectPoint)
          .map(pt => pt as SENSectPoint)
          .some(pt => {
            return (
              pt.seSegmentParent.name === this.hitSESegments[0].name &&
              pt.N === this.selectedNValue
            );
          })
      ) {
        this.hitSESegments[0].glowing = true;
        this.temporarilySelectedSegment = this.hitSESegments[0];
        this.updateTemporaryPoints();
      }
    } else {
      this.mouseLeave(event);
    }
  }

  mouseReleased(event: MouseEvent): void {
    // No code required
  }

  mouseLeave(event: MouseEvent): void {
    // remove all temporary points
    this.temporaryPoints.forEach((tempPt, ind) => {
      tempPt.removeFromLayers();
      this.temporaryPointsAdded[ind] = false;
    });
    // set the temporary segment to null
    this.temporarilySelectedSegment = null;
  }

  activate(): void {
    super.activate();
    window.addEventListener("keypress", this.keyPressHandler);
  }

  deactivate(): void {
    super.deactivate();
    // Remove the listener
    window.removeEventListener("keypress", this.keyPressHandler);
  }

  createNSection(candidateSegment: SESegment): void {
    const nSectingPointsCommandGroup = new CommandGroup();
    const nSectingPointArray: SENSectPoint[] = []; // a list of the new points to be updated at the end of creation
    // Create the N-sectioning points
    const startVector = new Vector3();
    startVector.copy(candidateSegment.startSEPoint.locationVector);
    const arcLength = candidateSegment.arcLength;
    const normalVector = candidateSegment.normalVector;
    const toAxis = new Vector3();
    toAxis
      .crossVectors(normalVector, startVector)
      .multiplyScalar(arcLength > Math.PI ? -1 : 1)
      .normalize();

    for (let i = 1; i < this.selectedNValue; i++) {
      // this point is located at
      // startVector*cos(arcLength * index/N) + toAxis*sin(arcLength * index/N)
      const scaledStartVector = new Vector3();
      scaledStartVector
        .copy(startVector)
        .multiplyScalar(Math.cos((arcLength * i) / this.selectedNValue));

      const scaledToAxis = new Vector3();
      scaledToAxis
        .copy(toAxis)
        .multiplyScalar(Math.sin((arcLength * i) / this.selectedNValue));

      const nSectingPointVector = new Vector3();
      nSectingPointVector.addVectors(scaledStartVector, scaledToAxis).normalize;

      // Make sure that this point doesn't exist already
      const index = SEStore.sePoints.findIndex(pt =>
        this.tmpVector
          .subVectors(pt.locationVector, nSectingPointVector)
          .isZero()
      );
      if (index === -1) {
        const newPoint = new NonFreePoint();
        // Set the display to the default values
        newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
        newPoint.adjustSize();

        // Create the model object for the new point and link them
        const nSectingPoint = new SENSectPoint(
          newPoint,
          candidateSegment,
          i,
          this.selectedNValue
        );

        // Update the current location in the model object
        nSectingPoint.locationVector = nSectingPointVector;

        // Create plottable for the Label
        const newLabel2 = new Label();
        const newSELabel2 = new SELabel(newLabel2, nSectingPoint);
        // Set the initial label location
        this.tmpVector
          .copy(nSectingPoint.locationVector)
          .add(
            new Vector3(
              2 * SETTINGS.point.initialLabelOffset,
              SETTINGS.point.initialLabelOffset,
              0
            )
          )
          .normalize();
        newSELabel2.locationVector = this.tmpVector;

        nSectingPointsCommandGroup.addCommand(
          new AddNSectPointCommand(nSectingPoint, candidateSegment, newSELabel2)
        );
      } else {
        console.log("An n-secting point already exists", i);
      }
    }
    nSectingPointsCommandGroup.execute();
    nSectingPointArray.forEach(nSectingPoint => {
      nSectingPoint.markKidsOutOfDate();
      nSectingPoint.update();
    });
  }
}
