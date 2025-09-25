import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models-spherical/SEIntersectionPoint";
import { IntersectionReturnType, SEOneDimensional } from "@/types";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import EventBus from "./EventBus";
import { SEPoint } from "@/models-spherical/SEPoint";
import { intersectTwoObjects } from "@/utils/intersections";
//import Two from "two.js";
import { Group } from "two.js/src/group";
import { rank_of_type } from "@/utils/helpingfunctions";
import { SEAntipodalPoint } from "@/models-spherical/SEAntipodalPoint";
import { SetPointUserCreatedValueCommand } from "@/commands-spherical/SetPointUserCreatedValueCommand";
import { SetNoduleDisplayCommand } from "@/commands-spherical/SetNoduleDisplayCommand";
export default class IntersectionPointHandler extends Highlighter {
  /**
   * The two objects to intersect
   */
  private oneDimensional1: SEOneDimensional | null = null;
  private oneDimensional2: SEOneDimensional | null = null;

  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: SEPoint[] = [];

  constructor(layers: Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select the objects to intersect
    if (this.isOnSphere) {
      // If the user clicks on an intersection create that intersection or antipodal point then convert it to user created.
      this.updateFilteredPointsList();
      if (
        this.filteredIntersectionPointsList.length > 0 &&
        this.oneDimensional1 == null
      ) {
        //Make it user created and turn on the display
        new SetPointUserCreatedValueCommand(
          this.filteredIntersectionPointsList[0] as SEIntersectionPoint,
          true
        ).execute();
        return;
      }
      // Fill the first oneDimensional object
      if (this.oneDimensional1 == null) {
        if (this.hitSESegments.length > 0) {
          this.oneDimensional1 = this.hitSESegments[0];
        } else if (this.hitSELines.length > 0) {
          this.oneDimensional1 = this.hitSELines[0];
        } else if (this.hitSECircles.length > 0) {
          this.oneDimensional1 = this.hitSECircles[0];
        } else if (this.hitSEEllipses.length > 0) {
          this.oneDimensional1 = this.hitSEEllipses[0];
        } else if (this.hitSEParametrics.length > 0) {
          this.oneDimensional1 = this.hitSEParametrics[0];
        }
        if (this.oneDimensional1 !== null) {
          this.oneDimensional1.glowing = true;
          this.oneDimensional1.selected = true;
          EventBus.fire("show-alert", {
            key: `intersectionOneDimensionalSelected`,
            keyOptions: {
              name: `${this.oneDimensional1.label?.ref.shortUserName}`
            },
            type: "info"
          });
        }
        // console.log(
        //   "IPHandler::mousePressed One dimensional1 =",
        //   this.oneDimensional1?.name
        // );
      }
      // console.debug("IPHandler::mousePressed One dimensional1 =", this.oneDimensional1)
      else if (this.oneDimensional2 == null) {
        // Fill the second oneDimensional object
        if (this.hitSESegments.length > 0) {
          this.oneDimensional2 = this.hitSESegments[0];
        } else if (this.hitSELines.length > 0) {
          this.oneDimensional2 = this.hitSELines[0];
        } else if (this.hitSECircles.length > 0) {
          this.oneDimensional2 = this.hitSECircles[0];
        } else if (this.hitSEEllipses.length > 0) {
          this.oneDimensional2 = this.hitSEEllipses[0];
        } else if (this.hitSEParametrics.length > 0) {
          this.oneDimensional2 = this.hitSEParametrics[0];
        }
        // console.log(
        //   "IPHandler::mousePressed One dimensional2 =",
        //   this.oneDimensional2?.name
        // );
        if (this.oneDimensional2 !== null) {
          if (this.oneDimensional1.id !== this.oneDimensional2.id) {
            this.oneDimensional2.glowing = true;
            this.oneDimensional2.selected = true;
          } else {
            this.oneDimensional2 = null;
            EventBus.fire("show-alert", {
              key: `handlers.intersectionOneDimensionalDuplicate`,
              keyOptions: {},
              type: "error"
            });
          }
        }
      }
      // As soon as both oneDimensional objects are not null do the intersection
      if (this.oneDimensional1 != null && this.oneDimensional2 != null) {
        this.doIntersection(this.oneDimensional1, this.oneDimensional2);
        // Reset the oneDimensional in preparation for another intersection.
        this.oneDimensional1.glowing = false;
        this.oneDimensional1.selected = false;
        this.oneDimensional1 = null;

        this.oneDimensional2.glowing = false;
        this.oneDimensional2.selected = false;
        this.oneDimensional2 = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    // Only non-user created points can be created so only highlight those.
    // but then the user can select two one dimensional parents to intersect
    this.updateFilteredPointsList();
    if (
      this.filteredIntersectionPointsList.length > 0 &&
      this.oneDimensional1 === null
    ) {
      this.filteredIntersectionPointsList[0].glowing = true;
    } else if (this.hitSELines.length > 0) {
      if (this.oneDimensional1 !== null) {
        if (
          IntersectionPointHandler.store
            .findIntersectionPointsByParent(
              this.oneDimensional1.name,
              this.hitSELines[0].name
            )
            .some(pt => pt.exists && !pt.isUserCreated)
        ) {
          this.hitSELines[0].glowing = true;
        }
      } else {
        this.hitSELines[0].glowing = true;
      }
    } else if (this.hitSESegments.length > 0) {
      if (this.oneDimensional1 !== null) {
        if (
          IntersectionPointHandler.store
            .findIntersectionPointsByParent(
              this.oneDimensional1.name,
              this.hitSESegments[0].name
            )
            .some(pt => pt.exists && !pt.isUserCreated)
        ) {
          this.hitSESegments[0].glowing = true;
        }
      } else {
        this.hitSESegments[0].glowing = true;
      }
    } else if (this.hitSECircles.length > 0) {
      if (this.oneDimensional1 !== null) {
        if (
          IntersectionPointHandler.store
            .findIntersectionPointsByParent(
              this.oneDimensional1.name,
              this.hitSECircles[0].name
            )
            .some(pt => pt.exists && !pt.isUserCreated)
        ) {
          this.hitSECircles[0].glowing = true;
        }
      } else {
        this.hitSECircles[0].glowing = true;
      }
    } else if (this.hitSEEllipses.length > 0) {
      if (this.oneDimensional1 !== null) {
        if (
          IntersectionPointHandler.store
            .findIntersectionPointsByParent(
              this.oneDimensional1.name,
              this.hitSEEllipses[0].name
            )
            .some(pt => pt.exists && !pt.isUserCreated)
        ) {
          this.hitSEEllipses[0].glowing = true;
        }
      } else {
        this.hitSEEllipses[0].glowing = true;
      }
    } else if (this.hitSEParametrics.length > 0) {
      if (this.oneDimensional1 !== null) {
        if (
          IntersectionPointHandler.store
            .findIntersectionPointsByParent(
              this.oneDimensional1.name,
              this.hitSEParametrics[0].name
            )
            .some(pt => pt.exists && !pt.isUserCreated)
        ) {
          this.hitSEParametrics[0].glowing = true;
        }
      } else {
        this.hitSEParametrics[0].glowing = true;
      }
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the oneDimensional in preparation for another intersection.
    if (this.oneDimensional1) {
      this.oneDimensional1.glowing = false;
      this.oneDimensional1 = null;
    }
    if (this.oneDimensional2) {
      this.oneDimensional2.glowing = false;
      this.oneDimensional2 = null;
    }
  }

  updateFilteredPointsList(): void {
    this.filteredIntersectionPointsList = this.hitSEPoints.filter(pt => {
      if (pt instanceof SEIntersectionPoint) {
        if (!pt.isUserCreated) {
          if (pt.principleParent1.showing && pt.principleParent2.showing) {
            return true;
          } else {
            return false;
          }
        } else {
          return !pt.showing;
        }
      }
      return false;
    });
  }

  doIntersection(
    oneDimensional1: SEOneDimensional,
    oneDimensional2: SEOneDimensional
  ): void {
    const intersectionConversionCommandGroup = new CommandGroup();
    IntersectionPointHandler.store
      .findIntersectionPointsByParent(
        oneDimensional1.name,
        oneDimensional2.name
      )
      .forEach((element: SEIntersectionPoint, index: number) => {
        if (!element.isUserCreated) {
          if (element.exists) {
            intersectionConversionCommandGroup.addCommand(
              new SetPointUserCreatedValueCommand(element, true)
            );
            EventBus.fire("show-alert", {
              key: `intersectionOneDimensionalPointCreated`,
              keyOptions: {},
              type: "success"
            });
          } else if (index === 0) {
            // only display the error once (for index 0)
            // warn the user that the selected objects don't intersect
            EventBus.fire("show-alert", {
              key: `handlers.intersectionOneDimensionalNotIntersect`,
              keyOptions: {},
              type: "error"
            });
          }
        } else {
          // if the point is not showing, show it
          if (!element.showing) {
            intersectionConversionCommandGroup.addCommand(
              new SetNoduleDisplayCommand(element, true)
            );
          }
        }
      });
    intersectionConversionCommandGroup.execute();
  }

  activate(): void {
    if (IntersectionPointHandler.store.selectedSENodules.length == 2) {
      const object1 = IntersectionPointHandler.store.selectedSENodules[0];
      const object2 = IntersectionPointHandler.store.selectedSENodules[1];

      if (object1.isOneDimensional() && object2.isOneDimensional()) {
        this.doIntersection(
          object1 as SEOneDimensional,
          object2 as SEOneDimensional
        );
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }

  deactivate(): void {
    super.deactivate();
  }
}
