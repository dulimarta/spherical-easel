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
import { SEIntersectionReturnType } from "@/types";
import { AddNSectPointCommand } from "@/commands/AddNSectPointCommand";
import Line from "@/plottables/Line";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SENSectLine } from "@/models/SENSectLine";
import NonFreeLine from "@/plottables/NonFreeLine";
import { SEPoint } from "@/models/SEPoint";
import { AddIntersectionPointCommand } from "@/commands/AddIntersectionPointCommand";
import { AddNSectLineCommand } from "@/commands/AddNSectLineCommand";
// import { SEPoint } from "@/models/SEPoint";
// import { SELine } from "@/models/SELine";
// import { SESegment } from "@/models/SESegment";
export default class NSectAngleHandler extends Highlighter {
  private selectedNValue = 2;

  private bisectionOnly = false;

  private temporaryLines: Line[] = []; // indicates to the user where a new points will be created
  private temporaryLinesAdded: boolean[] = []; // indicates if the temporary point has been added.

  private temporarilySelectedAngle: SEAngleMarker | null = null;

  private tmpVector = new Vector3();

  constructor(layers: Two.Group[], bisectOnly?: boolean) {
    super(layers);

    // Create and style the temporary lines
    for (let i = 0; i < 9; i++) {
      this.temporaryLines.push(new Line());
      this.temporaryLines[i].stylize(DisplayStyle.ApplyTemporaryVariables);
      SEStore.addTemporaryNodule(this.temporaryLines[i]);
      this.temporaryLinesAdded.push(false);
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
          key: `handlers.nEqualOneAngleNSect`,
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
      this.updateTemporaryLines();
      EventBus.fire("show-alert", {
        key: `handlers.nSetAngleNSect`,
        keyOptions: { number: this.selectedNValue },
        type: "success"
      });
    }
  };

