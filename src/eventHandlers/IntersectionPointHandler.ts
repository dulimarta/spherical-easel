import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { IntersectionReturnType, SEOneOrTwoDimensional } from "@/types";
import { CommandGroup } from "@/commands/CommandGroup";
import EventBus from "./EventBus";
import { SEPoint } from "@/models/SEPoint";
import { SEEllipse } from "@/models/SEEllipse";

import { SEStore } from "@/store";
import { intersectTwoObjects } from "@/utils/intersections";
import { SEParametric } from "@/models/SEParametric";
export default class IntersectionPointHandler extends Highlighter {
  /**
   * The two objects to intersect
   */
  private oneDimensional1: SEOneOrTwoDimensional | null = null;
  private oneDimensional2: SEOneOrTwoDimensional | null = null;
  /**
   * An array to hold updated information about the intersection points so we can properly
   * convert the existing intersection points to isUserCreated = true
   */
  private updatedIntersectionInfo: IntersectionReturnType[] = [];

  /**
   * The prefix of the name so we can search for all intersection points for this prefix and return all
   * of the intersection points of the two one-dimensional objects
   */
  // private intersectionPointParentNames = "";

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select the objects to intersect
    if (this.isOnSphere) {
      // If the user clicks on an intersection create that intersection point (i.e. convert to user created)
      if (this.hitSEPoints.length > 0) {
        if (
          this.hitSEPoints[0] instanceof SEIntersectionPoint &&
          !(this.hitSEPoints[0] as SEIntersectionPoint).isUserCreated
        ) {
          //Make it user created and turn on the display
          new ConvertInterPtToUserCreatedCommand(
            this.hitSEPoints[0] as SEIntersectionPoint
          ).execute();
          return;
        }
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
          this.oneDimensional1.selected = true;
          EventBus.fire("show-alert", {
            key: `handlers.intersectionOneDimensionalSelected`,
            keyOptions: { name: `${this.oneDimensional1.name}` },
            type: "info"
          });
        }
      } else if (this.oneDimensional2 == null) {
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
        if (this.oneDimensional2 !== null) {
          if (this.oneDimensional1.id !== this.oneDimensional2.id) {
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
        this.oneDimensional1.selected = false;
        this.oneDimensional1 = null;
        this.oneDimensional2.selected = false;
        this.oneDimensional2 = null;
        this.updatedIntersectionInfo.clear();
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);

    // Only non-user created points can be created so only highlight those.
    // but then the user can select two one dimensional parents to intersect
    if (this.hitSEPoints.length > 0 && this.oneDimensional1 === null) {
      // never highlight user created intersection points
      const filtered = this.hitSEPoints.filter(
        (p: SEPoint) => p instanceof SEIntersectionPoint && !p.isUserCreated
      );
      if (filtered.length > 0) filtered[0].glowing = true;
    } else if (this.hitSESegments.length > 0) {
      if (this.oneDimensional1 !== null) {
        if (
          SEStore.findIntersectionPointsByParent(
            this.oneDimensional1.name,
            this.hitSESegments[0].name
          ).some(pt => pt.exists && !pt.isUserCreated)
        ) {
          this.hitSESegments[0].glowing = true;
        }
      } else {
        this.hitSESegments[0].glowing = true;
      }
    } else if (this.hitSELines.length > 0) {
      if (this.oneDimensional1 !== null) {
        if (
          SEStore.findIntersectionPointsByParent(
            this.oneDimensional1.name,
            this.hitSELines[0].name
          ).some(pt => pt.exists && !pt.isUserCreated)
        ) {
          this.hitSELines[0].glowing = true;
        }
      } else {
        this.hitSELines[0].glowing = true;
      }
    } else if (this.hitSECircles.length > 0) {
      if (this.oneDimensional1 !== null) {
        if (
          SEStore.findIntersectionPointsByParent(
            this.oneDimensional1.name,
            this.hitSECircles[0].name
          ).some(pt => pt.exists && !pt.isUserCreated)
        ) {
          this.hitSECircles[0].glowing = true;
        }
      } else {
        this.hitSECircles[0].glowing = true;
      }
    } else if (this.hitSEEllipses.length > 0) {
      if (this.oneDimensional1 !== null) {
        if (
          SEStore.findIntersectionPointsByParent(
            this.oneDimensional1.name,
            this.hitSEEllipses[0].name
          ).some(pt => pt.exists && !pt.isUserCreated)
        ) {
          this.hitSEEllipses[0].glowing = true;
        }
      } else {
        this.hitSEEllipses[0].glowing = true;
      }
    } else if (this.hitSEParametrics.length > 0) {
      if (this.oneDimensional1 !== null) {
        if (
          SEStore.findIntersectionPointsByParent(
            this.oneDimensional1.name,
            this.hitSEParametrics[0].name
          ).some(pt => pt.exists && !pt.isUserCreated)
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
      this.oneDimensional1.selected = false;
      this.oneDimensional1 = null;
    }
    if (this.oneDimensional2) {
      this.oneDimensional2.selected = false;
      this.oneDimensional2 = null;
    }
  }
  doIntersection(
    oneDimensional1: SEOneOrTwoDimensional,
    oneDimensional2: SEOneOrTwoDimensional
  ): void {
    // Make sure the objects intersect on the screen and only convert those that are actual
    // intersection point showing on the default screen plane.
    //
    // First we have to decide on the order to intersection them in so that the order information of the intersection
    // will be correct.
    //
    // Make sure the SENodules are in the correct order: SELines, SESegments, then SECircles.
    //  That the argument pair to the store.getters.intersectTwoObjects() method is one of:
    //  (SELine,SELine), (SELine,SESegment),  (SELine,SECircle),(SELine,SEEllipse), (SESegment, SESegment),
    //      (SESegment, SECircle), (SESegment, SEEllipse),(SECircle, SECircle),(SECircle, SEEllipse)
    //  If they have the same type put them in alphabetical order.
    if (oneDimensional1 instanceof SELine) {
      // Line line intersection
      if (oneDimensional2 instanceof SELine) {
        if (oneDimensional1.name < oneDimensional2.name) {
          intersectTwoObjects(
            oneDimensional1,
            oneDimensional2
          ).forEach((element: IntersectionReturnType) =>
            this.updatedIntersectionInfo.push(element)
          );
        } else {
          intersectTwoObjects(
            oneDimensional2,
            oneDimensional1
          ).forEach((element: IntersectionReturnType) =>
            this.updatedIntersectionInfo.push(element)
          );
        }
      }
      // Line segment intersection
      if (oneDimensional2 instanceof SESegment) {
        intersectTwoObjects(
          oneDimensional1,
          oneDimensional2
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Line circle intersection
      if (oneDimensional2 instanceof SECircle) {
        intersectTwoObjects(
          oneDimensional1,
          oneDimensional2
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Line ellipse intersection
      if (oneDimensional2 instanceof SEEllipse) {
        intersectTwoObjects(
          oneDimensional1,
          oneDimensional2
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Line parametric intersection
      if (oneDimensional2 instanceof SEParametric) {
        intersectTwoObjects(
          oneDimensional1,
          oneDimensional2
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
    }

    if (oneDimensional1 instanceof SESegment) {
      // Segment line intersection
      if (oneDimensional2 instanceof SELine) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Segment segment intersection
      if (oneDimensional2 instanceof SESegment) {
        if (oneDimensional1.name < oneDimensional2.name) {
          intersectTwoObjects(
            oneDimensional1,
            oneDimensional2
          ).forEach((element: IntersectionReturnType) =>
            this.updatedIntersectionInfo.push(element)
          );
        } else {
          intersectTwoObjects(
            oneDimensional2,
            oneDimensional1
          ).forEach((element: IntersectionReturnType) =>
            this.updatedIntersectionInfo.push(element)
          );
        }
      }
      // Segment circle intersection
      if (oneDimensional2 instanceof SECircle) {
        intersectTwoObjects(
          oneDimensional1,
          oneDimensional2
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Segment ellipse intersection
      if (oneDimensional2 instanceof SEEllipse) {
        intersectTwoObjects(
          oneDimensional1,
          oneDimensional2
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Segment parametric intersection
      if (oneDimensional2 instanceof SEParametric) {
        intersectTwoObjects(
          oneDimensional1,
          oneDimensional2
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
    }

    if (oneDimensional1 instanceof SECircle) {
      // Circle line intersection
      if (oneDimensional2 instanceof SELine) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Circle segment intersection
      if (oneDimensional2 instanceof SESegment) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Circle circle intersection
      if (oneDimensional2 instanceof SECircle) {
        if (oneDimensional1.name < oneDimensional2.name) {
          intersectTwoObjects(
            oneDimensional1,
            oneDimensional2
          ).forEach((element: IntersectionReturnType) =>
            this.updatedIntersectionInfo.push(element)
          );
        } else {
          intersectTwoObjects(
            oneDimensional2,
            oneDimensional1
          ).forEach((element: IntersectionReturnType) =>
            this.updatedIntersectionInfo.push(element)
          );
        }
      }

      // Circle ellipse intersection
      if (oneDimensional2 instanceof SEEllipse) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Circle parametric intersection
      if (oneDimensional2 instanceof SEParametric) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
    }

    if (oneDimensional1 instanceof SEEllipse) {
      // Ellipse line intersection
      if (oneDimensional2 instanceof SELine) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Ellipse segment intersection
      if (oneDimensional2 instanceof SESegment) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Ellipse circle intersection
      if (oneDimensional2 instanceof SECircle) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }

      // Ellipse ellipse intersection
      if (oneDimensional2 instanceof SEEllipse) {
        if (oneDimensional1.name < oneDimensional2.name) {
          intersectTwoObjects(
            oneDimensional1,
            oneDimensional2
          ).forEach((element: IntersectionReturnType) =>
            this.updatedIntersectionInfo.push(element)
          );
        } else {
          intersectTwoObjects(
            oneDimensional2,
            oneDimensional1
          ).forEach((element: IntersectionReturnType) =>
            this.updatedIntersectionInfo.push(element)
          );
        }
      }
      // Ellipse parametric intersection
      if (oneDimensional2 instanceof SEParametric) {
        intersectTwoObjects(
          oneDimensional1,
          oneDimensional2
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
    }

    if (oneDimensional1 instanceof SEParametric) {
      // Parametric line intersection
      if (oneDimensional2 instanceof SELine) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Parametric segment intersection
      if (oneDimensional2 instanceof SESegment) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Parametric circle intersection
      if (oneDimensional2 instanceof SECircle) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }
      // Parametric ellipse intersection
      if (oneDimensional2 instanceof SEEllipse) {
        intersectTwoObjects(
          oneDimensional2,
          oneDimensional1
        ).forEach((element: IntersectionReturnType) =>
          this.updatedIntersectionInfo.push(element)
        );
      }

      // Parametric parametric intersection
      if (oneDimensional2 instanceof SEParametric) {
        if (oneDimensional1.name < oneDimensional2.name) {
          intersectTwoObjects(
            oneDimensional1,
            oneDimensional2
          ).forEach((element: IntersectionReturnType) =>
            this.updatedIntersectionInfo.push(element)
          );
        } else {
          intersectTwoObjects(
            oneDimensional2,
            oneDimensional1
          ).forEach((element: IntersectionReturnType) =>
            this.updatedIntersectionInfo.push(element)
          );
        }
      }
    }

    // Find the intersection point(s) and convert them to created
    // Make sure parent names are in alpha order so we can find the already created intersection point
    // We don't know how many point of intersection there are so we are missing the ",<order num>)"
    // part of the name, so this is the name prefix

    // if (oneDimensional1.name < oneDimensional2.name) {
    //   this.intersectionPointParentNames = `(${oneDimensional1.name},${oneDimensional2.name}`;
    // } else {
    //   this.intersectionPointParentNames = `(${oneDimensional2.name},${oneDimensional1.name}`;
    // }

    // Get all the SEIntersectionPoints that start with this prefix and convert them to user created points,
    // but only if the point exists on the screen as an actual intersection point.
    const intersectionConversionCommandGroup = new CommandGroup();
    SEStore.findIntersectionPointsByParent(
      oneDimensional1.name,
      oneDimensional2.name
    ).forEach((element: SEIntersectionPoint, index: number) => {
      if (!element.isUserCreated) {
        if (this.updatedIntersectionInfo[index].exists) {
          intersectionConversionCommandGroup.addCommand(
            new ConvertInterPtToUserCreatedCommand(element)
          );
          EventBus.fire("show-alert", {
            key: `handlers.intersectionOneDimensionalPointCreated`,
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
        // warn the user that the selected objects already exists
        EventBus.fire("show-alert", {
          key: `handlers.intersectionOneDimensionalAlreadyExists`,
          keyOptions: {},
          type: "error"
        });
      }
    });
    intersectionConversionCommandGroup.execute();
  }
  activate(): void {
    if (SEStore.selectedSENodules.length == 2) {
      const object1 = SEStore.selectedSENodules[0];
      const object2 = SEStore.selectedSENodules[1];

      if (object1.isOneDimensional() && object2.isOneDimensional()) {
        this.doIntersection(
          object1 as SEOneOrTwoDimensional,
          object2 as SEOneOrTwoDimensional
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
