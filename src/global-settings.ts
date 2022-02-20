import { ValueDisplayMode, LabelDisplayMode } from "./types";

export const SETTINGS = {
  nearlyAntipodalIdeal: 0.005, // Two unit vectors, U and V, are nearly antipodal or nearly parallel (the) if crossVectors(U,V).isZero(nearlyAntipodalIdeal) is true
  tolerance: 0.00000000001, // Any number less that this tolerance is considered zero
  hideObjectHidesLabel: true, // hiding an object hide the label of that object automatically if this is true
  showObjectShowsLabel: false, // showing an object (via the object tree) automatically shows the label if this is true
  decimalPrecision: 3, // The number decimal places to display when numerically measuring or computing a value
  style: {
    backStyleContrast: 0.5, //The number that controls the automatic setting of the back styling for objects that have dynamicBackStyle set to true.
    maxStrokeWidthPercent: 200, // The maximum percent stroke width different from the scaled for zoom size
    minStrokeWidthPercent: 60, // The minimum percent stroke width different from the scaled for zoom size
    maxPointRadiusPercent: 200, // The maximum percent point radius different from the scaled for zoom size
    minPointRadiusPercent: 60, // The minimum percent point radius different from the scaled for zoom size
    maxAngleMarkerRadiusPercent: 200, // The maximum percent angle marker different from the scaled for zoom size
    minAngleMarkerRadiusPercent: 60, // The minimum percent angle marker different from the scaled for zoom size
    maxGapLengthOrDashLength: 20, // the maximum of the sum of the gap and dash and the endpoint (max value) of the dash range slider
    sliderStepSize: 1, // The step size of the dash pattern selector
    maxLabelTextScalePercent: 200, // The maximum percent text scale different from the scaled for zoom size
    minLabelTextScalePercent: 60, // The minimum percent text scale different from the scaled for zoom size
    /* The possible colors to choose from*/
    swatches: [
      [
        //darkest
        "#000000",
        "#283593",
        "#1565C0",
        "#388E3C",
        "#F9A825",
        "#EF6C00",
        "#C62828",
        "#AD1457",
        "#6A1B9A",
        "#4527A0"
      ],
      [
        "#616161",
        "#3949AB",
        "#1E88E5",
        "#66BB6A",
        "#FDD835",
        "#FB8C00",
        "#E53935",
        "#D81B60",
        "#8E24AA",
        "#5E35B1"
      ],
      [
        "#BDBDBD",
        "#7986CB",
        "#64B5F6",
        "#A5D6A7",
        "#FFF176",
        "#FFB74D",
        "#E57373",
        "#F06292",
        "#BA68C8",
        "#9575CD"
      ],
      [
        //lightest
        "#FFFFFF",
        "#C5CAE9",
        "#BBDEFB",
        "#E8F5E9",
        "#FFF9C4",
        "#FFE0B2",
        "#FFCDD2",
        "#F8BBD0",
        "#E1BEE7",
        "#D1C4E9"
      ]
    ],
    greyedOutSwatches: [
      [
        //grey
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD"
      ],
      [
        //grey
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD"
      ],
      [
        //grey
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD"
      ],
      [
        //grey
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD",
        "#BDBDBD"
      ]
    ],
    selectedColor: {
      front: "hsla(0, 100%, 50%, 0.5)",
      back: "hsla(0, 100%, 50%, 0.3)"
    }
  },
  zoom: {
    maxMagnification: 10, // The greatest zoom in magnification factor
    minMagnification: 0.8, // The least zoom out magnification factor
    percentChange: 10 // The percent that a zoom in or out out click will change the view
  },
  rotate: {
    minAngle: Math.PI / 1000, // the minimum angular distance before a new rotation is computed as we click and drag in rotate mode
    momentum: {
      enabled: true, // If momentum is enabled then the sphere keeps rotating depending after the user has stopped intentionally rotating it.
      decayTime: 3, // Time in seconds for the rotation to stop, max value of 300 seconds (5 minutes).
      framesPerSecond: 30, // The momentum rotation will be updated this many times per second
      pauseTimeToTemporarilyDisableMomentum: 0.25 // if you hold the mousepress this long (in seconds) while dragging the momentum doesn't activate
    }
  },
  fill: {
    //The location of the light source when shading
    lightSource: {
      x: -250 / 3,
      y: 250 / 3
    },
    frontWhite: "hsla(0, 0%, 90%, 0.2)", // The light source location on the front is this shade of gray (white)
    backGray: "hsla(0, 0%, 85%, 0.2)" // The antipode of the light source on the back is this shade of gray
  },
  // #region boundarycircle
  boundaryCircle: {
    radius: 250 /* default radius */,
    numPoints: 50,
    color: "hsla(0, 0%, 0%, 1)",
    lineWidth: 3
  },
  // #endregion boundarycircle
  point: {
    showLabelsOfFreePointsInitially: true, // Should the labels of free points be shown upon creating the point?
    showLabelsOfNonFreePointsInitially: false, // Should the labels of non-free points be shown upon creating the point?
    showLabelsOfPointOnObjectInitially: false, // Should the labels of points on objects be shown upon creating the point?
    showLabelsOfPolarPointInitially: false, // Should the labels of polar points be shown upon creation?
    showLabelsOfParametricEndPointsInitially: true, // Should the labels of the endpoints of a parametric curve be shown upon creating the points?
    readingCoordinatesChangesLabelModeTo: LabelDisplayMode.NameAndValue,
    maxLabelDistance: 0.1, // The maximum distance that a label is allowed to get away from the point
    initialLabelOffset: 0.2, // When making point labels this is initially how far (roughly) they are from the location of the point
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    hitIdealDistance: 0.04, // The user has to be within this distance on the ideal unit sphere to select the point. (must be smaller than line/segment/circle.minArcLength.minimumLength.minRadius)
    //dynamicBackStyle is a flag that means the fill color, and stroke of the points drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The scaling of the points relative to the scaled for zoom default size
    radiusPercent: { front: 100, back: 90 },
    //The properties of the point when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      radius: {
        front: 3.5, // The default radius of the point drawn on the front,
        back: 3 // The default radius of the point drawn on the back,
      },
      fillColor: {
        front: "hsla(0, 100%, 75%, 1)",
        frontHSLA: { h: 0, s: 100, l: 75, a: 1 },
        back: "hsla(0, 100%, 75%, 1)",
        backHSLA: { h: 0, s: 100, l: 75, a: 1 }
      },
      strokeColor: {
        front: "hsla(240, 55%, 55%, 1)",
        back: "hsla(240, 55%, 75%, 1)"
      },
      pointStrokeWidth: { front: 2, back: 2 } // The thickness of the edge of the point when drawn
      // No dashing for points
    },
    // The properties of the annular region around a point when it is glowing
    glowing: {
      annularWidth: 3, // width is the width of the annular region around the point that shows the glow it is always bigger than the drawn radius
      fillColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.71)"
      },
      strokeColor: {
        // is this ever used?
        front: "hsla(0, 100%, 35%, 1)",
        back: "hsla(0, 100%, 45%, 0.7)"
      }
      // No dashing - this is highlighting the object
    },
    //The properties of the point when it is temporarily shown by the point tool while drawing
    temp: {
      // The radius is the same as the default for drawn points
      fillColor: {
        front: "hsla(0, 0%, 50%, 1)",
        back: "hsla(0, 0%, 75%, 1)"
      },
      strokeColor: {
        front: "hsla(0, 0%, 0%, 1)",
        back: "hsla(0, 0%, 50%, 1)"
      }
      // The temp stroke width is the same as the default drawn stroke width
      // No dashing for points
    },
    nonFree: {
      scalePercent: 85, // The percent that the size of the (free) points are scaled by to get the size of the nonFreePoint
      fillColor: {
        front: "hsla(0, 50%, 75%, 1)",
        frontHSLA: { h: 0, s: 50, l: 75, a: 1 },
        back: "hsla(0, 25%, 75%, 1)"
      },
      strokeColor: {
        front: "hsla(240, 30%, 55%, 1)",
        back: "hsla(240, 35%, 75%, 1)"
      },
      pointStrokeWidth: { front: 2, back: 2 } // The thickness of the edge of the point when drawn
      // No dashing for points
    }
  },
  segment: {
    showLabelsInitially: false, // Should the labels be show upon creating the segment
    maxLabelDistance: 0.15, // The maximum distance that a label is allowed to get away from the segment
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    measuringChangesLabelModeTo: LabelDisplayMode.NameAndValue,
    initialValueDisplayMode: ValueDisplayMode.MultipleOfPi, // Set the initial display of the values for the measurement of the angle
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the line
    minimumArcLength: 0.045, // Don't create segments with a length less than this (must be larger than point.hitIdealDistance because if not it is possible to create a line segment of length zero )
    numPoints: 60, // The number of vertices used to render the segment. These are spread over the front and back parts. MAKE THIS EVEN!
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the segment.
    closeEnoughToPi: 0.005, //If the arcLength of a segment is within this distance of pi, consider it length pi, so that it is not defined by its endpoints and can be moved
    //dynamicBackStyle is a flag that means the fill color, and stroke of the segments drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    drawn: {
      // No fill for line segments
      strokeColor: {
        front: "hsla(217, 90%, 61%, 1)",
        back: "hsla(217, 90%, 80%, 1)"
      },
      strokeWidth: {
        front: 2.5,
        back: 2
      }, // The thickness of the segment when drawn,
      dashArray: {
        reverse: { front: true, back: true }, // In the slider to select the dash array should the numbers be reversed so that the dash length can be less than the gap length?
        offset: { front: 0, back: 0 },
        front: [0, 0], // An empty array or [0,0] means no dashing.
        back: [5, 10] // An empty array means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around a segment when it is glowing
    glowing: {
      // No fill for line segments
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.72)"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the segment that shows the glow
      // the dashing pattern is copied from the drawn version
    },
    //The properties of the circle when it is temporarily shown by the segment tool while drawing
    temp: {
      // No fill for line segments
      strokeColor: {
        front: "hsla(0, 0%, 42%, 1)",
        back: "hsla(0, 0%, 71%, 1)"
      }
      // The width is the same as the default drawn version
      // The dashing pattern is copied from the default drawn version
    }
  },
  line: {
    showLabelsInitially: false, // Should the labels be shown upon creating the line
    showLabelsOfNonFreeLinesInitially: false, // Should the labels be shown upon creating the non-free line
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the line
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the line
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    minimumLength: 0.045, // Don't create lines distance between the two defining point with arc length between them smaller than this (must be larger than point.hitIdealDistance because if not it is possible to create a line segment of length zero )
    numPoints: 50, // The number of vertices used to render the line. These are spread over the front and back parts. MAKE THIS EVEN!
    closeEnoughToPi: 0.005, //If the angle from start to end point of this line is within this value of pi, consider it length pi, so that it is not defined by its start/end points and can be moved
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the line.
    //dynamicBackStyle is a flag that means the fill color, and stroke of the lines drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    drawn: {
      // No fill for lines
      strokeColor: {
        front: "hsla(217, 90%, 61%, 1)",
        back: "hsla(217, 90%, 80%, 1)"
      },
      // The thickness of the line when drawn
      strokeWidth: {
        front: 2.5,
        back: 2
      },
      dashArray: {
        reverse: { front: true, back: true }, // In the slider to select the dash array should the numbers be reversed so that the dash length can be less than the gap length?
        offset: { front: 0, back: 0 },
        front: [0, 0], // An empty array or [0,0] means no dashing.
        back: [5, 10] // An empty array means no dashing.
      }
    },
    //The properties of the region around a line when it is glowing
    glowing: {
      // No fill for lines
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.73)"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the line that shows the glow
      // Dashing is the same as the drawn version
    },
    //The properties of the line when it is temporarily shown by the line tool while drawing
    temp: {
      // No fill for lines
      strokeColor: {
        front: "hsla(0, 0%, 42%, 1)",
        back: "hsla(0, 0%, 71%, 1)"
      }
      // The width is the same as the default drawn version
      // Dashing is the same as the default drawn version
    },
    nonFree: {
      // No fill for lines
      strokeColor: {
        front: "hsla(200, 90%, 61%, 1)",
        back: "hsla(200, 90%, 80%, 1)"
      },
      // The thickness reduction of the nonFree line when drawn
      scalePercent: 85, // The percent that the size of the (free) lines are scaled by to get the thickness of the nonFreeLine
      dashArray: {
        reverse: { front: true, back: true }, // In the slider to select the dash array should the numbers be reversed so that the dash length can be less than the gap length?
        offset: { front: 0, back: 0 },
        front: [0, 0], // An empty array or [0,0] means no dashing.
        back: [5, 10] // An empty array means no dashing.
      }
    }
  },
  circle: {
    showLabelsInitially: false, // Should the labels be show upon creating the circle
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the circle
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the circle
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    minimumRadius: 0.045, // Don't create circles with a radius smaller than this or bigger than Pi-this (must be bigger than point.hitIdealDistance to prevent almost zero radius circles at intersection points)
    numPoints: 60, // Twice this number are used to draw the edge of the circle and 4 times this many are used to to draw the fill of the circle. These are spread over the front and back parts. MAKE THIS EVEN!
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the circle.
    //dynamicBackStyle is a flag that means the fill, linewidth, and strokeColor of the circles drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The properties of the circle when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      fillColor: {
        front: "hsla(254, 100%, 90%, 0.2)", //"hsla(217, 100%, 80%, 0.0005)", //"noFill" is "hsla(0,0%,0%,0)"
        frontHSLA: { h: 254, s: 100, l: 90, a: 0.2 },
        back: "hsla(10, 100%, 50%, 0.1)", //"hsla(217, 100%, 80%, 0.0002)" //"noFill" is "hsla(0,0%,0%,0)"
        backHSLA: { h: 254, s: 100, l: 50, a: 0.2 }
      },
      strokeColor: {
        front: "hsla(217, 90%, 61%, 1)",
        back: "hsla(217, 90%, 80%, 1)"
      },
      strokeWidth: {
        // The thickness of the circle when drawn front/back
        front: 2.5,
        back: 2
      }, // The thickness of the circle when drawn front/back,
      dashArray: {
        reverse: { front: true, back: true }, // In the slider to select the dash array should the numbers be reversed so that the dash length can be less than the gap length?
        offset: { front: 0, back: 0 },
        front: [0, 0], // An empty array or [0,0] means no dashing.
        back: [5, 10] // An empty array means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around a circle when it is glowing
    glowing: {
      // There is no fill for highlighting objects
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.74)"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the circle (on each side) that shows the glow
      // The dash pattern will always be the same as the drawn version
    },
    //The properties of the circle when it is temporarily shown by the circle tool while drawing
    temp: {
      fillColor: {
        front: "hsla(0, 0%, 90%, 0.3)", //"noFill" is "hsla(0,0%,0%,0)",
        back: "hsla(0, 0%, 50%, 0.3)" //"noFill" is "hsla(0,0%,0%,0)"
      },
      strokeColor: {
        front: "hsla(0, 0%, 0%, 1.0)",
        back: "hsla(0, 0%, 0%, 0.1)"
      }
      // The width is the same as the default drawn version
      // The dash pattern will always be the same as the default drawn version
    }
  },
  ellipse: {
    showLabelsInitially: false, // Should the labels be show upon creating the ellipse
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the ellipse
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the ellipse
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    minimumAngleSumDifference: 0.01, // Don't create ellipses (and ellipse don't exist) when an angle sum to the foci minus the angle between the foci is smaller than this
    minimumCreationDistance: 0.025, // Don't create an ellipse point unless it is more than this distance away from each focus.
    numPoints: 100, // Twice this number are used to draw the edge of the ellipse and 4 times this many are used to to draw the fill of the ellipse. These are spread over the front and back parts. MAKE THIS EVEN!
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the ellipse.
    //dynamicBackStyle is a flag that means the fill, linewidth, and strokeColor of the ellipses drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The properties of the ellipse when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      fillColor: {
        front: "hsla(254, 100%, 90%, 0.2)", //"hsla(217, 100%, 80%, 0.0005)", //"noFill" is "hsla(0,0%,0%,0)",
        frontHSLA: { h: 254, s: 100, l: 90, a: 0.2 },
        back: "hsla(10, 100%, 50%, 0.1)", //"hsla(217, 100%, 80%, 0.0002)" //"noFill" is "hsla(0,0%,0%,0)"
        backHSLA: { h: 254, s: 100, l: 50, a: 0.1 }
      },
      strokeColor: {
        front: "hsla(217, 90%, 61%, 1)",
        back: "hsla(217, 90%, 80%, 1)"
      },
      strokeWidth: {
        // The thickness of the ellipse when drawn front/back
        front: 2.5,
        back: 2
      }, // The thickness of the ellipse when drawn front/back,
      dashArray: {
        reverse: { front: true, back: true }, // In the slider to select the dash array should the numbers be reversed so that the dash length can be less than the gap length?
        offset: { front: 0, back: 0 },
        front: [0, 0], // An empty array or [0,0] means no dashing.
        back: [5, 10] // An empty array means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around a ellipse when it is glowing
    glowing: {
      // There is no fill for highlighting objects
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.74)"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the ellipse (on each side) that shows the glow
      // The dash pattern will always be the same as the drawn version
    },
    //The properties of the ellipse when it is temporarily shown by the ellipse tool while drawing
    temp: {
      fillColor: {
        front: "hsla(0, 0%, 90%, 0.3)", //"noFill" is "hsla(0,0%,0%,0)",
        back: "hsla(0, 0%, 50%, 0.3)" //"noFill" is "hsla(0,0%,0%,0)"
      },
      strokeColor: {
        front: "hsla(0, 0%, 0%, 1.0)",
        back: "hsla(0, 0%, 0%, 0.1)"
      }
      // The width is the same as the default drawn version
      // The dash pattern will always be the same as the default drawn version
    }
  },
  parametric: {
    showLabelsInitially: false, // Should the labels be show upon creating the parametric curve
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the parametric curve
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the parametric curve
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    minimumAngleSumDifference: 0.0001, // Don't create ellipses (and ellipse don't exist) when an angle sum to the foci minus the angle between the foci is smaller than this
    minimumCreationDistance: 0.025, // Don't create an ellipse point unless it is more than this distance away from each focus.
    numPoints: 30, // This is the anchor density in the rendering the number of anchors is floor(numPoints*arcLength)
    evenSphereSampleSize: 90, // This is the number of almost evenly spaced points on the sphere to sample for the number of perpendiculars and tangents
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the parametric curve.
    //dynamicBackStyle is a flag that means the fill, linewidth, and strokeColor of the parametric curves drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The properties of the parametric curve when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      fillColor: {
        front: "hsla(254, 100%, 90%, 0.2)", //"hsla(217, 100%, 80%, 0.0005)", //"noFill" is "hsla(0,0%,0%,0)",
        back: "hsla(10, 100%, 50%, 0.1)" //"hsla(217, 100%, 80%, 0.0002)" //"noFill" is "hsla(0,0%,0%,0)"
      },
      strokeColor: {
        front: "hsla(217, 90%, 61%, 1)",
        back: "hsla(217, 90%, 80%, 1)"
      },
      strokeWidth: {
        // The thickness of the parametric curve when drawn front/back
        front: 2.5,
        back: 2
      }, // The thickness of the parametric curve when drawn front/back,
      dashArray: {
        reverse: { front: true, back: true }, // In the slider to select the dash array should the numbers be reversed so that the dash length can be less than the gap length?
        offset: { front: 0, back: 0 },
        front: [0, 0], // An empty array or [0,0] means no dashing.
        back: [5, 10] // An empty array means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around a parametric curve when it is glowing
    glowing: {
      // There is no fill for highlighting objects
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.74)"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the parametric curve (on each side) that shows the glow
      // The dash pattern will always be the same as the drawn version
    },
    //The properties of the parametric curve when it is temporarily shown by the parametric curve tool while drawing
    temp: {
      fillColor: {
        front: "hsla(0, 0%, 90%, 0.3)", //"noFill" is "hsla(0,0%,0%,0)",
        back: "hsla(0, 0%, 50%, 0.3)" //"noFill" is "hsla(0,0%,0%,0)"
      },
      strokeColor: {
        front: "hsla(0, 0%, 0%, 1.0)",
        back: "hsla(0, 0%, 0%, 0.1)"
      }
      // The width is the same as the default drawn version
      // The dash pattern will always be the same as the default drawn version
    }
  },
  polygon: {
    initialValueDisplayMode: ValueDisplayMode.MultipleOfPi, // Set the initial display of the values for the measurement of the polygon area
    showLabelsInitially: false, // Should the labels be show upon creating the polygon
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the polygon
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the polygon
    minimumVertexToEdgeThickness: 0.004, // the polygon doesn't exist if distance from any vertex to any non-adjacent edge is less than this.
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    numPoints: 60, // The number of extra vertices used to draw the parts of the fill of the polygon that are on the boundary circle. MAKE THIS EVEN!
    numberOfTemporaryAngleMarkers: 15, // this is the maximum number of angle markers that will be displayed as the user creates a polygon, the user can create a polygon with more sides that then, but the temporary angle markers will not be display after this number
    //dynamicBackStyle is a flag that means the fill the polygon drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The properties of the polygon when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      fillColor: {
        front: "hsla(254, 100%, 90%, 0.6)", //"hsla(217, 100%, 80%, 0.0005)", //"noFill" is "hsla(0,0%,0%,0)",
        frontHSLA: { h: 254, s: 100, l: 90, a: 0.6 },
        back: "hsla(10, 100%, 50%, 0.1)", //"hsla(217, 100%, 80%, 0.0002)" //"noFill" is "hsla(0,0%,0%,0)"
        backHSLA: { h: 10, s: 100, l: 50, a: 0.2 }
      }
      //  strokeColor is determined by each edge
      // strokeWidth is determined by each edge
      // dashArray is determined by each edge
    }
  },
  label: {
    maxLabelDisplayCaptionLength: 15, // The maximum number of characters in the displayed label caption
    maxLabelDisplayTextLength: 8, // The maximum number of characters in the displayed label name
    //The scaling of the label relative to the scaled for zoom default size
    textScalePercent: 100,
    dynamicBackStyle: true,
    fontSize: 15,
    fillColor: {
      front: "hsla(0, 0%, 0%, 1.0)", //"noFill" is "hsla(0,0%,0%,0)",
      frontHSLA: { h: 0, s: 0, l: 0, a: 1 },
      back: "hsla(0, 0%, 0%, 0.1)", //"noFill" is "hsla(0,0%,0%,0)"
      backHSLA: { h: 0, s: 0, l: 0, a: 1 }
    },
    style: "normal",
    family: "sans/-serif",
    decoration: "none",
    rotation: 0,
    glowingStrokeWidth: { front: 3, back: 3 },
    glowingStrokeColor: {
      front: "hsla(0, 0%, 70%, 1)",
      back: "hsla(0, 0%, 85%, 1)"
    }
  },
  angleMarker: {
    initialValueDisplayMode: ValueDisplayMode.DegreeDecimals, // Set the initial display of the values for the measurement of the angle
    showLabelsInitially: true, // Should the labels be show upon creating the angleMarker
    maxLabelDistance: 0.25, // The maximum distance that a label is allowed to get away from the angleMarker
    initialLabelOffset: 0.2, // When making point labels this is initially how far (roughly) they are from the angleMarker
    defaultLabelMode: LabelDisplayMode.ValueOnly, // The default way of displaying this objects label
    turnOffVertexLabelOnCreation: true, // When an angle marker is created with a label at the vertex, that label is turned off if this is set.
    maxGapLengthOrDashLength: 2, // the maximum of the sum of the gap and dash and the endpoint (max value) of the dash range slider
    sliderStepSize: 0.1, //
    defaultTickMark: false,
    defaultDoubleArc: false,
    defaultRadius: 0.08, // The default radius for angleMarkers
    numCirclePoints: 50, // The number of vertices used to render the circle part of the angleMarker. These are spread over the front and back parts. MAKE THIS EVEN!
    numEdgePoints: 26, // The number of vertices used to render each of the start and end vector edge of the angleMarker. These are spread over the front and back parts. MAKE THIS EVEN!
    numBoundaryCirclePoints: 10, // To trace *all* of the filled regions requires 2*numCirclePoints+4*numEdgePoints + 2*numBoundaryCirclePoints anchors. MAKE THIS EVEN!!!!
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the angleMarker.
    //dynamicBackStyle is a flag that means the fill, linewidth, and strokeColor of the angleMarkers drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The scaling of the angle marker relative to the scaled for zoom default size
    radiusScalePercent: 100,
    //The angular distance from the first angle marker arc to the second
    doubleArcGap: 0.05,
    // Properties of the arrow head see Bill Casselman's PiScript Manual page 30 July 26,2013 11:12AM
    arrowHeadTipAngleInner: (28 * Math.PI) / 180, // the angle between the shaft and the tip edge (half the whole tip angle) toward the angle marker
    arrowHeadRearAngleInner: (70 * Math.PI) / 180, // the angle between the shaft and the rear edge (half the whole tip angle) toward the angle marker
    arrowHeadTipAngleOuter: (28 * Math.PI) / 180, // the angle between the shaft and the tip edge (half the whole tip angle) away from the angle marker
    arrowHeadRearAngleOuter: (70 * Math.PI) / 180, // the angle between the shaft and the rear edge (half the whole tip angle) away from the angle marker
    arrowHeadLength: 0.01, // the length of the arrow head on the unit ideal sphere, Must be less than the default radius of angle marker
    arrowHeadDisplay: true,
    //The properties of the angleMarker when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      fillColor: {
        front: "hsla(254, 100%, 90%, 0.5)", //"noFill" is "hsla(0,0%,0%,0)",0.001
        frontHSLA: { h: 254, s: 100, l: 90, a: 0.5 },
        back: "hsla(10, 100%, 50%, 0.4)", //"hsla(0, 0%, 0%, 1)" //"noFill" is "hsla(0,0%,0%,0)"
        backHSLA: { h: 10, s: 100, l: 50, a: 0.4 }
      },
      strokeColor: {
        front: "hsla(0, 0%, 0%, 1)",
        back: "hsla(0, 0%, 0%, 0.3)"
      },
      strokeWidth: {
        circular: {
          front: 4,
          back: 3
        },
        straight: {
          front: 2,
          back: 1
        }
      }, // The thickness of the edge of the angleMarker when drawn front/back,
      dashArray: {
        reverse: { front: true, back: true }, // In the slider to select the dash array should the numbers be reversed so that the dash length can be less than the gap length?
        offset: { front: 0, back: 0 },
        front: [0, 0], // An empty array or [0,0] means no dashing.
        back: [0, 0] // An empty array or [0,0] means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around an angle when it is glowing
    glowing: {
      // There is no fill for highlighting objects
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.75)"
      },
      circular: { edgeWidth: 5 }, // edgeWidth/2 is the width of the region around the angle (on all sides) that shows the glow
      straight: { edgeWidth: 2 }
      // The dash pattern will always be the same as the drawn version
    },
    //The properties of the angle marker when it is temporarily shown by the angle measuring tool while drawing
    temp: {
      fillColor: {
        front: "hsla(340, 0%, 50%, 0.4)", //front: "hsla(0, 0%, 90%, 0.3)", //"noFill" is "hsla(0,0%,0%,0)",
        back: "hsla(0, 0%, 50%, 0.3)" //"noFill" is "hsla(0,0%,0%,0)"
      },
      strokeColor: {
        front: "hsla(0, 0%, 0%, 0.6)",
        back: "hsla(0, 0%, 0%, 0.4)"
      }
      // The width is the same as the default drawn version
      // The dash pattern will always be the same as the default drawn version
    }
  },
  icons: {
    defaultIconSize: 40,
    defaultInlineIconSize: 25,
    boundaryCircle: {
      strokeWidth: 1.5,
      color: "hsla(0, 0%, 0%, 1)"
    },
    // These are the detail of how the icon parts (points, lines, circles, etc.) are drawn when emphasized
    emphasize: {
      angleMarker: {
        strokeWidth: {
          front: 2.5,
          back: 2.5
        },
        edgeColor: {
          front: "hsla(0, 0%, 0%, 1)",
          back: "hsla(0, 0%, 0%, 0.3)"
        },
        fillColor: {
          front: "hsla(254, 100%, 90%, 1)",
          back: "hsla(10,100%, 50%, 1)"
        }
      },
      circle: {
        strokeWidth: {
          front: 1,
          back: 1
        },
        edgeColor: { front: "hsla(0, 0%, 0%, 1)", back: "hsla(0, 0%, 0%, 1)" },
        fillColor: {
          front: "hsla(0, 100%, 75%, 1)",
          back: "hsla(0, 100%, 75%, 1)"
        }
      },
      ellipse: {
        strokeWidth: {
          front: 1,
          back: 1
        },
        edgeColor: { front: "hsla(0, 0%, 0%, 1)", back: "hsla(0, 0%, 0%, 1)" },
        fillColor: {
          front: "hsla(0, 100%, 75%, 1)",
          back: "hsla(0, 100%, 75%, 1)"
        }
      },
      point: {
        strokeWidth: {
          front: 0.7,
          back: 0.7
        },
        edgeColor: { front: "hsla(0, 0%, 0%, 1)", back: "hsla(0, 0%, 0%, 1)" },
        fillColor: {
          front: "hsla(0, 100%, 75%, 1)",
          back: "hsla(0, 100%, 75%, 1)"
        }
      },
      line: {
        strokeWidth: {
          front: 1.5,
          back: 1.5
        },
        edgeColor: {
          front: "hsla(217, 90%, 61%, 1)",
          back: "hsla(217, 90%, 80%, 1)"
        }
      },
      segment: {
        strokeWidth: {
          front: 1.5,
          back: 1.5
        },
        edgeColor: {
          front: "hsla(217, 90%, 61%, 1)",
          back: "hsla(217, 90%, 80%, 1)"
        }
      }
    },
    // These are the detail of how the icon parts (points, lines, circles, etc.) are drawn when not emphasized
    normal: {
      angle: {
        scale: {
          front: 7,
          back: 5
        },
        strokeWidth: {
          front: 1,
          back: 1
        },
        edgeColor: {
          front: "hsla(0, 0%, 40%, 1)",
          back: "hsla(0, 0%, 60%, 1)"
        },
        fillColor: {
          front: "hsla(0, 0%, 90%, 0.4)",
          back: "hsla(0, 0%, 100%, 0.2)"
        }
      },
      circle: {
        strokeWidth: {
          front: 1,
          back: 1
        },
        edgeColor: {
          front: "hsla(0, 0%, 40%, 1)",
          back: "hsla(0, 0%, 60%, 1)"
        },
        fillColor: {
          front: "hsla(0, 0%, 90%, 0.4)",
          back: "hsla(0, 0%, 100%, 0.2)"
        }
      },
      ellipse: {
        strokeWidth: {
          front: 1,
          back: 1
        },
        edgeColor: {
          front: "hsla(0, 0%, 40%, 1)",
          back: "hsla(0, 0%, 60%, 1)"
        },
        fillColor: {
          front: "hsla(0, 0%, 90%, 0.4)",
          back: "hsla(0, 0%, 100%, 0.2)"
        }
      },
      point: {
        scale: {
          front: 7,
          back: 9
        },
        strokeWidth: {
          front: 0.8,
          back: 0.7
        },
        edgeColor: {
          front: "hsla(0, 0%, 40%, 1)",
          back: "hsla(0, 0%, 60%, 1)"
        },
        fillColor: {
          front: "hsla(0, 0%, 90%, 1)",
          back: "hsla(0, 0%, 100%, 1)"
        }
      },
      line: {
        strokeWidth: {
          front: 1,
          back: 1
        },
        edgeColor: {
          front: "hsla(0, 0%, 40%, 1)",
          back: "hsla(0, 0%, 60%, 1)"
        }
      },
      segment: {
        strokeWidth: {
          front: 1,
          back: 1
        },
        edgeColor: {
          front: "hsla(0, 0%, 40%, 1)",
          back: "hsla(0, 0%, 60%, 1)"
        }
      }
    },
    // These are the properties of the icons (mdiIcon, file path to SVG, emphasize types), These must be stored here and
    // and not in vuetify.ts because these must be accessible to both the src code and VuePress.
    point: {
      props: {
        emphasizeTypes: [["point", "front", "back"]],
        mdiIcon: false,
        filePath: "../../icons/iconPointPaths.svg"
      }
    },
    line: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["line", "front", "back"],
          ["point", "front", "back"]
        ],
        filePath: "../../icons/iconLinePaths.svg"
      }
    },
    segment: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["segment", "front", "back"],
          ["point", "front", "back"]
        ],
        filePath: "../../icons/iconSegmentPaths.svg"
      }
    },
    circle: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["circle", "front", "back"],
          ["point", "front", "back"]
        ],
        filePath: "../../icons/iconCirclePaths.svg"
      }
    },
    antipodalPoint: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [["point", "front"]],
        filePath: "../../icons/iconAntipodalPointPaths.svg"
      }
    },
    polar: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["point", "front"],
          ["line", "front"]
        ],
        filePath: "../../icons/iconPolarPaths.svg"
      }
    },
    perpendicular: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["point", "front"],
          ["line", "front", "back"]
        ],
        filePath: "../../icons/iconPerpendicularPaths.svg"
      }
    },
    tangent: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["point", "front"],
          ["line", "front", "back"]
        ],
        filePath: "../../icons/iconTangentPaths.svg"
      }
    },
    intersect: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [["point", "front"]],
        filePath: "../../icons/iconIntersectPaths.svg"
      }
    },
    pointOnObject: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [["point", "front"]],
        filePath: "../../icons/iconPointOnObjectPaths.svg"
      }
    },
    angle: {
      props: {
        emphasizeTypes: [["angleMarker", "back", "front"]],
        mdiIcon: false,
        filePath: "../../icons/iconAnglePaths.svg"
      }
    },
    segmentLength: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [["segment", "back", "front"]],
        filePath: "../../icons/iconSegmentLengthPaths.svg"
      }
    },
    pointDistance: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [["point", "front", "back"]],
        filePath: "../../icons/iconPointDistancePaths.svg"
      }
    },
    ellipse: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [["point", "front", "back"]],
        filePath: "../../icons/iconEllipsePaths.svg"
      }
    },
    parametric: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["point", "front"],
          ["parametric", "front"]
        ],
        filePath: "../../icons/iconParametricPaths.svg"
      }
    },
    measureTriangle: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["point", "front"],
          ["angleMarker", "back", "front"]
        ],
        filePath: "../../icons/iconMeasureTrianglePaths.svg"
      }
    },
    measurePolygon: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["point", "front"],
          ["angleMarker", "back", "front"]
        ],
        filePath: "../../icons/iconMeasurePolygonPaths.svg"
      }
    },
    midpoint: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["segment", "front"],
          ["point", "front"]
        ],
        filePath: "../../icons/iconMidpointPaths.svg"
      }
    },
    nSectPoint: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["segment", "front"],
          ["point", "front"]
        ],
        filePath: "../../icons/iconNSectPointPaths.svg"
      }
    },
    angleBisector: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["line", "front", "back"],
          ["angleMarker", "front"]
        ],
        filePath: "../../icons/iconAngleBisectorPaths.svg"
      }
    },
    nSectLine: {
      props: {
        mdiIcon: false,
        emphasizeTypes: [
          ["line", "front", "back"],
          ["angleMarker", "front"]
        ],
        filePath: "../../icons/iconNSectLinePaths.svg"
      }
    },
    coordinate: {
      props: {
        mdiIcon: "mdi-axis-arrow-info",
        emphasizeTypes: [[]],
        filePath: ""
      }
    },
    delete: {
      props: {
        mdiIcon: "mdi-delete",
        emphasizeTypes: [[]],
        filePath: ""
      }
    },
    hide: {
      props: {
        mdiIcon: "mdi-file-hidden",
        emphasizeTypes: [[]],
        filePath: ""
      }
    },
    iconFactory: {
      props: {
        mdiIcon: "mdi-plus",
        emphasizeTypes: [[]],
        filePath: ""
      }
    },
    move: {
      props: {
        mdiIcon: "mdi-cursor-move",
        emphasizeTypes: [[]],
        filePath: ""
      }
    },
    rotate: {
      props: {
        mdiIcon: "mdi-rotate-3d-variant",
        emphasizeTypes: [[]],
        filePath: ""
      }
    },
    select: {
      props: {
        mdiIcon: "mdi-cursor-pointer",
        emphasizeTypes: [[]],
        filePath: ""
      }
    },
    toggleLabelDisplay: {
      props: {
        mdiIcon: "mdi-toggle-switch-off-outline",
        emphasizeTypes: [[]],
        filePath: ""
      }
    },
    zoomFit: {
      props: {
        mdiIcon: "mdi-magnify-scan",
        emphasizeTypes: [[]],
        filePath: ""
      }
    },
    zoomIn: {
      props: {
        mdiIcon: "mdi-magnify-plus-outline",
        emphasizeTypes: [[]],
        filePath: ""
      }
    },
    zoomOut: {
      props: {
        mdiIcon: "mdi-magnify-minus-outline",
        emphasizeTypes: [[]],
        filePath: ""
      }
    },
    toolsTab: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-tools",
        filePath: ""
      }
    },
    objectsTab: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-format-list-bulleted",
        filePath: ""
      }
    },
    constructionsTab: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-database",
        filePath: ""
      }
    },
    calculationObject: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-calculator-variant",
        filePath: ""
      }
    },
    measurementObject: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-math-compass",
        filePath: ""
      }
    },
    slider: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-slide",
        filePath: ""
      }
    },
    stylePanel: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-palette",
        filePath: ""
      }
    },
    downloadConstruction: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-download",
        filePath: ""
      }
    },
    shareConstruction: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-share-variant",
        filePath: ""
      }
    },
    deleteConstruction: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-trash-can",
        filePath: ""
      }
    },
    cycleNodeValueDisplayMode: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-autorenew", // "mdi-recycle-variant",
        filePath: ""
      }
    },
    showNode: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-eye",
        filePath: ""
      }
    },
    hideNode: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-eye-off",
        filePath: ""
      }
    },
    showNodeLabel: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-label-outline",
        filePath: ""
      }
    },
    hideNodeLabel: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-label-off-outline",
        filePath: ""
      }
    },
    deleteNode: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-trash-can-outline",
        filePath: ""
      }
    },
    appSettings: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-cog",
        filePath: ""
      }
    },
    clearConstruction: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-broom",
        filePath: ""
      }
    },
    undo: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-undo",
        filePath: ""
      }
    },
    redo: {
      props: {
        emphasizeTypes: [[]],
        mdiIcon: "mdi-redo",
        filePath: ""
      }
    }
  },
  /* Controls the length of time (in ms) the tool tip are displayed */
  toolTip: {
    openDelay: 500,
    closeDelay: 250,
    disableDisplay: false // controls if all tooltips should be displayed
  },
  /* Sets the length of time (in ms) that the tool use display message is displayed in a snackbar */
  toolUse: {
    delay: 2000,
    display: true // controls if they should be displayed
  },
  parameterization: {
    useNewtonsMethod: false, // When finding the zeros, should we use newton's method?  If false we use bisections
    subdivisions: 80, // When searching function on a parametrized curve for a change in sign, use this many subdivisions
    bisectionMinSize: 0.0000001, // stop running the bisection method (if Newton's method is not used) when the interval is less than this size
    numberOfTestTValues: 10, // When checking if a parametric curve is unit or the number of times the curve intersects a plane connecting two points on the curve use this many points
    maxNumberOfIterationArcLength: 5, // maximum number of times it will iterate over the curve to find the arcLength (i.e. the curve is divided into at most subdivisions*maxNumberOfIterationArcLength subdivisions while looking for the arcLength)
    maxChangeInArcLength: 0.0001 // If the change in arcLength is less than this, return the value
  },
  /*A list of which buttons to display - adjusted by the users settings.
  This does NOT belong here but I don't know where else to put it at the moment*/
  userButtonDisplayList: [
    "rotate",
    "point",
    "circle",
    "move",
    "line",
    "segment",
    "select",
    "zoomIn",
    "zoomOut",
    "intersect"
  ],
  supportedLanguages: [
    { locale: "en", name: "English" },
    { locale: "id", name: "Bahasa Indonesia" }
  ]
};

//#region layers
export enum LAYER {
  backgroundAngleMarkersGlowing,
  backgroundAngleMarkers,
  backgroundGlowing,
  backgroundFills,
  background,
  backgroundPointsGlowing,
  backgroundPoints,
  backgroundTextGlowing,
  backgroundText,
  midground,
  foregroundAngleMarkersGlowing,
  foregroundAngleMarkers,
  foregroundGlowing,
  foregroundFills,
  foreground,
  foregroundPointsGlowing,
  foregroundPoints,
  foregroundTextGlowing,
  foregroundText
}
//#endregion layers

export default SETTINGS;
