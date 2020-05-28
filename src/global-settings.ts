export default {
  viewportAspectRatio: {
    /* Use aspect ratio, and allow the canvas to fit available space.
     * This is only the aspect ration of the containing viewport, aspect ratio
     * of the sphere canvas is always 1:1
     */
    width: 4,
    height: 3
  },
  sphere: {
    // TODO: Rename this to boundaryCircle
    /* We always assume a UNIT sphere */
    radius: 250 /* in pixels */,
    color: "black",
    opacity: 1,
    linewidth: 2,
    numPoints: 36
  },
  line: {
    thickness: 3
  },
  point: {
    size: 0.02,
    color: 0x004080,
    glowColor: 0xff0000
  },
  layers: {
    /* Seperate objects into different layers: background, foreground, etc */
    totalLayers: 2,
    SPHERE: 0,
    LABEL: 1
  },
  /* Controls the length of time (in ms) the tool tip are displayed */
  toolTip: {
    openDelay: 500,
    closeDelay: 250
  },
  /* Sets the length of time (in ms) that the tool use display message is displayed in a snackbar */
  toolUse: {
    delay: 2000
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
  ],
  supportedLanguages: [
    { locale: "en", name: "English" },
    { locale: "id", name: "Bahasa Indonesia" }
  ]
};
