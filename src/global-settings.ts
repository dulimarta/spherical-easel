import { ValueDisplayMode, LabelDisplayMode } from "./types";
import colors from 'vuetify/util/colors'
export const SETTINGS = {
  nearlyAntipodalIdeal: 0.01, // Two unit vectors, U and V, are nearly antipodal or nearly parallel (the) if crossVectors(U,V).isZero(nearlyAntipodalIdeal) is true. June 2024 - when this was 0.005 it was hard to draw a segment of length bigger than pi using the update method in SESegment
  tolerance: 0.00000000001, // Any number less that this tolerance is considered zero
  intersectionTolerance: 0.00000001, // If, when checking the difference between the current intersection location, and the location between two potentially new principle parents intersection the difference is less than this, they are the same
  hideObjectHidesLabel: true, // hiding an object hides the label of that object automatically if this is true
  showObjectShowsLabel: false, // showing an object (via the object tree) automatically shows the label if this is true
  decimalPrecision: 3, // The number decimal places to display when numerically measuring or computing a value
  messageTypes: ["success", "info", "error", "warning", "directive"],
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
        /* first column is xxx-darken-4 */
        colors.grey.darken4,
        colors.indigo.darken4,
        colors.blue.darken4,
        colors.green.darken4,
        colors.yellow.darken4,
        colors.orange.darken4,
        colors.red.darken4,
        colors.pink.darken4,
        colors.purple.darken4,
        colors.deepPurple.darken4
      ],
      [
        //darkest
        "#000000",
        colors.indigo.darken2,
        "#1565C0", // blue-800
        "#388E3C", // green-800
        "#F9A825", // yellow-800
        "#EF6C00", // orange-800
        "#C62828", // red-800
        "#AD1457", // pink-800
        "#6A1B9A", // purple-800
        "#4527A0" // deep-purple-800
      ],
      [
        "#616161",
        colors.indigo.base,
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
        colors.indigo.lighten2,
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
        colors.indigo.lighten4,
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
      front: "#ff000080",
      back: "#ff00004d"
    },
    fill: {
      // offset for the color fill. At this percent of the radius (boundaryCircle) the fill becomes all the fill color and not a bleed from the center color.
      gradientPercent: 0.8,
      // Initially Draw the fills using a gradient or not
      gradientFill: true,
      //The location of the light source when shading using a gradient fill (also called the focal point) relative to the center of the boundary circle. This must be in the radius of the gradient fill (which is the boundary circle radius)
      lightSource: {
        x: -250 / 3, // 250 is the radius of the boundary circle
        y: 250 / 3
      },
      // The location of the center of the radial fill relative to the center of the boundary circle
      center: {
        x:0,
        y:0
      },
      frontWhite: "#e6e6e633", // The light source location on the front is this shade of gray (white)
      backGray: "#d9d9d933" // The antipode of the light source on the back is this shade of gray
    },
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
  // #region boundarycircle
  boundaryCircle: {
    radius: 250 /* default radius */,
    color: "#000000FF",
    lineWidth: 3
  },
  // #endregion boundarycircle
  point: {
    initialValueDisplayMode: ValueDisplayMode.MultipleOfPi, // Set the initial display of the values for the measurement of the point distance
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
        front: "#ff8080FF",
        back: "#ff8080FF",
      },
      strokeColor: {
        front: "#4d4dcbFF",
        back: "#9c9ce2ff"
      },
      pointStrokeWidth: { front: 2, back: 2 } // The thickness of the edge of the point when drawn
      // No dashing for points
    },
    // The properties of the annular region around a point when it is glowing
    glowing: {
      annularWidth: 3, // width is the width of the annular region around the point that shows the glow it is always bigger than the drawn radius
      fillColor: {
        front: "#ff0000ff",
        back: "#ff8080b5"
      },
      strokeColor: {
        // is this ever used?
        front: "#b30000ff",
        back: "#e60000b3"
      }
      // No dashing - this is highlighting the object
    },
    //The properties of the point when it is temporarily shown by the point tool while drawing
    temp: {
      // The radius is the same as the default for drawn points
      fillColor: {
        front: "#808080ff",
        back: "#bfbfbfff"
      },
      strokeColor: {
        front: "#000000FF",
        back: "#808080ff"
      }
      // The temp stroke width is the same as the default drawn stroke width
      // No dashing for points
    },
    nonFree: {
      scalePercent: 90, // The percent that the size of the (free) points are scaled by to get the size of the nonFreePoint
      fillColor: {
        front: "#df9f9fff",
        back: "#cfafafff"
      },
      strokeColor: {
        front: "#6a6aafff",
        back: "#a9a9d6ff"
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
    numPoints: 15, // The number of vertices used to render one part of the segment. All parts (glowing/not front/back part/extra) get this number of verrtices
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the segment.
    closeEnoughToPi: 0.005, //If the arcLength of a segment is within this distance of pi, consider it length pi, so that it is not defined by its endpoints and can be moved
    //dynamicBackStyle is a flag that means the fill color, and stroke of the segments drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    drawn: {
      // No fill for line segments
      strokeColor: {
        front: "#4287f5ff",
        back: "#9ec1faff"
      },
      strokeWidth: {
        front: 2.5,
        back: 2
      }, // The thickness of the segment when drawn,
      dashArray: {
        reverse: { front: false, back: true }, // In the slider to select the dash array should the numbers be reversed so that the dash length can be less than the gap length?
        offset: { front: 0, back: 0 },
        front: [0, 0], // An empty array or [0,0] means no dashing.
        back: [5, 10] // An empty array means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around a segment when it is glowing
    glowing: {
      // No fill for line segments
      strokeColor: {
        front: "#ff0000ff",
        back: "#ff8080b8"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the segment that shows the glow
      // the dashing pattern is copied from the drawn version
    },
    //The properties of the circle when it is temporarily shown by the segment tool while drawing
    temp: {
      // No fill for line segments
      strokeColor: {
        front: "#6b6b6bff",
        back: "#b5b5b5ff"
      }
      // The width is the same as the default drawn version
      // The dashing pattern is copied from the default drawn version
    },
    nonFree: {
      // No fill for lines
      strokeColor: {
        front: "#42b9f5ff",
        back: "#9edbfaff"
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
  line: {
    showLabelsInitially: false, // Should the labels be shown upon creating the line
    showLabelsOfNonFreeLinesInitially: false, // Should the labels be shown upon creating the non-free line
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the line
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the line
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    minimumLength: 0.045, // Don't create lines distance between the two defining point with arc length between them smaller than this (must be larger than point.hitIdealDistance because if not it is possible to create a line segment of length zero )
    numPoints: 15, // The twice this number of vertices is used to render the line. This is the number in each of the front and back.
    closeEnoughToPi: 0.005, //If the angle from start to end point of this line is within this value of pi, consider it length pi, so that it is not defined by its start/end points and can be moved
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the line.
    //dynamicBackStyle is a flag that means the fill color, and stroke of the lines drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    drawn: {
      // No fill for lines
      strokeColor: {
        front: "#4287f5ff",
        back: "#9ec1faff"
      },
      // The thickness of the line when drawn
      strokeWidth: {
        front: 2.5,
        back: 2
      },
      dashArray: {
        reverse: { front: false, back: true }, // In the slider to select the dash array should the numbers be reversed so that the dash length can be less than the gap length?
        offset: { front: 0, back: 0 },
        front: [0, 0], // An empty array or [0,0] means no dashing.
        back: [5, 10] // An empty array means no dashing.
      }
    },
    //The properties of the region around a line when it is glowing
    glowing: {
      // No fill for lines
      strokeColor: {
        front: "#ff0000ff",
        back: "#ff8080ba"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the line that shows the glow
      // Dashing is the same as the drawn version
    },
    //The properties of the line when it is temporarily shown by the line tool while drawing
    temp: {
      // No fill for lines
      strokeColor: {
        front: "#6b6b6bff",
        back: "#b5b5b5ff"
      }
      // The width is the same as the default drawn version
      // Dashing is the same as the default drawn version
    },
    nonFree: {
      // No fill for lines
      strokeColor: {
        front: "#42b9f5ff",
        back: "#9edbfaff"
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
    showLabelsOfNonFreeCirclesInitially: false, // Should the labels be shown upon creating the non-free circle
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the circle
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the circle
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    minimumRadius: 0.045, // Don't create circles with a radius smaller than this or bigger than Pi-this (must be bigger than point.hitIdealDistance to prevent almost zero radius circles at intersection points) Also this is the minimum distance between the initial points in a threePointCircle
    numPoints: 40, // This is the number of vertices that are used to draw each front/back arc of the circle, twice this number are used in the front/back fill of the circle (each part contains this many vertices)
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the circle.
    //dynamicBackStyle is a flag that means the fill, linewidth, and strokeColor of the circles drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The properties of the circle when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      fillColor: {
        front: "#d8ccff33",
        back: "#ff2b0026",
      },
      strokeColor: {
        front: "#4287f5ff",
        back: "#9ec1faff"
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
        front: "#ff0000ff",
        back: "#ff8080bd"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the circle (on each side) that shows the glow
      // The dash pattern will always be the same as the drawn version
    },
    //The properties of the circle when it is temporarily shown by the circle tool while drawing
    temp: {
      fillColor: {
        front: "#e6e6e64d",
        back: "#8080804d"
      },
      strokeColor: {
        front: "#000000FF",
        back: "#0000001a"
      }
      // The width is the same as the default drawn version
      // The dash pattern will always be the same as the default drawn version
    },
    nonFree: {
      fillColor: {
        front: "#d8ccff33",
        back: "#ff2b001a",
      },
      strokeColor: {
        front: "#42b9f5ff",
        back: "#9edbfaff"
      },
      // The thickness reduction of the nonFree circles when drawn
      scalePercent: 85, // The percent that the size of the (free) circles are scaled by to get the thickness of the nonFreeCircle
      dashArray: {
        reverse: { front: true, back: true }, // In the slider to select the dash array should the numbers be reversed so that the dash length can be less than the gap length?
        offset: { front: 0, back: 0 },
        front: [0, 0], // An empty array or [0,0] means no dashing.
        back: [5, 10] // An empty array means no dashing.
      }
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
        front: "#d8ccff33",
        back: "#ff2b001a",
      },
      strokeColor: {
        front: "#4287f5ff",
        back: "#9ec1faff"
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
        front: "#ff0000ff",
        back: "#ff8080bd"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the ellipse (on each side) that shows the glow
      // The dash pattern will always be the same as the drawn version
    },
    //The properties of the ellipse when it is temporarily shown by the ellipse tool while drawing
    temp: {
      fillColor: {
        front: "#e6e6e64d",
        back: "#8080804d"
      },
      strokeColor: {
        front: "#000000FF",
        back: "#0000001a"
      }
      // The width is the same as the default drawn version
      // The dash pattern will always be the same as the default drawn version
    },
    nonFree: {
      fillColor: {
        front: "#d8ccff33",
        back: "#ff2b001a",
      },
      strokeColor: {
        front: "#42b9f5ff",
        back: "#9edbfaff"
      },
      // The thickness reduction of the nonFree circles when drawn
      scalePercent: 85, // The percent that the size of the (free) circles are scaled by to get the thickness of the nonFreeCircle
      dashArray: {
        reverse: { front: true, back: true }, // In the slider to select the dash array should the numbers be reversed so that the dash length can be less than the gap length?
        offset: { front: 0, back: 0 },
        front: [0, 0], // An empty array or [0,0] means no dashing.
        back: [5, 10] // An empty array means no dashing.
      }
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
        front: "#d8ccff33",
        back: "#ff2b001a"
      },
      strokeColor: {
        front: "#4287f5ff",
        back: "#9ec1faff"
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
        front: "#ff0000ff",
        back: "#ff8080bd"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the parametric curve (on each side) that shows the glow
      // The dash pattern will always be the same as the drawn version
    },
    //The properties of the parametric curve when it is temporarily shown by the parametric curve tool while drawing
    temp: {
      fillColor: {
        front: "#e6e6e64d",
        back: "#8080804d"
      },
      strokeColor: {
        front: "#000000FF",
        back: "#0000001a"
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
    numPoints: 60, // Number vertices used to draw the parts of the fill of the polygon that are on the boundary circle. Half are for front and half for back.
    measuringChangesLabelModeTo: LabelDisplayMode.NameAndValue,
    numberOfTemporaryAngleMarkers: 15, // this is the maximum number of angle markers that will be displayed as the user creates a polygon, the user can create a polygon with more sides that then, but the temporary angle markers will not be display after this number
    //dynamicBackStyle is a flag that means the fill the polygon drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The properties of the polygon when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      fillColor: {
        front: "#d8ccff99",
        back: "#ff2b001a",
      }
      //  strokeColor is determined by each edge
      // strokeWidth is determined by each edge
      // dashArray is determined by each edge
    }
  },
  label: {
    maxLabelDisplayCaptionLength: 1000, // The maximum number of characters in the displayed label caption
    maxLabelDisplayTextLength: 8, // The maximum number of characters in the displayed label name
    //The scaling of the label relative to the scaled for zoom default size
    textScalePercent: 100,
    dynamicBackStyle: true,
    fontSize: 15,
    fillColor: {
      front: "#000000FF",
      back: "#0000001a",
    },
    style: "normal",
    family: "sans-serif",
    decoration: "none",
    rotation: 0,
    glowingStrokeWidth: { front: 3, back: 3 },
    glowingStrokeColor: {
      front: "#b3b3b3ff",
      back: "#d9d9d9ff"
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
    defaultTickMark: false, // controls if the tick mark is displayed by default (if true tick is displayed until the user turns it off)
    defaultTickMarkLength: 0.03, // 1/2 is display on the inside of the angle marker and 1/2 out (or if double is on 3/4 displayed after the double mark)
    defaultDoubleArc: false, // controls if the double mark is displayed by default (if true tick is displayed until the user turns it off)
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
    arrowHeadDisplay: true, // Controls if the arrow had is drawn by default (until a user turns it off)
    //The properties of the angleMarker when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      fillColor: {
        front: "#d8ccff99",
        back: "#ff2b0066",
      },
      strokeColor: {
        front: "#00000080",
        back: "#0000004d"
      },
      strokeWidth: {
        circular: {
          front: 4,
          back: 3
        },
        straight: {
          front: 2,
          back: 1
        },
        tick: {
          front: 3,
          back: 2
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
        front: "#ff0000ff",
        back: "#ff8080bf"
      },
      circular: { edgeWidth: 5 }, // edgeWidth/2 is the width of the region around the angle (on all sides) that shows the glow
      straight: { edgeWidth: 2 },
      tick: { edgeWidth: 2 }
      // The dash pattern will always be the same as the drawn version
    },
    //The properties of the angle marker when it is temporarily shown by the angle measuring tool while drawing
    temp: {
      fillColor: {
        front: "#80808066",
        back: "#8080804d"
      },
      strokeColor: {
        front: "#00000099",
        back: "#00000066"
      }
      // The width is the same as the default drawn version
      // The dash pattern will always be the same as the default drawn version
    }
  },
  icons: {
    buttonIconSize: 50, // in pixels for the buttons in the left tool panel ToolButton.vue
    shortcutIconSize: 32 , // in pixels for the icon inside the ShortcutIcon.vue
    shortcutButtonSize: 40, // in pixels the size of the button in ShortcutIcon.vue
    currentToolSectionIconSize: 30,  // icon in the CurrentToolSelection.vue

    defaultInlineIconSize: 25, // controls the size of the markdown icons included in documentation

    // These are the properties of the icons (mdiIcon, file path to SVG, emphasize types), These must be stored here and
    // and not in vuetify.ts because these must be accessible to both the src code and VitePress.
    blank: {
      props: {
        mdiIcon: "mdi-progress-question",
        svgFileName: "iconBlankPaths.svg"
      }
    },
    point: {
      props: {
        mdiIcon: false,
        svgFileName: "iconPointPaths.svg"
      }
    },
    line: {
      props: {
        mdiIcon: false,
        svgFileName: "iconLinePaths.svg"
      }
    },
    segment: {
      props: {
        mdiIcon: false,
        svgFileName: "iconSegmentPaths.svg"
      }
    },
    earthLongitude: {
      props: {
        mdiIcon: "mdi-longitude",
        svgFileName: ""
      }
    },
    circle: {
      props: {
        mdiIcon: false,
        svgFileName: "iconCirclePaths.svg"
      }
    },
    earthLatitude: {
      props: {
        mdiIcon: "mdi-latitude",
        svgFileName: ""
      }
    },
    antipodalPoint: {
      props: {
        mdiIcon: false,
        svgFileName: "iconAntipodalPointPaths.svg"
      }
    },
    earthPoint: {
      props: {
        mdiIcon: "mdi-map-marker",
        svgFileName: ""
      }
    },
    polar: {
      props: {
        mdiIcon: false,
        svgFileName: "iconPolarPaths.svg"
      }
    },
    perpendicular: {
      props: {
        mdiIcon: false,
        svgFileName: "iconPerpendicularPaths.svg"
      }
    },
    tangent: {
      props: {
        mdiIcon: false,
        svgFileName: "iconTangentPaths.svg"
      }
    },
    intersect: {
      props: {
        mdiIcon: false,
        svgFileName: "iconIntersectPaths.svg"
      }
    },
    pointOnObject: {
      props: {
        mdiIcon: false,
        svgFileName: "iconPointOnObjectPaths.svg"
      }
    },
    angle: {
      props: {
        mdiIcon: false,
        svgFileName: "iconAnglePaths.svg"
      }
    },
    segmentLength: {
      props: {
        mdiIcon: false,
        svgFileName: "iconSegmentLengthPaths.svg"
      }
    },
    pointDistance: {
      props: {
        mdiIcon: false,
        svgFileName: "iconPointDistancePaths.svg"
      }
    },
    ellipse: {
      props: {
        mdiIcon: false,
        svgFileName: "iconEllipsePaths.svg"
      }
    },
    parametric: {
      props: {
        mdiIcon: false,
        svgFileName: "iconParametricPaths.svg"
      }
    },
    measureTriangle: {
      props: {
        mdiIcon: false,
        svgFileName: "iconMeasureTrianglePaths.svg"
      }
    },
    measurePolygon: {
      props: {
        mdiIcon: false,
        svgFileName: "iconMeasurePolygonPaths.svg"
      }
    },
    midpoint: {
      props: {
        mdiIcon: false,
        svgFileName: "iconMidpointPaths.svg"
      }
    },
    nSectPoint: {
      props: {
        mdiIcon: false,
        svgFileName: "iconNSectPointPaths.svg"
      }
    },
    threePointCircle: {
      props: {
        mdiIcon: false,
        svgFileName: "iconThreePointCirclePaths.svg"
      }
    },
    measuredCircle: {
      props: {
        mdiIcon: "mdi-swap-horizontal-circle-outline",
        svgFileName: ""
      }
    },
    angleBisector: {
      props: {
        mdiIcon: false,
        svgFileName: "iconAngleBisectorPaths.svg"
      }
    },
    nSectLine: {
      props: {
        mdiIcon: false,
        svgFileName: "iconNSectLinePaths.svg"
      }
    },
    coordinate: {
      props: {
        mdiIcon: "mdi-axis-arrow-info",
        svgFileName: ""
      }
    },
    delete: {
      props: {
        mdiIcon: "mdi-delete",
        svgFileName: ""
      }
    },
    hide: {
      props: {
        mdiIcon: "mdi-file-hidden",
        svgFileName: ""
      }
    },
    iconFactory: {
      props: {
        mdiIcon: false,
        svgFileName: "iconFactoryPaths.svg"
      }
    },
    move: {
      props: {
        mdiIcon: "mdi-cursor-move",
        svgFileName: ""
      }
    },
    rotate: {
      props: {
        mdiIcon: "mdi-rotate-3d-variant",
        svgFileName: ""
      }
    },
    select: {
      props: {
        mdiIcon: "mdi-cursor-pointer",
        svgFileName: ""
      }
    },
    toggleLabelDisplay: {
      props: {
        mdiIcon: "mdi-toggle-switch-off-outline",
        svgFileName: ""
      }
    },
    zoomFit: {
      props: {
        mdiIcon: "mdi-magnify-scan",
        svgFileName: ""
      }
    },
    zoomIn: {
      props: {
        mdiIcon: "mdi-magnify-plus-outline",
        svgFileName: ""
      }
    },
    zoomOut: {
      props: {
        mdiIcon: "mdi-magnify-minus-outline",
        svgFileName: ""
      }
    },
    toolsTab: {
      props: {
        mdiIcon: "mdi-tools",
        svgFileName: ""
      }
    },
    objectsTab: {
      props: {
        mdiIcon: "mdi-format-list-bulleted",
        svgFileName: ""
      }
    },
    constructionsTab: {
      props: {
        mdiIcon: "mdi-database",
        svgFileName: ""
      }
    },
    earthTab: {
      props: {
        mdiIcon: "mdi-earth",
        svgFileName: ""
      }
    },
    calculationObject: {
      props: {
        mdiIcon: "mdi-calculator-variant",
        svgFileName: ""
      }
    },
    measurementObject: {
      props: {
        mdiIcon: "mdi-math-compass",
        svgFileName: ""
      }
    },
    slider: {
      props: {
        mdiIcon: "mdi-slide",
        svgFileName: ""
      }
    },
    labelPopOverTab:{
      props: {
        mdiIcon: "mdi-tag-edit",
        svgFileName: ""
      }
    },
    labelTextEditTab:{
      props: {
        mdiIcon: "mdi-pencil",
        svgFileName: ""
      }
    },
    labelTextFamilyTab:{
      props: {
        mdiIcon: "mdi-format-text",
        svgFileName: ""
      }
    },
    labelColorFamilyTab:{
      props: {
        mdiIcon: "mdi-palette",
        svgFileName: ""
      }
    },
    closePanelRight: {
      props: {
        mdiIcon: "mdi-chevron-double-right",
        svgFileName: ""
      }
    },
    styleDrawer: {
      props: {
        mdiIcon: "mdi-palette",
        svgFileName: ""
      }
    },
    downloadConstruction: {
      props: {
        mdiIcon: "mdi-download",
        svgFileName: ""
      }
    },
    shareConstruction: {
      props: {
        mdiIcon: "mdi-share-variant",
        svgFileName: ""
      }
    },
    starConstruction: {
      props: {
        mdiIcon: "mdi-star-outline",
        svgFileName: ""
      }
    },
    privateConstruction: {
      props: {
        mdiIcon: "mdi-eye-off",
        svgFileName: ""
      }
    },
    unstarConstruction: {
      props: {
        mdiIcon: "mdi-star-off-outline",
        svgFileName: ""
      }
    },
    deleteConstruction: {
      props: {
        mdiIcon: "mdi-trash-can",
        svgFileName: ""
      }
    },
    cycleNodeValueDisplayMode: {
      props: {
        mdiIcon: "mdi-autorenew", // "mdi-recycle-variant",
        svgFileName: ""
      }
    },
    showNode: {
      props: {
        mdiIcon: "mdi-eye",
        svgFileName: ""
      }
    },
    hideNode: {
      props: {
        mdiIcon: "mdi-eye-off",
        svgFileName: ""
      }
    },
    showNodeLabel: {
      props: {
        mdiIcon: "mdi-label-outline",
        svgFileName: ""
      }
    },
    hideNodeLabel: {
      props: {
        mdiIcon: "mdi-label-off-outline",
        svgFileName: ""
      }
    },
    deleteNode: {
      props: {
        mdiIcon: "mdi-trash-can-outline",
        svgFileName: ""
      }
    },
    appSettings: {
      props: {
        mdiIcon: "mdi-cog",
        svgFileName: ""
      }
    },
    clearConstruction: {
      props: {
        mdiIcon: "mdi-broom",
        svgFileName: ""
      }
    },
    undo: {
      props: {
        mdiIcon: "mdi-undo",
        svgFileName: ""
      }
    },
    redo: {
      props: {
        mdiIcon: "mdi-redo",
        svgFileName: ""
      }
    },
    copyToClipboard: {
      props: {
        mdiIcon: "mdi-content-copy",
        svgFileName: ""
      }
    },
    translation: {
      props: {
        mdiIcon: "mdi-call-made",
        svgFileName: ""
      }
    },
    rotation: {
      props: {
        mdiIcon: "mdi-screen-rotation",
        svgFileName: ""
      }
    },
    pointReflection: {
      props: {
        mdiIcon: "mdi-ferris-wheel",
        svgFileName: ""
      }
    },
    inversion: {
      props: {
        mdiIcon: "mdi-yeast",
        svgFileName: ""
      }
    },
    reflection: {
      props: {
        mdiIcon: "mdi-mirror",
        svgFileName: ""
      }
    },
    transformedPoint: {
      props: {
        mdiIcon: "mdi-movie-roll",
        svgFileName: ""
      }
    },
    transformedCircle: {
      props: {
        mdiIcon: "mdi-movie-roll",
        svgFileName: ""
      }
    },
    transformedLine: {
      props: {
        mdiIcon: "mdi-movie-roll",
        svgFileName: ""
      }
    },
    transformedSegment: {
      props: {
        mdiIcon: "mdi-movie-roll",
        svgFileName: ""
      }
    },
    transformedEllipse: {
      props: {
        mdiIcon: "mdi-movie-roll",
        svgFileName: ""
      }
    },
    applyTransformation: {
      props: {
        mdiIcon: "mdi-movie-roll",
        svgFileName: ""
      }
    },
    notifications: {
      props: {
        mdiIcon: "mdi-bell",
        svgFileName: ""
      }
    },
    animatedSVGLogo: {
      props: {
        mdiIcon: false,
        svgFileName: "LogoAnimatedSmallerV3.svg"
      }
    },
    /* Use this entry as a starter for a new tool icon */
    dummy: {
      props: {
        mdiIcon: "mdi-alphabetical",
        svgFileName: ""
      }
    },
    text: {
      props: {
        mdiIcon: "mdi-format-text",
        svgFileName: ""
      }
    }
  },
  /* Controls the length of time (in ms) the tool tip are displayed */
  /* Set the default tooltip delay in createVuetify() */
  // toolTip: {
  // openDelay: 500,
  // closeDelay: 1000,
  // disableDisplay: false // controls if all tooltips should be displayed
  // },
  /* Sets the length of time (in ms) that the tool use display message is displayed in a snackbar */
  toolUse: {
    delay: 3000,
    display: true // controls if they should be displayed
  },
  earthMode: {
    defaultEarthModeUnits: "km", // The other option is idiot units of miles (mi)
    radiusMiles: 3959,
    radiusKilometers: 6371
  },
  parameterization: {
    useNewtonsMethod: false, // When finding the zeros, should we use newton's method?  If false we use bisections
    subdivisions: 80, // When searching function on a parametrized curve for a change in sign, use this many subdivisions
    bisectionMinSize: 0.0000001, // stop running the bisection method (if Newton's method is not used) when the interval is less than this size
    numberOfTestTValues: 10, // When checking if a parametric curve is unit or the number of times the curve intersects a plane connecting two points on the curve use this many points
    maxNumberOfIterationArcLength: 5, // maximum number of times it will iterate over the curve to find the arcLength (i.e. the curve is divided into at most subdivisions*maxNumberOfIterationArcLength subdivisions while looking for the arcLength)
    maxChangeInArcLength: 0.0001 // If the change in arcLength is less than this, return the value
  },
  supportedLanguages: [
    { locale: "en", name: "English" },
    { locale: "id", name: "Bahasa Indonesia" }
  ]
};

//#region layers
export enum LAYER {
  backgroundGlowing,
  backgroundFills,
  background,
  backgroundAngleMarkersGlowing,
  backgroundAngleMarkers,
  backgroundPointsGlowing,
  backgroundPoints,
  backgroundTextGlowing,
  backgroundText,
  midground,
  foregroundGlowing,
  foregroundFills,
  foreground,
  foregroundAngleMarkersGlowing,
  foregroundAngleMarkers,
  foregroundPointsGlowing,
  foregroundPoints,
  foregroundTextGlowing,
  foregroundText
}
//#endregion layers

export default SETTINGS;
