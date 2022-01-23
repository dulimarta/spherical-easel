import Two from "two.js";
import { Stylable } from "./Styleable";
import { Resizeable } from "./Resizeable";
import SETTINGS from "@/global-settings";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import {
  hslaColorType,
  plottableProperties,
  ProjectedEllipseData,
  CirclePosition
} from "@/types";
import { PositionalAudio, Vector3 } from "three";

export enum DisplayStyle {
  ApplyTemporaryVariables,
  ApplyCurrentVariables
}

const tmpVector = new Vector3();

/**
 * A Nodule consists of one or more TwoJS(SVG) elements
 */
export default abstract class Nodule implements Stylable, Resizeable {
  /**  A list of coordinates of point on the boundary. There are SETTINGS.circle.boundaryPoints such coordinates.*/
  static boundaryCircleVertices: number[][] = [];

  /**
   * The number that control the styling of certain colors and opacities and size if dynamicBackStyling is true
   */
  static globalBackStyleContrast = SETTINGS.style.backStyleContrast;

  /**
   * A map that lets use look up the properties of a plottable object
   * using only the TwoJS id. Useful in the creation of icons when processing the SVG
   * in IconFactory
   */
  public static idPlottableDescriptionMap = new Map<
    string,
    plottableProperties
  >();

  protected styleOptions: Map<StyleEditPanels, StyleOptions> = new Map();
  /**
   * Is this needed when we reset the sphere canvas? I'm not sure yet, so I commented out the calls to it
   * when resetting/loading.
   */
  static resetIdPlottableDescriptionMap(): void {
    Nodule.idPlottableDescriptionMap.clear();
  }

