export default {
  boundaryCircle: {
    radius: 250 /* in pixels */,
    numPoints: 50,
    opacity: 0.5,
    color: "black",
    linewidth: 3
  },
  line: {
    thickness: 3
  },
  point: {
    // The number of vertices that are used to render the point circles front/back/glowing/temp on the sphereCanvas
    numPoints: { front: 4, back: 4 },
    //dynamicRadius is a flag that means the radius of the point will be linked to the size of the sphere
    dynamicRadii: true,
    //dynamicBackFillColor is a flag that means the fill color,stroke, and opacity of the points drawn on the back are automatically calculated based on the value of SETTINGS.contrast
    dynamicBackColor: true,
    //The properties of the point when it is drawn on the sphereCanvas and is not glowing
    drawn: {
      radius: { front: 3, back: 2, rmin: 4, rmax: 7, fbDifference: 1 }, // The radius of the point drawn on the front/back, rmin, rmax, and fbDifferencer are used only if the dynamic is true, then the drawn radius is between rmin and rmax (depending on the size of the sphere) and fbDifference (front-back difference) is the value of the front radius minus back radius.
      fillColor: {
        front: "#FF8080", // { r: 255, g: 128, b: 128 },
        back: "#FFBFBF" // The fill color on the back defaults to a contrast value of 0.5
      },
      strokeColor: {
        front: "#4C4CCD", // { r: 76, g: 76, b: 205 },
        back: "#A5A5E6" // the back stroke color is calculated using the contrast of 0.5
      },
      lineWidth: { front: 2.5, back: 2 }, // The thickness of the edge of the point when drawn
      opacity: { front: 1, back: 1 }
    },
    //The properties of the annular region around a point when it is glowing
    glowing: {
      annularWidth: 2, // width is the width of the annular region around the point that shows the glow it is always bigger than the drawn radius
      fillColor: {
        front: "#ff0000", //"#404040", //{ r: 64, g: 64, b: 64 }, //gray
        back: "#FF7F7F" // the back fill color is calculated using the contrast of 0.5
      },
      opacity: { front: 1, back: 1 }
      //no stroke or linewidth - this is highlighting the object
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
      lineWidth: { front: 1, back: 1 }, // The thickness of the edge of the point when drawn
      opacity: { front: 1, back: 1 }
    },
    hitPixelDistance: 8 //When a pixel distance between a mouse event and the pixel coords of a point is less than this number, it is hit
  },
  rotate: {
    minPixelDistance: 5 // the minimum pixel distance before a new rotation is computed as we click and drag in rotate mode
  },
  /* Separate the sphereCanvas into layers so that the background(one dimensional), 
  background points, background text, midground, foreground (one dimensional), foreground points, 
  and foreground text are rendered in the right order. You can access these layers with
      //First get the scene
      const scene = this.sphereCanvas.scene;
      //Then get the midground
      const midground = scene.children[SETTINGS.layers.foreground] as Two.Group;
  */
  // layers: {
  // Change this to enum (below) so we don't have to renumber when
  // adding new layer
  // },

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
    "segment"
    //"select"
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
