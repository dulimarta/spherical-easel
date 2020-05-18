export default {
  /* controls the display of the boundary circle (the intersection of the sphere and the screen) */
  boundaryCircle: {
    linewidth: 3,
    color: "black",
    opacity: 1
    //nofill
  },
  line: {
    thickness: 0.01
  },
  point: {
    size: 0.02,
    color: 0x004080,
    glowColor: 0xff0000
  },
  layers: {
    /* Seperate Mesh objects into different layers so it will be easier to filter Raycaster intersection */
    sphere: 2,
    point: 3
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
