export default {
  viewport: {
    width: 512, height: 512
  },
  sphere: { /* We always assume a UNIT sphere */
    radius: 240, /* in pixels */
    color: 0xffff00,
    opacity: 0.5
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
    /* Seperate Mesh objects into different layers so it will be easier to filter Raycaster intersection */
    sphere: 2,
    point: 3
  },
  /* Controls the lenght of time the tool tip are displayed */
  toolTip: {
    openDelay: 500,
    closeDelay: 250
  },
  /* Sets the length of time that the tool use display message is displayed in a snackbar */
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