  /**
   * @param unitNormal The unitNormal to the circle in the current view
   * @param radius The radius of the circle 0<radius<pi
   * @returns The data to create the projected ellipse from the circle with center unitNormal and radius radius on the sphere of radius SETTINGS.boundaryCircle.radius
   */
  static projectedCircleData(
    unitNormal: Vector3,
    radius: number
  ): ProjectedEllipseData {
    let centerX: number; // the center of the ellipse
    let centerY: number; // the center of the ellipse
    let tiltAngle: number; // between -Pi/2 and pi/2, the angle between the line containing the major axis (after tilting) and the x axis
    let minorAxis: number; //half the minor diameter parallel to the y axis (prior to tilting)
    let majorAxis: number; //half the major diameter parallel to the x axis (prior to tilting)
    let position: CirclePosition; // contained entirely in front/back or split
    let frontStartAngle: number; // To trace the part of the ellipse that is on the front start with this angle and end with the other.
    let frontEndAngle: number;
    // First check to see if the unit normal is pointing directly at or away from the user, if so then the projection is a circle
    if (
      Math.abs(unitNormal.z - 1) < SETTINGS.tolerance ||
      Math.abs(unitNormal.z + 1) < SETTINGS.tolerance
    ) {
      // All ellipse data is zero except the axes which are the radius of the projected circle.
      minorAxis = Math.sin(radius);
      majorAxis = minorAxis;
      centerX = 0;
      centerY = 0;
      tiltAngle = 0;
      // the projected ellipse is closed and contained entirely on either the front or the back
      frontStartAngle = 0;
      frontEndAngle = 0;
      if (radius < Math.PI / 2) {
        position =
          unitNormal.z > 0
            ? CirclePosition.ContainedEntirelyOnFront
            : CirclePosition.ContainedEntirelyOnBack;
      } else {
        position =
          unitNormal.z > 0
            ? CirclePosition.HoleOnBack
            : CirclePosition.HoleOnFront;
      }
    } else {
      // both unitNormal.x and unitNormal.y can't be zero as unitNormal.z is not one or minus one
      centerX = unitNormal.x * Math.cos(radius);
      centerY = unitNormal.y * Math.cos(radius);
      majorAxis = Math.sin(radius);
      // alpha is the angle between the unitNormal and the positive z axis
      const alpha = Math.acos(unitNormal.z);
      minorAxis = Math.sin(radius) * Math.sin(Math.abs(Math.PI / 2 - alpha)); // Math.abs(Math.PI / 2 - alpha)) is the angle between the unit normal and the plane z=0

      // The tilt axis (i.e. the line containing the major axis) is perpendicular to the projection of the normal vector into the x,y plane (this explains the minus sign)
      tiltAngle =
        Math.abs(unitNormal.y) < SETTINGS.tolerance
          ? Math.PI / 2
          : Math.atan(-unitNormal.x / unitNormal.y);

      // unit normal (=centerVector) is perpendicular to the plane of the circle/line
      // z hat (= (0,0,1)) cross unit normal is perpendicular to the plane containing the z hat and unit normal vectors
      // so
      //     tmpVector = ((0,0,1) cross unit normal) cross unit normal
      // is a vector in the direction of the line of intersection of the
      // two planes.
      tmpVector.set(0, 0, 1).cross(unitNormal).cross(unitNormal).normalize();
      // tmpVector is unit vector parallel to the line of intersection between the plane of the circle and the plane containing  z hat and unit normal
      // To make sure this points in the direction of increasing z, make the tmpVector have a positive z coordinate
      if (tmpVector.z < 0) {
        tmpVector.multiplyScalar(-1);
      }
      // To find the highest point on the circle/line (the one with the largest z value) scale tmpVector by the radius and translate it to the planar center of the circle.
      tmpVector
        .multiplyScalar(Math.sin(radius))
        .addScaledVector(unitNormal, Math.cos(radius));
      // tmpVector is now the highest point on the circle/line

      // Now figure out if the circle intersects the plane z=0
      if (Math.abs(radius - Math.PI / 2) < SETTINGS.tolerance) {
        //the circle is a line and must intersect z=0.
        position = CirclePosition.SplitBetweenFrontAndBack;
        // the normal can point in either direction so it (by itself) is a bad way to figure out the front/positive start/end angel
        // determine a point on the line that projects to the part of the ellipse that should be on the front
        // Pick the highest point, the point on the line that is furthest from the z=0 plane.
        // tmpVector is the highest point on the line, which means that
        // tmpVector.x, tmpVector.y is a point on the ellipse that should correspond to the front
        // this point is either above or below the line at tilt angle to the x axis (y = tan(tiltAngle)*x)
        // if above then front is from 0 to Math.PI, if below front is from Math.PI to 2*Math.PI
        if (Math.tan(tiltAngle) * tmpVector.x < tmpVector.y) {
          // console.log(
          //   "the tmpVector is above the line",
          //   tmpVector.x,
          //   tmpVector.y
          // );
          frontStartAngle = 0;
          frontEndAngle = Math.PI;
        } else {
          // console.log(
          //   "the tmpVector is below the line",
          //   tmpVector.x,
          //   tmpVector.y
          // );
          frontStartAngle = Math.PI;
          frontEndAngle = 2 * Math.PI;
        }
      } // Now handle the circle (non-line) case
      else if (
        (radius < Math.PI / 2 &&
          (alpha + radius < Math.PI / 2 || alpha - radius > Math.PI / 2)) ||
        (radius > Math.PI / 2 &&
          (radius - alpha > Math.PI / 2 ||
            2 * Math.PI - alpha - radius < Math.PI / 2))
      ) {
        // there is no intersection with z=0, to signal this set both the positiveZStart/EndAngle to zero
        // the projected ellipse is closed and contained entirely on either the front or the back
        if (radius < Math.PI / 2) {
          position =
            unitNormal.z > 0
              ? CirclePosition.ContainedEntirelyOnFront
              : CirclePosition.ContainedEntirelyOnBack;
        } else {
          position =
            unitNormal.z > 0
              ? CirclePosition.HoleOnBack
              : CirclePosition.HoleOnFront;
        }

        frontStartAngle = 0;
        frontEndAngle = 0;
      } else {
        // there is an intersection with z=0
        position = CirclePosition.SplitBetweenFrontAndBack;

        // the intersection points are the those between the line x*unitNormal.x+y*unitNormal.y=cos(radius) and x^2 + y^2 =1
        if (Math.abs(unitNormal.y) < SETTINGS.tolerance) {
          //unitNormal.y is zero, but unitNormal.x is not zero (because unitNormal.z is not 1)
          // the intersection points are (X,+/-Y)
          const X = Math.cos(radius) / unitNormal.x;
          const Y = Math.sqrt(1 - X * X);

          // tmpVector is the highest point on the circle so
          // tmpVector.x, tmpVector.y is a point on the ellipse that should correspond to the front
          // in this case, this point is either to the left or right of the line x= centerX
          if (tmpVector.x > centerX) {
            // console.log(
            //   "the tmpVector is right of the vertical line",
            //   tmpVector.x,
            //   tmpVector.y
            // );
            // the ellipse is traced out counterclockwise from above so start at the lower intersection point and head to the upper
            frontStartAngle = (
              Math.atan2(-Y - centerY, X - centerX) - tiltAngle
            ).modTwoPi();
            frontEndAngle = (
              Math.atan2(Y - centerY, X - centerX) - tiltAngle
            ).modTwoPi();
          } else {
            // console.log(
            //   "the tmpVector is left of the vertical the line",
            //   tmpVector.x,
            //   tmpVector.y
            // );
            // the ellipse is traced out counterclockwise from above so start at the upper intersection point and head to the lower
            frontStartAngle = (
              Math.atan2(Y - centerY, X - centerX) - tiltAngle
            ).modTwoPi();
            frontEndAngle = (
              Math.atan2(-Y - centerY, X - centerX) - tiltAngle
            ).modTwoPi();
          }
        } else {
          //unitNormal.y is not zero the intersection points are those between y=mx+b (m =-unitNormal.x/unitNormal.y, b = cos(radius)/unitNormal.y ) and x^2 + y^2 =1
          // (X1,Y1) and (X2,Y2)
          // Make sure that the ellipse is traced counterclockwise when seen from above.
          const m = -unitNormal.x / unitNormal.y;
          const b = Math.cos(radius) / unitNormal.y;
          const X1 = (-m * b - Math.sqrt(m * m - b * b + 1)) / (1 + m * m);
          const X2 = (-m * b + Math.sqrt(m * m - b * b + 1)) / (1 + m * m);
          const Y1 = m * X1 + b;
          const Y2 = m * X2 + b;
          const leftMostAngle = (
            Math.atan2(Y1 - centerY, X1 - centerX) - tiltAngle
          ).modTwoPi();
          const rightMostAngle = (
            Math.atan2(Y2 - centerY, X2 - centerX) - tiltAngle
          ).modTwoPi();
          // tmpVector is the highest point on the circle so
          // tmpVector.x, tmpVector.y is a point on the ellipse that should correspond to the front
          // in this case, this point is either above or below the line y= Math.tan(tiltAngle)(x- centerX)+centerY
          // if above then front is from 0 to Math.PI, if below front is from Math.PI to 2*Math.PI
          if (
            Math.tan(tiltAngle) * (tmpVector.x - centerX) + centerY <
            tmpVector.y
          ) {
            // console.log(
            //   "the tmpVector is above the line",
            //   tmpVector.x,
            //   tmpVector.y
            // );
            frontStartAngle = rightMostAngle;
            frontEndAngle = leftMostAngle;
          } else {
            // console.log(
            //   "the tmpVector is below the line",
            //   tmpVector.x,
            //   tmpVector.y
            // );
            frontStartAngle = leftMostAngle;
            frontEndAngle = rightMostAngle;
          }
        }
      }
    }

    return {
      centerX: centerX * SETTINGS.boundaryCircle.radius,
      centerY: centerY * SETTINGS.boundaryCircle.radius,
      tiltAngle: tiltAngle,
      minorAxis: minorAxis * SETTINGS.boundaryCircle.radius,
      majorAxis: majorAxis * SETTINGS.boundaryCircle.radius,
      position: position,
      frontStartAngle: frontStartAngle,
      frontEndAngle: frontEndAngle
    };
  }
  /**
   *The ellipse is parameterized by x= a cos(t), y = b sin(t) for 0<=t<=2Pi
   * @param a The axis length (half a diameter) along the x axis of the ellipse
   * @param b The axis length (half a diameter) along the y axis of the ellipse
   * @param angle The angle between 0 and 2pi from the positive  x axis
   * Returns the percent of the total ellipse circumference corresponding to angle. That is
   * angle =     0 returns 0
   * angle =  Pi/2 returns 0.25
   * angle =    Pi returns 0.5
   * angle = 3Pi/2 returns 0.75
   * angle =   2Pi returns 1
   * But the return is *NOT* linear in between for example for
   * https://www.desmos.com/calculator/yppxbh45py
   * shows that for a=2, b= 10
   * angle Pi/4 returns about  0.0466842423886
   * NOTE: angle is *NOT* the same as the t parameter!
   */
  static convertEllipseAngleToPercent(
    a: number,
    b: number,
    angle: number
  ): number {
    // Check that angle is between 0 and 2PI
    if (
      angle < -SETTINGS.tolerance ||
      angle >= 2 * Math.PI + SETTINGS.tolerance
    ) {
      console.error("Ellipse Angle is negative or bigger than 2pi");
      return -1;
    }

    // first estimate the total arc length of the ellipse based on Series 2 of
    // https://www.mathsisfun.com/geometry/ellipse-perimeter.html
    const h = ((a - b) * (a - b)) / ((a + b) * (a + b));
    const perimeter =
      Math.PI *
      (a + b) *
      (1 +
        h / 4 +
        (h * h) / 64 +
        (h * h * h) / 256 +
        (25 * h * h * h * h) / 16384 +
        (49 * h * h * h * h * h) / 65536 +
        (441 * h * h * h * h * h * h) / 1048576 +
        (1089 * h * h * h * h * h * h * h) / 4194304);
    // now we have to figure out the arc length along the ellipse from (a,0) to (a*cos(t),b*sin(t))
    // where the angle from the positive x axis to (a*cos(t),b*sin(t)) is angle
    // We can restrict to 0<=angle<= Pi/2 because
    // for pi/2 < angle <= pi the return is 0.5 - convertEllipseAngleToPercent(pi-angle)
    // for pi<angle<=3*pi/2 the return is 0.5+ convertEllipseAngleToPercent(angle -pi)
    // for 3*pi/2 < angle < 2pi the return is 1- convertEllipseAngleToPercent(2*pi-angle)
    //console.log("perimeter", a, b, perimeter);
    let reducedAngle = 0;
    if (0 <= angle && angle <= Math.PI / 2) {
      reducedAngle = angle;
    } else if (Math.PI / 2 < angle && angle <= Math.PI) {
      reducedAngle = Math.PI - angle;
    } else if (Math.PI < angle && angle <= (3 * Math.PI) / 2) {
      reducedAngle = angle - Math.PI;
    } else if ((3 * Math.PI) / 2 < angle && angle <= 2 * Math.PI) {
      reducedAngle = 2 * Math.PI - angle;
    }

    // Now that reduced angle is between 0 and pi/2, find the corresponding t value
    // That is, find t where x= a cos(t), y = b sin(t) for 0<=t<=Pi/2 is at reduced angle to positive x axis
    const tVal = Math.atan((a / b) * Math.tan(reducedAngle));
    //console.log("angle/tVal", reducedAngle, tVal);

    //Now compute the arc length from 0 to tVal of the Ellipse.
    let arcLength = 0;
    //Estimate int_0^tVal sqrt(x'(t)^2+y'(t)^2) dt using Simpson's rule
    const N = 30; // number of divisions, must be even
    const deltaX = tVal / N; // Width of each sub interval
    function f(x: number): number {
      return Math.sqrt(
        a * a * Math.sin(x) * Math.sin(x) + b * b * Math.cos(x) * Math.cos(x)
      );
    }
    arcLength = f(0) + 4 * f(deltaX);
    for (let i = 2; i <= N - 2; i++) {
      arcLength += (2 * (i % 2) + 2) * f(deltaX * i); //i odd coeff is 4, i even coeff is 2
    }
    arcLength += 4 * f(deltaX * (N - 1)) + f(deltaX * N);
    arcLength *= deltaX / 3;

    console.log(
      "a b tVal arclength perimeter",
      a,
      b,
      tVal,
      arcLength,
      perimeter
    );

    let returnPercent = 0;
    if (0 <= angle && angle <= Math.PI / 2) {
      returnPercent = arcLength / perimeter;
    } else if (Math.PI / 2 < angle && angle <= Math.PI) {
      returnPercent = 0.5 - arcLength / perimeter;
    } else if (Math.PI < angle && angle <= (3 * Math.PI) / 2) {
      returnPercent = 0.5 + arcLength / perimeter;
    } else if ((3 * Math.PI) / 2 < angle && angle <= 2 * Math.PI) {
      returnPercent = 1 - arcLength / perimeter;
    }

    return returnPercent;
  }
  /**
   * Add various TwoJS (SVG) elements of this nodule to appropriate layers
   * @param {Two.Group[]} layers
   */
  abstract addToLayers(layers: Two.Group[]): void;

