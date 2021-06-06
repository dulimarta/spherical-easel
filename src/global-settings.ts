import { LabelDisplayMode } from "./types/Styles";

export default {
  nearlyAntipodalIdeal: 0.005, // Two unit vectors, U and V, are nearly antipodal or nearly parallel (the) if crossVectors(U,V).isZero(nearlyAntipodalIdeal) is true
  tolerance: 0.0000001, // Any number less that this tolerance is considered zero
  hideObjectHidesLabel: true, // hiding an object hide the label of that object automatically if this is true
  showObjectShowsLabel: false, // showing an object (via the object tree) automatically shows the label if this is true
  decimalPrecision: 3, // The number decimal places to display when numerically measuring or computing a value
  style: {
    backStyleContrast: 0.5, //The number that controls the automatic setting of the back styling for objects that have dynamicBackStyle set to true.
    maxStrokeWidthPercent: 200, // The maximum percent stroke width different from the scaled for zoom size
    minStrokeWidthPercent: 60, // The minimum percent stroke width different from the scaled for zoom size
    maxPointRadiusPercent: 200, // The maximum percent point radius different from the scaled for zoom size
    minPointRadiusPercent: 60, // The minimum percent point radius different from the scaled for zoom size
    maxGapLengthPlusDashLength: 20, // the maximum of the sum of the gap and dash and the endpoint (max value) of the dash range slider
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
    selectedColor: {
      front: "hsla(0, 0%, 85%, 1)",
      back: "hsla(0, 0%, 95%, 1)"
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
      decayTime: 0.5, // Time in seconds for the rotation to stop, max value of 300 seconds (5 minutes).
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
    showLabelsOfFreePointsInitially: true, // Should the labels of free points be shown upon creating the point
    showLabelsOfNonFreePointsInitially: false, // Should the labels of non-free points be shown upon creating the point
    showLabelsOfPointOnObjectInitially: false, // Should the labels of points on objects be shown upon creating the point
    readingCoordinatesChangesLabelModeTo: LabelDisplayMode.NameAndValue,
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the point
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
        back: "hsla(0, 100%, 75%, 1)"
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
        back: "hsla(0, 100%, 75%, 0.7)"
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
    displayInMultiplesOfPiInitially: true, // Should the measure of the length be in multiples of pi
    showLabelsInitially: false, // Should the labels be show upon creating the segment
    maxLabelDistance: 0.15, // The maximum distance that a label is allowed to get away from the segment
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    measuringChangesLabelModeTo: LabelDisplayMode.NameAndValue,
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the line
    minimumArcLength: 0.045, // Don't create segments with a length less than this (must be larger than point.hitIdealDistance because if not it is possible to create a line segment of length zero )
    numPoints: 20, // The number of vertices used to render the segment. These are spread over the front and back parts. MAKE THIS EVEN!
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the line.
    //dynamicBackStyle is a flag that means the fill color, and stroke of the segments drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    closeEnoughToPi: 0.005, //If the arcLength of a segment is within this distance of pi, consider it length pi, so that it is not defined by its endpoints and can be moved
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
        offset: { front: 0, back: 0 },
        front: [] as number[], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around a segment when it is glowing
    glowing: {
      // No fill for line segments
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.7)"
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
    showLabelsInitially: false, // Should the labels be show upon creating the line
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the line
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the line
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    minimumLength: 0.045, // Don't create lines distance between the two defining point with arc length between them smaller than this (must be larger than point.hitIdealDistance because if not it is possible to create a line segment of length zero )
    numPoints: 50, // The number of vertices used to render the line. These are spread over the front and back parts. MAKE THIS EVEN!
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
        offset: { front: 0, back: 0 },
        front: [] as number[], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
      }
    },
    //The properties of the region around a line when it is glowing
    glowing: {
      // No fill for lines
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.7)"
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
    }
  },
  circle: {
    showLabelsInitially: false, // Should the labels be show upon creating the circle
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the circle
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the circle
    defaultLabelMode: LabelDisplayMode.NameOnly, // The default way of displaying this objects label
    minimumRadius: 0.045, // Don't create circles with a radius smaller than this or bigger than Pi-this (must be bigger than point.hitIdealDistance to prevent almost zero radius circles at intersection points)
    numPoints: 100, // The number of vertices used to render the circle. These are spread over the front and back parts. MAKE THIS EVEN!
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the circle.
    //dynamicBackStyle is a flag that means the fill, linewidth, and strokeColor of the circles drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The properties of the circle when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      fillColor: {
        front: "hsla(217, 100%, 80%, 0.0005)", //"noFill",
        back: "hsla(217, 100%, 80%, 0.0002)" //"noFill"
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
        offset: { front: 0, back: 0 },
        front: [] as number[], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around a circle when it is glowing
    glowing: {
      // There is no fill for highlighting objects
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.7)"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the circle (on each side) that shows the glow
      // The dash pattern will always be the same as the drawn version
    },
    //The properties of the circle when it is temporarily shown by the circle tool while drawing
    temp: {
      fillColor: {
        front: "hsla(0, 0%, 90%, 0.3)", //"noFill",
        back: "hsla(0, 0%, 50%, 0.3)" //"noFill"
      },
      strokeColor: {
        front: "hsla(0, 0%, 0%, 1.0)",
        back: "hsla(0, 0%, 0%, 0.1)"
      }
      // The width is the same as the default drawn version
      // The dash pattern will always be the same as the default drawn version
    }
  },
  label: {
    maxLabelDisplayCaptionLength: 30, // The maximum number of characters in the displayed label caption
    maxLabelDisplayTextLength: 15, // The maximum number of characters in the displayed label name
    //The scaling of the label relative to the scaled for zoom default size
    textScalePercent: 100,
    dynamicBackStyle: true,
    fontSize: 15,
    fillColor: {
      front: "hsla(0, 0%, 0%, 1.0)", //"noFill",
      back: "hsla(0, 0%, 0%, 0.1)" //"noFill"
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
    displayInMultiplesOfPiInitially: true, // Should the measure of the angle be in multiples of pi
    showLabelsInitially: true, // Should the labels be show upon creating the angleMarker
    maxLabelDistance: 0.2, // The maximum distance that a label is allowed to get away from the angleMarker
    initialLabelOffset: 0.1, // When making point labels this is initially how far (roughly) they are from the angleMarker
    defaultLabelMode: LabelDisplayMode.ValueOnly, // The default way of displaying this objects label

    minimumRadius: 0.02, // Don't scale angleMarkers to have a radius smaller than this
    defaultRadius: 0.04, // The default radius for angleMarkers
    maximumRadius: 0.1, // Don't scale angleMarkers to have a radius larger than this (This can't be bigger than Pi/2 or else some of the algortihms break down)
    numCirclePoints: 100, // The number of vertices used to render the circle part of the angleMarker. These are spread over the front and back parts. MAKE THIS EVEN!
    numEdgePoints: 50, // The number of vertices used to render each of the start and end vector edge of the angleMarker. These are spread over the front and back parts. MAKE THIS EVEN!
    hitIdealDistance: 0.03, // The user has to be within this distance on the ideal unit sphere to select the angleMarker.
    //dynamicBackStyle is a flag that means the fill, linewidth, and strokeColor of the angleMarkers drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The scaling of the angle marker relative to the scaled for zoom default size
    radiusScalePercent: 100,
    //The properties of the angleMarker when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      fillColor: {
        front: "hsla(0, 0%, 0%, 0.001)", //"noFill",
        back: "hsla(0, 0%, 0%, 0.0001)" //"noFill"
      },
      strokeColor: {
        front: "hsla(0, 0%, 0%, 0.5)",
        back: "hsla(0, 0%, 0%, 0.3)"
      },
      strokeWidth: {
        front: 4,
        back: 3
      }, // The thickness of the edge of the angleMarker when drawn front/back,
      dashArray: {
        offset: { front: 0, back: 0 },
        front: [] as number[], // An empty array means no dashing.
        back: [] // An empty array means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around an angle when it is glowing
    glowing: {
      // There is no fill for highlighting objects
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.7)"
      },
      edgeWidth: 5 // edgeWidth/2 is the width of the region around the angle (on all sides) that shows the glow
      // The dash pattern will always be the same as the drawn version
    },
    //The properties of the angle marker when it is temporarily shown by the angle measuring tool while drawing
    temp: {
      fillColor: {
        front: "hsla(0, 0%, 90%, 0.3)", //"noFill",
        back: "hsla(0, 0%, 50%, 0.3)" //"noFill"
      },
      strokeColor: {
        front: "hsla(0, 0%, 0%, 0.6)",
        back: "hsla(0, 0%, 0%, 0.4)"
      }
      // The width is the same as the default drawn version
      // The dash pattern will always be the same as the default drawn version
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
  background,
  backgroundPointsGlowing,
  backgroundPoints,
  backgroundTextGlowing,
  backgroundText,
  midground,
  foregroundAngleMarkersGlowing,
  foregroundAngleMarkers,
  foregroundGlowing,
  foreground,
  foregroundPointsGlowing,
  foregroundPoints,
  foregroundTextGlowing,
  foregroundText
}
//#endregion layers
