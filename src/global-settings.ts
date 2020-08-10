import { TextLabelMode as LabelDisplayMode } from "./types";

export default {
  nearlyAntipodalIdeal: 0.01, // Two unit vectors, U and V, are nearly antipodal if |U+V| < nearlyAntipodalIdeal
  nearlyAntipodalPixel: 3, // Two vectors on the default sphere, U and V, are nearly antipodal if |U+V| < nearlyAntipodalPixel
  tolerance: 0.0000001, // Any number less that this tolerance is considered zero
  style: {
    frontSide: true,
    backSide: false,
    backStyleContrast: 0.5, //The number that controls the automatic setting of the back styling for objects that have dynamicBackStyle set to true.
    maxStrokeWidthPercent: 500, // The maximum percent stroke width different from the scaled for zoom size
    minStrokeWidthPercent: 20, // The minimum percent stroke width different from the scaled for zoom size
    maxPointRadiusPercent: 500, // The maximum percent point radius different from the scaled for zoom size
    minPointRadiusPercent: 20, // The minimum percent point radius different from the scaled for zoom size
    maxGapLengthPlusDashLength: 20 // the maximum of the sum of the gap and dash and the endpoint (max value) of the dash range slider
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
    opacity: 0.5,
    color: "hsla(0, 0%, 0%, 1)",
    lineWidth: 3
  },
  // #endregion boundarycircle
  point: {
    showLabelsInitially: true, // Should the labels be show upon creating the point
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the point
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the location of the point
    hitPixelDistance: 8, //When a pixel distance between a mouse event and the pixel coords of a point is less than this number, it is hit
    hitIdealDistance: 0.02, // The user has to be within this distance on the ideal unit sphere to select the point.
    //dynamicBackStyle is a flag that means the fill color,stroke, and opacity of the points drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
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
      pointStrokeWidth: { front: 1, back: 1 }, // The thickness of the edge of the point when drawn
      opacity: { front: 1, back: 1 }
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
        front: "hsla(0, 100%, 35%, 1)",
        back: "hsla(0, 100%, 45%, 0.7)"
      },
      opacity: { front: 1, back: 1 }
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
      },
      // The temp stroke width is the same as the default drawn stroke width
      opacity: { front: 1, back: 1 }
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
      pointStrokeWidth: { front: 2, back: 2 }, // The thickness of the edge of the point when drawn
      opacity: { front: 1, back: 1 }
      // No dashing for points
    }
  },
  segment: {
    showLabelsInitially: true, // Should the labels be show upon creating the segment
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the segment
    minimumArcLength: 0.02, // Don't create segments with a length less than this
    midPointMovementThreshold: (2.0 * Math.PI) / 180, // If the midpoint of a segment being created (not moved), changes by more than this amount, handle that case separately.
    numPoints: 20, // The number of vertices used to render the segment. These are spread over the front and back parts. MAKE THIS EVEN!
    hitPixelDistance: 8, //When a pixel distance between a mouse event and the pixel coords of a line is less than this number, it is hit
    hitIdealDistance: 0.02, // The user has to be within this distance on the ideal unit sphere to select the line.
    //dynamicBackStyle is a flag that means the fill color,stroke, and opacity of the segments drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
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
      }, // The thickness of the segment when drawn
      opacity: { front: 1, back: 1 },
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
      edgeWidth: 4, // edgeWidth/2 is the width of the region around the segment that shows the glow
      opacity: { front: 1, back: 1 }
      // the dashing pattern is copied from the drawn version
    },
    //The properties of the circle when it is temporarily shown by the segment tool while drawing
    temp: {
      // No fill for line segments
      strokeColor: {
        front: "hsla(0, 0%, 42%, 1)",
        back: "hsla(0, 0%, 71%, 1)"
      },
      // The width is the same as the default drawn version
      opacity: { front: 1, back: 1 }
      // The dashing pattern is copied from the default drawn version
    }
  },
  line: {
    showLabelsInitially: true, // Should the labels be show upon creating the line
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the line
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the line
    minimumLength: 0.02, // Don't create lines with arc length  smaller than this
    normalVectorMovementThreshold: (2.0 * Math.PI) / 180, // If the normal vector of a line being created (not moved), changes by more than this amount, handle that case separately.
    numPoints: 50, // The number of vertices used to render the line. These are spread over the front and back parts. MAKE THIS EVEN!
    hitPixelDistance: 8, //When a pixel distance between a mouse event and the pixel coords of a line is less than this number, it is hit
    hitIdealDistance: 0.02, // The user has to be within this distance on the ideal unit sphere to select the line.
    //dynamicBackStyle is a flag that means the fill color,stroke, and opacity of the lines drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
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
      opacity: { front: 1, back: 1 },
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
      edgeWidth: 4, // edgeWidth/2 is the width of the region around the line that shows the glow
      opacity: { front: 1, back: 1 }
      // Dashing is the same as the drawn version
    },
    //The properties of the line when it is temporarily shown by the line tool while drawing
    temp: {
      // No fill for lines
      strokeColor: {
        front: "hsla(0, 0%, 42%, 1)",
        back: "hsla(0, 0%, 71%, 1)"
      },
      // The width is the same as the default drawn version
      opacity: { front: 1, back: 1 }
      // Dashing is the same as the default drawn version
    }
  },
  circle: {
    showLabelsInitially: true, // Should the labels be show upon creating the circle
    maxLabelDistance: 0.08, // The maximum distance that a label is allowed to get away from the circle
    initialLabelOffset: 0.02, // When making point labels this is initially how far (roughly) they are from the circle
    minimumRadius: 0.02, // Don't create circles with a radius smaller than this
    numPoints: 100, // The number of vertices used to render the circle. These are spread over the front and back parts. MAKE THIS EVEN!
    hitIdealDistance: 0.01, // The user has to be within this distance on the ideal unit sphere to select the circle.
    //dynamicBackStyle is a flag that means the fill, linewidth, strokeColor, and opacity of the circles drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
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
      }, // The thickness of the circle when drawn front/back
      opacity: { front: 1, back: 1 },
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
      edgeWidth: 4, // edgeWidth/2 is the width of the region around the circle (on each side) that shows the glow
      opacity: { front: 1, back: 1 }
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
      },
      // The width is the same as the default drawn version
      opacity: { front: 1, back: 1 }
      // The dash pattern will always be the same as the default drawn version
    }
  },
  label: {
    labelMode: LabelDisplayMode.NameOnly,
    //The scaling of the points relative to the scaled for zoom default size
    scalePercent: { front: 100, back: 90 },
    dynamicBackStyle: true,
    fontSize: 15,
    fillColor: {
      front: "hsla(0, 0%, 0%, 1.0)", //"noFill",
      back: "hsla(0, 0%, 0%, 0.1)" //"noFill"
    },
    opacity: { front: 1, back: 0.8 },
    style: "normal",
    family: "sans-serif",
    decoration: "none",
    rotation: 0,
    glowingStrokeWidth: { front: 3, back: 3 },
    glowingStrokeColor: {
      front: "hsla(0, 0%, 70%, 1)",
      back: "hsla(0, 0%, 85%, 1)"
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