  /**
   * This operation reverses the action performed by addToLayers()
   */
  abstract removeFromLayers(layers?: Two.Group[]): void;

  /**This operation constraint the visual properties (linewidth, circle size, etc) when the view is zoomed in/out */
  abstract adjustSize(): void;

  /** Update visual style(s) */
  abstract normalDisplay(): void;
  abstract glowingDisplay(): void;
  /** set the glowing visual style differently depending on if selected or not */
  abstract setSelectedColoring(flag: boolean): void;

  /** Get the default style state of the Nodule */
  abstract defaultStyleState(mode: StyleEditPanels): StyleOptions;

  /** Set the temporary/glowing/default/updated style*/
  abstract stylize(flag: DisplayStyle): void;

  /** Hide the object if flag = false, set normalDisplay() if flag = true  */
  abstract setVisible(flag: boolean): void;

  /**
   * Update the display of the object called after all the necessary variables have been set so
   * an updated object will be rendered correctly
   */
  abstract updateDisplay(): void;

  static setBackStyleContrast(contrast: number): void {
    this.globalBackStyleContrast = contrast;
  }

  static getBackStyleContrast(): number {
    return this.globalBackStyleContrast;
  }

  /**
   * Get the back contrasting style using the value of globalBackStyleContrast
   * Principle:
   * Contrast = 1 => no difference between front and back
   * Contrast = 0 => Nothing appears on back of sphere for colors and size reduction is maximized
   */
  static contrastFillColor(frontColor: string | undefined): string {
    if (
      Nodule.hlsaIsNoFillOrNoStroke(frontColor) ||
      Nodule.globalBackStyleContrast === 0
    ) {
      return "hsla(0,0%,0%,0)";
    }

    const hslaColor = Nodule.convertStringToHSLAObject(frontColor);
    hslaColor.l = 1 - (1 - hslaColor.l) * Nodule.globalBackStyleContrast;
    return Nodule.convertHSLAObjectToString(hslaColor);
  }