  updateTemporaryLines(): void {
    // add/remove the appropriate temporary objects
    this.temporaryLines.forEach((tempLine, ind) => {
      if (this.temporarilySelectedAngle !== null) {
        if (ind > this.selectedNValue - 2) {
          // if this temp has been added before remove it
          if (this.temporaryLinesAdded[ind]) {
            tempLine.removeFromLayers();
            this.temporaryLinesAdded[ind] = false;
          }
        } else {
          // add this temp line, but only once
          if (!this.temporaryLinesAdded[ind]) {
            tempLine.addToLayers(this.layers);
            this.temporaryLinesAdded[ind] = true;
          }
          // Set the normal vector to the line in the plottable object, this setter calls updateDisplay()

          // create the orthonormal frame with the z -axis as this.temporarilySelectedAngle.vertexVector
          const fromVector = new Vector3();
          fromVector.copy(this.temporarilySelectedAngle.startVector);
          fromVector
            .addScaledVector(
              this.temporarilySelectedAngle.vertexVector,
              -1 *
                this.temporarilySelectedAngle.vertexVector.dot(
                  this.temporarilySelectedAngle.startVector
                )
            )
            .normalize();

          const toVector = new Vector3();
          toVector.crossVectors(
            this.temporarilySelectedAngle.vertexVector,
            fromVector
          ).normalize;
          const angle = this.temporarilySelectedAngle.value;

          // The other (end) point on the line is the point at
          // fromVector*cos(angle*(index/N)) + toVector*sin(angle *index/N)
          fromVector.multiplyScalar(
            Math.cos((angle * (ind + 1)) / this.selectedNValue)
          );
          toVector.multiplyScalar(
            Math.sin((angle * (ind + 1)) / this.selectedNValue)
          );

          //update the normal vector
          const tempVector = new Vector3();
          tempVector.addVectors(fromVector, toVector).normalize();
          tempVector
            .crossVectors(
              this.temporarilySelectedAngle.vertexVector,
              tempVector
            )
            .normalize();

          // Set the normal vector in the plottable object (the setter also calls the updateDisplay() method)
          tempLine.normalVector = tempVector;
        }
      }
    });
  }
  mousePressed(event: MouseEvent): void {
    if (!this.isOnSphere) return;

    if (this.hitSEAngleMarkers.length > 0) {
      const candidateAngle = this.hitSEAngleMarkers[0];
      if (
        SEStore.seLines
          .filter(line => line instanceof SENSectLine)
          .map(line => line as SENSectLine)
          .some(line => {
            return (
              line.seAngleParent.name === candidateAngle.name &&
              line.N === this.selectedNValue
            );
          })
      ) {
        if (this.selectedNValue === 2) {
          EventBus.fire("show-alert", {
            key: `handlers.bisectedAngleAlready`,
            keyOptions: {
              angle: candidateAngle.label?.ref.shortUserName,
              number: this.selectedNValue
            },
            type: "error"
          });
        } else {
          EventBus.fire("show-alert", {
            key: `handlers.nSectedAngleAlready`,
            keyOptions: {
              angle: candidateAngle.label?.ref.shortUserName,
              number: this.selectedNValue
            },
            type: "error"
          });
        }
      } else {
        // create the points
        this.createNSection(candidateAngle);
        // clear the values to prepare for the next N-section
        this.mouseLeave(event);
        if (this.selectedNValue === 2) {
          EventBus.fire("show-alert", {
            key: `handlers.angleSuccessfullyBisected`,
            keyOptions: {
              angle: candidateAngle.label?.ref.shortUserName
            },
            type: "success"
          });
        } else {
          EventBus.fire("show-alert", {
            key: `handlers.angleSuccessfullyNSected`,
            keyOptions: {
              angle: candidateAngle.label?.ref.shortUserName,
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

    // glow a angle that hasn't been n-sected before
    if (this.hitSEAngleMarkers.length > 0) {
      if (
        !SEStore.seLines
          .filter(line => line instanceof SENSectLine)
          .map(line => line as SENSectLine)
          .some(line => {
            return (
              line.seAngleParent.name === this.hitSEAngleMarkers[0].name &&
              line.N === this.selectedNValue
            );
          })
      ) {
        this.hitSEAngleMarkers[0].glowing = true;
        this.temporarilySelectedAngle = this.hitSEAngleMarkers[0];
        this.updateTemporaryLines();
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
    this.temporaryLines.forEach((tempLine, ind) => {
      tempLine.removeFromLayers();
      this.temporaryLinesAdded[ind] = false;
    });
    // set the temporary angle to null
    this.temporarilySelectedAngle = null;
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

  createNSection(candidateAngle: SEAngleMarker): void {
    const nSectingLinesCommandGroup = new CommandGroup();
    const nSectingLineArray: SENSectLine[] = []; // a list of the new lines to be updated at the end of creation

    // get the SEPoint at the vertex of the angle marker
    const startSEPoint = SEStore.sePoints.find(pt =>
      this.tmpVector
        .subVectors(pt.locationVector, candidateAngle.vertexVector)
        .isZero()
    );

    // create the orthonormal frame with the z -axis as startSEPoint.locationVector
    const fromVector = new Vector3();
    fromVector.copy(candidateAngle.startVector);
    fromVector
      .addScaledVector(
        candidateAngle.vertexVector,
        -1 * candidateAngle.vertexVector.dot(candidateAngle.startVector)
      )
      .normalize();

    const toVector = new Vector3();
    toVector.crossVectors(candidateAngle.vertexVector, fromVector).normalize;
    const angle = candidateAngle.value;

    if (startSEPoint !== undefined) {
      for (let i = 1; i < this.selectedNValue; i++) {
        // Create the N-sectioning lines

        // The other (end) point on the line is the point at
        // fromVector*cos(angle*(index/N)) + toVector*sin(angle *index/N)
        const scaledFromVector = new Vector3();
        scaledFromVector
          .copy(fromVector)
          .multiplyScalar(Math.cos((angle * i) / this.selectedNValue));

        const scaledToVector = new Vector3();
        scaledToVector
          .copy(toVector)
          .multiplyScalar(Math.sin((angle * i) / this.selectedNValue));

        const endPointVector = new Vector3();
        endPointVector.addVectors(scaledFromVector, scaledToVector).normalize();

        //compute the normal vector
        const normalVector = new Vector3();
        normalVector
          .crossVectors(startSEPoint.locationVector, endPointVector)
          .normalize();

        // make sure that this line doesn't already exist
        const index = SEStore.seLines.findIndex(line =>
          this.tmpVector.subVectors(line.normalVector, normalVector).isZero()
        );
        if (index === -1) {
          // create the endSEPoint on the line, this is *never* displayed and never put into the DAG of SENodules
          const endSEPoint = new SEPoint(new NonFreePoint());
          endSEPoint.showing = false; // this never changes
          endSEPoint.exists = true; // this never changes
          endSEPoint.locationVector = endPointVector; // this gets updated

          // create the plottable line
          const newLine = new NonFreeLine();
          // Set the display to the default values
          newLine.stylize(DisplayStyle.ApplyCurrentVariables);
          newLine.adjustSize();

          // Create the model object for the new point and link them
          const nSectingLine = new SENSectLine(
            newLine,
            startSEPoint,
            normalVector,
            endSEPoint,
            candidateAngle,
            i,
            this.selectedNValue
          );

          // Create plottable for the Label
          const newLabel2 = new Label();
          const newSELabel2 = new SELabel(newLabel2, nSectingLine);
          // Set the initial label location
          this.tmpVector
            .copy(endSEPoint.locationVector)
            .add(
              new Vector3(
                2 * SETTINGS.point.initialLabelOffset,
                SETTINGS.point.initialLabelOffset,
                0
              )
            )
            .normalize();
          newSELabel2.locationVector = this.tmpVector;

          nSectingLinesCommandGroup.addCommand(
            new AddNSectLineCommand(nSectingLine, candidateAngle, newSELabel2)
          );

          // Update the display of the n sect line after creating them all and adding them to the DAG
          nSectingLineArray.push(nSectingLine);

          // Determine all new intersection points and add their creation to the command so it can be undone
          SEStore.createAllIntersectionsWithLine(nSectingLine).forEach(
            (item: SEIntersectionReturnType) => {
              // Create the plottable label
              const newLabel = new Label();
              const newSELabel = new SELabel(
                newLabel,
                item.SEIntersectionPoint
              );
              // Set the initial label location
              this.tmpVector
                .copy(item.SEIntersectionPoint.locationVector)
                .add(
                  new Vector3(
                    2 * SETTINGS.point.initialLabelOffset,
                    SETTINGS.point.initialLabelOffset,
                    0
                  )
                )
                .normalize();
              newSELabel.locationVector = this.tmpVector;

              nSectingLinesCommandGroup.addCommand(
                new AddIntersectionPointCommand(
                  item.SEIntersectionPoint,
                  item.parent1,
                  item.parent2,
                  newSELabel
                )
              );
              item.SEIntersectionPoint.showing = false; // do not display the automatically created intersection points
              newSELabel.showing = false;
            }
          );
        } else {
          console.log("An n-secting line already exists", i);
        }
      }
    }
    nSectingLinesCommandGroup.execute();
    nSectingLineArray.forEach(nSectingPoint => {
      nSectingPoint.markKidsOutOfDate();
      nSectingPoint.update();
    });
  }
}
