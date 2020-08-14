import Two from "two.js";
import Highlighter from "./Highlighter";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SENodule } from "@/models/SENodule";
import { AddMeasurementCommand } from "@/commands/AddMeasuremeent";
import { SEAngle } from "@/models/SEAngle";
import EventBus from "@/eventHandlers/EventBus";
enum AngleMode {
  NONE,
  LINES,
  POINTS
}

export default class AngleHandler extends Highlighter {
  /**
   * Points to measure distance
   */
  private targetPoints: SEPoint[] = [];
  private targetLines: (SELine | SESegment)[] = [];
  private mode = AngleMode.NONE;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  private handleNextPoint(candidate: SEPoint) {
    // Check for duplicate points
    const pos = this.targetPoints.findIndex(x => x.id === candidate.id);
    if (pos < 0) {
      this.targetPoints.push(candidate);
    } else
      EventBus.fire("show-alert", {
        text: `Duplicate point. Select another`,
        type: "warning"
      });
  }

  private handleNextLine(candidate: SELine | SESegment) {
    // Check for duplicate lines
    const pos = this.targetLines.findIndex(x => x.id === candidate.id);
    if (pos < 0) {
      this.targetLines.push(candidate);
    } else
      EventBus.fire("show-alert", {
        text: `Duplicate line. Select another`,
        type: "warning"
      });
  }

  mousePressed(event: MouseEvent): void {
    //Select an object to delete
    if (this.isOnSphere) {
      switch (this.mode) {
        case AngleMode.NONE:
          this.targetPoints.clear();
          this.targetLines.clear();
          if (this.hitSEPoints.length > 0) {
            this.mode = AngleMode.POINTS;
            this.targetPoints.push(this.hitSEPoints[0]);
          } else if (this.hitSELines.length > 0) {
            this.mode = AngleMode.LINES;
            this.targetLines.push(this.hitSELines[0]);
          } else if (this.hitSESegments.length > 0) {
            this.mode = AngleMode.LINES;
            this.targetLines.push(this.hitSESegments[0]);
          }
          break;
        case AngleMode.POINTS:
          if (this.hitSEPoints.length > 0) {
            // The user continued to add more points
            this.handleNextPoint(this.hitSEPoints[0]);
          } else if (this.hitSELines.length > 0) {
            // The user change mind from points to lines?
            this.targetPoints.clear();
            this.mode = AngleMode.LINES;
            this.targetLines.push(this.hitSELines[0]);
          } else if (this.hitSESegments.length > 0) {
            // The user change mind from points to lines?
            this.targetPoints.clear();
            this.mode = AngleMode.LINES;
            this.targetLines.push(this.hitSESegments[0]);
          }
          break;
        case AngleMode.LINES:
          if (this.hitSEPoints.length > 0) {
            // The user change mind from linees to points?
            this.targetLines.clear();
            this.mode = AngleMode.POINTS;
            this.targetPoints.push(this.hitSEPoints[0]);
            this.handleNextPoint(this.hitSEPoints[0]);
          } else if (this.hitSELines.length > 0) {
            // The user continued to add more points
            this.handleNextLine(this.hitSELines[0]);
          } else if (this.hitSESegments.length > 0) {
            // The user continued to add more points
            this.handleNextLine(this.hitSESegments[0]);
          }
          break;
      }

      if (this.targetPoints.length === 3) {
        const angleFrom3Points = new SEAngle({
          points: this.targetPoints
        });
        EventBus.fire("show-alert", {
          text: `New angle added`,
          type: "success"
        });
        new AddMeasurementCommand(angleFrom3Points).execute();
        this.mode = AngleMode.NONE;
      } else if (this.targetLines.length === 2) {
        const angleFrom2Lines = new SEAngle({
          lines: this.targetLines
        });
        EventBus.fire("show-alert", {
          text: `New angle ${angleFrom2Lines.name} added`,
          type: "success"
        });
        new AddMeasurementCommand(angleFrom2Lines).execute();
        this.mode = AngleMode.NONE;
      } else {
        let needed = 0;
        switch (this.mode) {
          case AngleMode.POINTS:
            needed = 3 - this.targetPoints.length;
            EventBus.fire("show-alert", {
              text: `Select ${needed} more point(s)`,
              type: "info"
            });
            break;
          case AngleMode.LINES:
            EventBus.fire("show-alert", {
              text: `Select 1 more line`,
              type: "info"
            });
        }
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight all nearby objects and update location vectors
    super.mouseMoved(event);

    // Do not highlight SECircles
    this.hitSENodules
      .filter((n: SENodule) => n instanceof SECircle)
      .map(n => n as SECircle)
      .forEach((p: SECircle) => {
        p.glowing = false;
      });
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the targetSegment in preparation for another deletion.
    this.targetPoints.clear();
    this.targetLines.clear();
    this.mode = AngleMode.NONE;
  }

  activate(): void {
    super.activate();
    this.targetPoints.clear();
    this.targetLines.clear();
  }
  // deactivate(): void {
  // super.deactivate();
  // }
}