  static contrastStrokeColor(frontColor: string | undefined): string {
    if (
      Nodule.hlsaIsNoFillOrNoStroke(frontColor) ||
      Nodule.globalBackStyleContrast === 0
    ) {
      return "hsla(0,0%,0%,0)";
    }
    const hslaColor = Nodule.convertStringToHSLAObject(frontColor);
    hslaColor.l = 1 - (1 - hslaColor.l) * Nodule.globalBackStyleContrast;
    return Nodule.convertHSLAObjectToString(hslaColor);
  }

  // The back linewidth can be up to 20% smaller than their front counterparts.
  static contrastStrokeWidthPercent(frontPercent: number): number {
    return frontPercent - 20 * Nodule.globalBackStyleContrast;
  }
  // The back points can be up to 20% smaller in radius than their front counterparts.
  static contrastPointRadiusPercent(frontPercent: number): number {
    return frontPercent - 20 * (1 - Nodule.globalBackStyleContrast);
  }
  static contrastTextScalePercent(frontPercent: number): number {
    return frontPercent - 20 * (1 - Nodule.globalBackStyleContrast);
  }
  static convertStringToHSLAObject(
    colorStringOld: string | undefined
  ): hslaColorType {
    if (colorStringOld) {
      //remove the first 5 and last character of the string
      const colorString = colorStringOld.slice(5, -1);
      const numberArray = colorString
        .split(",")
        .map(x => x.replace("%", "").trim()); //remove the percent symbols and the padding spaces
      if (Number(numberArray[3]) <= 0) {
        // If the alpha/opacity value is zero the color picker slider for alpha/opacity disappears and can't be returned
        numberArray[3] = "0";
      }
      return {
        h: Number(numberArray[0]),
        s: Number(numberArray[1]) / 100,
        l: Number(numberArray[2]) / 100,
        a: Number(numberArray[3])
      };
    } else {
      // This should never happen
      throw new Error(`Color string is undefined`);
    }
  }
  static hlsaIsNoFillOrNoStroke(colorStringOld: string | undefined): boolean {
    if (colorStringOld) {
      const hsla = Nodule.convertStringToHSLAObject(colorStringOld);
      return Math.max(hsla.h, hsla.s, hsla.l, hsla.a) < SETTINGS.tolerance;
    } else {
      throw new Error(`Color string is undefined`);
    }
  }
  static convertHSLAObjectToString(colorObject: hslaColorType): string {
    // if (colorObject.a == undefined || colorObject.a == 0) {
    //   // If the alpha/opacity value is zero the color picker slider for alpha/opacity disappears and can't be returned
    //   colorObject.a = 0.001;
    //   //this.displayOpacityZeroMessage = true;
    // }
    return (
      "hsla(" +
      colorObject.h +
      ", " +
      colorObject.s * 100 +
      "%, " +
      colorObject.l * 100 +
      "%, " +
      colorObject.a +
      ")"
    );
  }

  /** Get the current style state of the Nodule */
  currentStyleState(mode: StyleEditPanels): StyleOptions {
    return this.styleOptions.get(mode) ?? {};
  }
  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * Two.js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(mode: StyleEditPanels, options: StyleOptions): void {
    // console.debug("Update style of plottable", this, "using", options);
    const currentOptions = this.styleOptions.get(mode);
    // console.log(
    //   "mode",
    //   mode,
    //   "options",
    //   options,
    //   "current options",
    //   currentOptions
    // );
    this.styleOptions.set(mode, { ...currentOptions, ...options });
    // console.log("style options", this.styleOptions);
    // Now apply the style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
  }
}
