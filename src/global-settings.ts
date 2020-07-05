export default {
  nearlyAntipodal: 0.01, // Two unit vectors, U and V, are nearly antipodal if |U+V| < nearlyAntipodal
  contrast: 0.5, //The number that controls the automatic setting of the back styling for objects that have dynamicBackStyle set to true.
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
    radius: 250 /* default radius in pixels */,
    numPoints: 50,
    opacity: 0.5,
    color: "black",
    linewidth: 3
  },
  // #endregion boundarycircle
  point: {
    hitPixelDistance: 8, //When a pixel distance between a mouse event and the pixel coords of a point is less than this number, it is hit
    hitIdealDistance: 0.02, // The user has to be within this distance on the ideal unit sphere to select the point.
    //dynamicRadius is a flag that means the radius of the point will be linked to zoom level
    dynamicRadii: true,
    //dynamicBackStyle is a flag that means the fill color,stroke, and opacity of the points drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The properties of the point when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      radius: { front: 2, back: 1.5, rmin: 1, rmax: 3, fbDifference: 1 }, // The radius of the point drawn on the front/back, rmin, rmax, and fbDifferencer are used only if the dynamic is true, then the drawn radius is between rmin and rmax (depending on the size of the sphere) and fbDifference (front-back difference) is the value of the front radius minus back radius.
      fillColor: {
        front: "hsla(0, 100%, 75%, 1)", //"#FF8080", // { r: 255, g: 128, b: 128 },#f55742
        back: "hsla(0, 100%, 75%, 1)" //"#FFBFBF" // The fill color on the back defaults to a contrast value of 0.5
      },
      strokeColor: {
        front: "#4C4CCD", // { r: 76, g: 76, b: 205 },
        back: "#A5A5E6" // the back stroke color is calculated using the contrast of 0.5
      },
      strokeWidth: { front: 1, back: 0.5 }, // The thickness of the edge of the point when drawn
      opacity: { front: 1, back: 1 }
      // No dashing for points
    },
    // The properties of the annular region around a point when it is glowing
    glowing: {
      annularWidth: 1, // width is the width of the annular region around the point that shows the glow it is always bigger than the drawn radius
      fillColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.7)" // the back fill color is calculated using the contrast of 0.5
      },
      strokeColor: {
        front: "noStroke",
        back: "noStroke"
      },
      strokeWidth: { front: 1, back: 1 }, // The thickness of the edge of the point when drawn
      opacity: { front: 1, back: 1 }
      // No dashing - this is highlighting the object
    },
    //The properties of the point when it is temporarily shown by the point tool while drawing
    temp: {
      radius: { front: 3, back: 3, difference: 2 }, //The front/back radius of the temp point, difference is only used if dynamic is true and difference is how much smaller the temp radius is than the drawn one.
      fillColor: {
        front: "#808080", // { r: 128, g: 128, b: 128 },
        back: "#BFBFBF" // the back fill color is calculated using the contrast of 0.5
      },
      strokeColor: {
        front: "#000000", // black { r: 0, g: 0, b: 0 },
        back: "#808080" // the back stroke color is calculated using the contrast of 0.5
      },
      strokeWidth: { front: 1, back: 1 }, // The thickness of the edge of the point when drawn
      opacity: { front: 1, back: 1 }
      // No dashing for points
    }
  },
  segment: {
    minimumArcLength: 0.02, // Don't create segments with a length less than this
    numPoints: 20, // The number of vertices used to render the segment. These are spread over the front and back parts. MAKE THIS EVEN!
    hitPixelDistance: 8, //When a pixel distance between a mouse event and the pixel coords of a line is less than this number, it is hit
    hitIdealDistance: 0.02, // The user has to be within this distance on the ideal unit sphere to select the line.
    //dynamicWidth is a flag that means the width of the segment will be linked to zoom level
    dynamicWidth: true,
    //dynamicBackStyle is a flag that means the fill color,stroke, and opacity of the segments drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    drawn: {
      // No fill for line segments
      strokeColor: {
        front: "#4287f5", // { r: 66, g: 135, b: 245 },
        back: "#a0c3fa" // The fill color on the back defaults to a contrast value of 0.5
      },
      strokeWidth: {
        front: 1.5,
        back: 1,
        min: 1, //On zoom this is the minimum thickness displayed
        max: 3 //On zoom this is the maximum thickness displayed
      }, // The thickness of the segment when drawn
      opacity: { front: 1, back: 1 },
      dashArray: {
        offset: { front: 0, back: 0 },
        front: [], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around a segment when it is glowing
    glowing: {
      // No fill for line segments
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.7)" // the back fill color is calculated using the contrast of 0.5
      },
      edgeWidth: 2, // edgeWidth/2 is the width of the region around the segment that shows the glow
      opacity: { front: 1, back: 1 },
      dashArray: {
        offset: { front: 0, back: 0 },
        front: [], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
      }
    },
    //The properties of the circle when it is temporarily shown by the segment tool while drawing
    temp: {
      // No fill for line segments
      strokeColor: {
        front: "#6A6A6A",
        back: "#B4B4B4" // the back fill color is calculated using the contrast of 0.5
      },
      strokeWidth: {
        // The thickness of the edge of the point when drawn
        front: 2.5,
        back: 2
      },
      opacity: { front: 1, back: 1 },
      dashArray: {
        offset: { front: 0, back: 0 },
        front: [], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
      }
    }
  },
  line: {
    minimumLength: 0.02, // Don't create lines with arc length  smaller than this

    numPoints: 50, // The number of vertices used to render the line. These are spread over the front and back parts. MAKE THIS EVEN!
    hitPixelDistance: 8, //When a pixel distance between a mouse event and the pixel coords of a line is less than this number, it is hit
    hitIdealDistance: 0.02, // The user has to be within this distance on the ideal unit sphere to select the line.
    //dynamicWidth is a flag that means the width of the line will be linked to zoom level
    dynamicWidth: true,
    //dynamicBackStyle is a flag that means the fill color,stroke, and opacity of the lines drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    drawn: {
      // No fill for lines
      strokeColor: {
        front: "#4287f5", // { r: 66, g: 135, b: 245 },
        back: "#a0c3fa" // The fill color on the back defaults to a contrast value of 0.5
      },
      strokeWidth: {
        front: 1.5,
        back: 1,
        min: 1, //On zoom this is the minimum thickness displayed
        max: 3 //On zoom this is the maximum thickness displayed
      }, // The thickness of the line when drawn
      opacity: { front: 1, back: 1 },
      dashArray: {
        offset: { front: 0, back: 0 },
        front: [], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around a line when it is glowing
    glowing: {
      // No fill for lines
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.7)" // the back fill color is calculated using the contrast of 0.5
      },
      edgeWidth: 2, // edgeWidth/2 is the width of the region around the line that shows the glow
      opacity: { front: 1, back: 1 },
      dashArray: {
        offset: { front: 0, back: 0 },
        front: [], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
      }
    },
    //The properties of the line when it is temporarily shown by the line tool while drawing
    temp: {
      // No fill for lines
      strokeColor: {
        front: "#6A6A6A",
        back: "#B4B4B4" // the back fill color is calculated using the contrast of 0.5
      },
      strokeWidth: {
        // The thickness of the edge of the point when drawn
        front: 2.5,
        back: 2,
        min: 2, //On zoom this is the minimum thickness displayed
        max: 6 //On zoom this is the maximum thickness displayed
      },
      opacity: { front: 1, back: 1 },
      dashArray: {
        offset: { front: 0, back: 0 },
        front: [], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
      }
    }
  },
  circle: {
    minimumRadius: 0.02, // Don't create circles with a radius smaller than this
    numPoints: 100, // The number of vertices used to render the circle. These are spread over the front and back parts. MAKE THIS EVEN!
    hitIdealDistance: 0.01, // The user has to be within this distance on the ideal unit sphere to select the circle.
    //dynamicWidth is a flag that means the width of the circle will be linked to zoom level
    dynamicWidth: true,
    //dynamicBackStyle is a flag that means the fill, linewidth, strokeColor, and opacity of the circles drawn on the back are automatically calculated based on the value of SETTINGS.contrast and their front counterparts
    dynamicBackStyle: true,
    //The properties of the circle when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      fillColor: {
        front: "hsla(217, 100%, 80%, 0)", //"noFill",
        back: "hsla(217, 100%, 80%, 0)" //"noFill"
      },
      strokeColor: {
        front: "#4287f5", // { r: 66, g: 135, b: 245 },
        back: "#a0c3fa" // The fill color on the back defaults to a contrast value of 0.5
      },
      strokeWidth: {
        // The thickness of the circle when drawn front/back
        front: 1.5,
        back: 1,
        min: 1, //On zoom this is the minimum thickness displayed
        max: 3 //On zoom this is the maximum thickness displayed
      }, // The thickness of the circle when drawn front/back
      opacity: { front: 1, back: 1 },
      dashArray: {
        offset: { front: 0, back: 0 },
        front: [], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
      } // An empty array means no dashing.
    },
    //The properties of the region around a circle when it is glowing
    glowing: {
      // There is no fill for highlighting objects
      strokeColor: {
        front: "hsla(0, 100%, 50%, 1)",
        back: "hsla(0, 100%, 75%, 0.7)" // the back fill color is calculated using the contrast of 0.5
      },
      edgeWidth: 2, // edgeWidth/2 is the width of the region around the circle (on each side) that shows the glow
      opacity: { front: 1, back: 1 },
      dashArray: {
        offset: { front: 0, back: 0 },
        front: [], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
      }
    },
    //The properties of the circle when it is temporarily shown by the circle tool while drawing
    temp: {
      fillColor: {
        front: "hsla(0, 0%, 90%, 0.3)", //"noFill",
        back: "hsla(0, 0%, 50%, 0.3)" //"noFill"
      },
      strokeColor: {
        front: "hsla(0, 0%, 0%, 1.0)",
        back: "hsla(0, 0%, 0%, 0.1)" // "#B4B4B4"
      },
      strokeWidth: { front: 1, back: 1 }, // The thickness of the circle when drawn
      opacity: { front: 1, back: 1 },
      dashArray: {
        offset: { front: 0, back: 0 },
        front: [], // An empty array means no dashing.
        back: [10, 5] // An empty array means no dashing.
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
    "zoomOut"
  ],
  supportedLanguages: [
    { locale: "en", name: "English" },
    { locale: "id", name: "Bahasa Indonesia" }
  ]
};

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
