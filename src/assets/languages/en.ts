import { LocaleMessages } from "vue-i18n";

export default {
  main: {
    ConstructionsTabToolTip: "Saved Constructions",
    ObjectsTabToolTip: "Objects",
    RedoLastAction: "Redo last action",
    SphericalEaselMainTitle: "Spherical Easel",
    ToolsTabToolTip: "Tools",
    UndoLastAction: "Undo last action"
  },
  toolGroups: {
    EditTools: "Edit Tools",
    DisplayTools: "Display Tools",
    BasicTools: "Basic Tools",
    ConicTools: "Conic Tools",
    ConstructionTools: "Construction Tools",
    AdvancedTools: "Advanced Tools",
    TransformationalTools: "Transformational Tools",
    MeasurementTools: "Measurement Tools",
    DeveloperOnlyTools: "Developer Only Tools"
  },
  buttons: {
    CurrentTool: "Current Tool",
    NoToolSelected: "No Tool Selected",

    MeasureTriangleDisplayedName: "Measure<br>Triangle",
    MeasureTriangleToolTipMessage:
      "Measure the angles and sides of a triangle.",
    MeasureTriangleToolUseMessage:
      "Select three line segments that make a triangle.",

    MeasurePolygonDisplayedName: "Measure<br>Polygon",
    MeasurePolygonToolTipMessage: "Measure the angles and sides of a polygon.",
    MeasurePolygonToolUseMessage:
      "Select three or more line segments that make a polygon with out crossing.",

    CreateAngleDisplayedName: "Measure<br>Angle",
    CreateAngleToolTipMessage: "Calculate Angle",
    CreateAngleToolUseMessage:
      "Select two lines/segments or three points to calculate an angle.",

    CreateAntipodalPointDisplayedName: "Antipodal<br>Point",
    CreateAntipodalPointToolTipMessage: "Create Antipode",
    CreateAntipodalPointToolUseMessage:
      "Select a location to create a point (if necessary) and its antipode",

    CreatePolarDisplayedName: "Polar<br>&nbsp;",
    CreatePolarToolTipMessage: "Create polar line or polar points",
    CreatePolarToolUseMessage:
      "Select a location to create a point (if necessary) and its polar line or select a line segment or line to create both polar points",

    CreateMidpointDisplayedName: "Midpoint<br>&nbsp;",
    CreateMidpointToolTipMessage: "Create the midpoint of a line segment.",
    CreateMidpointToolUseMessage:
      "Select a line segment to create its midpoint.",

    CreateAngleBisectorDisplayedName: "Angle<br>Bisector",
    CreateAngleBisectorToolTipMessage: "Create the angle bisector of an angle.",
    CreateAngleBisectorToolUseMessage:
      "Select an angle to create its bisector.",

    CreateNSectAngleDisplayedName: "N-Sect<br>Angle",
    CreateNSectAngleToolTipMessage: "Divide an angle into N equal pieces.",
    CreateNSectAngleToolUseMessage:
      "Use a number key to select a number then select an angle to divide into that many equal pieces.",

    CreateNSectSegmentDisplayedName: "N-Sect<br>Segment",
    CreateNSectSegmentToolTipMessage:
      "Divide a line segment into N equal pieces.",
    CreateNSectSegmentToolUseMessage:
      "Use a number key to select a number then select a line segment to divide into that many equal pieces.",

    CreateCircleDisplayedName: "Create<br>Circle",
    CreateCircleToolTipMessage: "Insert circle",
    CreateCircleToolUseMessage:
      "Click to insert a circle with a given center point and through a second point.",

    CreateCoordinateDisplayedName: "Coordinates<br>&nbsp;",
    CreateCoordinateToolTipMessage: "Measure x,y,z coordinates",
    CreateCoordinateToolUseMessage:
      "Select a point to measure its x,y,z coordinates on the sphere",

    CreateEllipseDisplayedName: "Ellipse<br>&nbsp;",
    CreateEllipseToolTipMessage: "Insert ellipse",
    CreateEllipseToolUseMessage:
      "Select two distinct non-antipodal points and another point on the ellipse",

    CreateIntersectionDisplayedName: "Intersection<br>Point(s)",
    CreateIntersectionToolTipMessage: "Intersect two one-dimensional objects",
    CreateIntersectionToolUseMessage:
      "Select two one-dimensional objects to create their intersection point(s).",

    CreateLineSegmentDisplayedName: "Create Line<br>Segment",
    CreateLineSegmentToolTipMessage: "Insert line segment",
    CreateLineSegmentToolUseMessage:
      "Click to insert line segment defined by two points.",

    CreateLineDisplayedName: "Create<br>Line",
    CreateLineToolTipMessage: "Insert line",
    CreateLineToolUseMessage: "Click to insert a line defined by two points.",

    CreatePointDistanceDisplayedName: "Point<br>Distance",
    CreatePointDistanceToolTipMessage: "Distance of Two Points",
    CreatePointDistanceToolUseMessage:
      "Select two points to measure the distance between them",

    CreatePointOnOneDimDisplayedName: "Point On<br>Object",
    CreatePointOnOneDimToolTipMessage:
      "Select a one-dimensional object to place a point on",
    CreatePointOnOneDimToolUseMessage:
      "Select a one-dimensional object to add a point to.",

    CreatePointDisplayedName: "Create<br>Point",
    CreatePointToolTipMessage: "Insert point",
    CreatePointToolUseMessage: "Click to insert a free point.",

    CreateSegmentLengthDisplayedName: "Line Segment<br>Length",
    CreateSegmentLengthToolTipMessage: "Length of Line Segment",
    CreateSegmentLengthToolUseMessage:
      "Click this button to compute the length of Line Segment",

    CreateSliderDisplayedName: "Measurement<br>Slider",
    CreateSliderToolTipMessage: "User Controlled Value",
    CreateSliderToolUseMessage: "Click this button to create a value slider ",

    CreateTangentDisplayedName: "Tangents<br>&nbsp;",
    CreateTangentToolTipMessage: "Tangents through a point",
    CreateTangentToolUseMessage:
      "Create the tangent lines to a selected non-straight one-dimensional object and selected location.",

    CreatePerpendicularDisplayedName: "Perpendicular<br>&nbsp;",
    CreatePerpendicularToolTipMessage: "Perpendicular(s) through a point",
    CreatePerpendicularToolUseMessage:
      "Create the perpendicular line(s) to a selected one-dimensional object and selected location.",

    DeleteDisplayedName: "Delete<br>&nbsp;",
    DeleteToolTipMessage: "Delete Objects",
    DeleteToolUseMessage:
      "Select objects to delete. Hold the SHIFT key to select from the back of the sphere.",

    HideDisplayedName: "Hide<br>Objects",
    HideObjectToolTipMessage: "Hide objects",
    HideObjectToolUseMessage:
      "Select objects to hide. Hold the SHIFT key to select from the back of the sphere.",

    MoveDisplayedName: "Move<br>Objects",
    MoveObjectToolTipMessage: "Move object",
    MoveObjectToolUseMessage:
      "Click and drag an object to move it. Movable objects include labels, free points, and line segments with antipodal endpoints. Hold the SHIFT key to select from the back of the sphere.",

    PanZoomInDisplayedName: "Zoom In<br>Pan",
    PanZoomInToolTipMessage: "Pan or Zoom In",
    PanZoomInToolUseMessage:
      "Click to zoom in at the location of the mouse. Click and drag to pan the current view.",

    PanZoomOutDisplayedName: "Zoom Out<br>Pan",
    PanZoomOutToolTipMessage: "Pan or Zoom Out",
    PanZoomOutToolUseMessage:
      "Click to zoom out at the location of the mouse. Click and drag to pan the current view.",

    ZoomFitDisplayedName: "Zoom Fit<br>&nbsp;",
    ZoomFitToolTipMessage: "Zoom Fit",
    ZoomFitToolUseMessage: "Fits the sphere in the available space.",

    RotateDisplayedName: "Rotate<br>Sphere",
    RotateSphereToolTipMessage: "Rotate Sphere",
    RotateSphereToolUseMessage: "Click and drag to rotate the sphere.",

    SelectDisplayedName: "Select<br>Objects",
    SelectToolTipMessage: "Select Objects",
    SelectToolUseMessage:
      "Click on objects to select them, hold the Alt key to add to your selection.",

    ToggleLabelDisplayedName: "Toggle Label<br>Display",
    ToggleLabelToolTipMessage: "Toggle Display Of Labels",
    ToggleLabelToolUseMessage:
      "Click on objects to toggle the display of their labels.",

    CreateIconDisplayedName: "Create<br>Icon",
    CreateIconToolTipMessage: "Create Icon SVG Paths",
    CreateIconToolUseMessage:
      "Click to create an the SVG paths for an icon from current view."
  },
  settings: {
    title: "Preferences"
  },
  objects: {
    points: "Points | Point | point",
    lines: "Lines | Line | line",
    circles: "Circles | Circle| circle",
    segments: "Line Segments | Line Segment | line segment",
    measurements: "Measurements | Measurement | measurement",
    ellipses: "Ellipses | Ellipse |ellipse",
    parametrics: "Parametrics | Parametric |parametric"
  },

  style: {
    dashArrayReverse: "Switch Dash and Gap",
    dashPatternReverseArrayToolTip:
      "Switch the dash and gap lengths so that the gap length can be less than the dash length",
    labelStyle: "Label Style",
    foregroundStyle: "Foreground Style",
    backgroundStyle: "Background Style",
    advancedStyle: "Advanced Style",

    back: "Back",
    front: "Front",
    value: "Value",
    frontAndBack: "Front and Back",

    point: "1 Point | {count} Points",
    line: "1 Line | {count} Lines",
    segment: "1 Segment| {count} Segments",
    circle: "1 Circle | {count} Circles",
    label: "1 Label | {count} Labels",
    angleMarker: "1 Angle Marker | {count} Angle Markers",
    ellipse: "1 Ellipse | {count} Ellipses",
    parametric: "1 Parametric | {count} Parametrics",
    polygon: "1 Polygon | {count} Polygons",

    showLabels: "Show Label(s)",
    showObjects: "Show Object(s)",

    noFill: "No Fill",
    noStroke: "No Stroke",

    noFillLabelTip:
      "If you want to make the labels only appear on the front of the sphere disable automatic back styling and check 'No Fill' on the Label Back Fill Color. Similarly, to make the labels only appear on the back of the sphere disable automatic back styling and check 'No Fill' on the Label Front Fill Color.",
    noFillTip:
      "Check this to remove the fill or stoke from the selected object(s).",
    selectAnObject: "Select Object(s) To Style",
    closeOrSelect: "Close the styling panel or select object(s).",
    toSelectObjects: "To select objects:",
    selectionDirection1: "Click on glowing objects to select them.",
    selectionDirection2:
      "Hold the Alt/Option key to add or subtract from your selection.",
    selectionDirection3:
      "Press a number key to select an object at that depth.",
    selectionDirection4:
      "Press the p key and click in any empty location to add all points. Similar for lines (l), line segments (s), circles (c), ellipses (e), angle markers (a), parametrics (P), and polygons (O).",
    closeStylingPanel: "Close Styling Panel",
    noSelectionToolTip:
      "No objects are currently selected. Either select objects with the selection tool or click this button to close the style panel.",

    labelNotVisible: "Label(s) not visible.",
    clickToMakeLabelsVisible:
      "Click the button below to make all labels visible and then to style them.",
    makeLabelsVisible: "Make Label(s) Visible",
    labelsNotShowingToolTip:
      "Not all labels in the current selection are visible. Click this button to make them visible and then they will be styleable.",

    objectNotVisible: "Object(s) not visible.",
    clickToMakeObjectsVisible:
      "Click the button below to make all objects visible and then to style them.",
    makeObjectsVisible: "Make Object(s) Visible",
    objectsNotShowingToolTip:
      "Not all objects in the current selection are visible. Click this button to make them visible and then they will be styleable.",

    backStyleDisagreement: "Back Styling Disagreement",
    backStyleDifferentValuesToolTip:
      "The selected objects have different automatic back styling settings. At least one want to use automatic back styling and at least one does not want to. Click the button make the automatic back styling the same for all selected objects.",

    styleDisagreement: "Common Style Disagreement",
    differentValues:
      "The selected objects have different values for at least one of these style options. Click the button and edit a style to make all selected objects have that style value in common.",
    enableCommonStyle: "Overide",
    differentValuesToolTip:
      "The selected objects have different values for at least one style option. Click the button and edit a style to make *all* selected objects have *all* the styles in this block have a common value(s).",

    singleLabelTextToolTip: "Enter a label text.",
    multiLabelTextToolTip:
      "You cannot edit the text of more than one label at a time.",

    dynamicBackStyleHeader: "Automatic Back Styling",
    disableDynamicBackStyle: "Disable",
    enableDynamicBackStyle: "Enable",
    disableDynamicBackStyleToolTip:
      "The styling of objects on the back of the sphere is handled automatically unless disabled. The automatic style depends on a Global Back Styling Contrast percent and the front styling. The contrast is a global variable and applies to all objects the have Dynamic Back Styling enabled. If the contrast is 100%, then there is no difference between the styling of objects on the front and the back of the sphere. If the contrast is 0%, then colors on back of sphere are almost transparent and size reduction is maximized for points and thicknesses. Dash pattern is not effected by the contrast. The Back Contrast percent may be set in the Background Style panel.",

    clearChanges: "Undo",
    clearChangesToolTip:
      "Revert the selected object(s) back to the style they had when they were *first* selected.",

    restoreDefaults: "Apply Defaults",
    restoreDefaultsToolTip:
      "Revert the selected object(s) back to their default(s).",

    showColorInputs: "Color Inputs",
    showColorInputsToolTip: "Click this to enter color code values directly.",

    disableBackStyleContrastSlider:
      "Click To Disable Dynamic Back Style For Selected Object(s)",
    disableBackStyleContrastSliderToolTip:
      "The selected objects have dynamic back style enabled. Click this button disable it for only the selected object(s). Then you can change the back style of the selected object(s) using the style options in this panel.",

    disableDashPatternSlider: "Set No Dash Pattern",
    disableDashPatternSliderToolTip:
      "Click this button to set no dash pattern on all selected object(s).",

    enableBackStyleContrastSlider:
      "Click To Enable Dynamic Back Style For Selected Object(s)",
    enableBackStyleContrastSliderToolTip:
      "The selected objects do not have dynamic back style enabled. Click this button enable it and adjust the Back Contrast Slider.",

    moreStyleOptions: "More",
    lessStyleOptions: "Less",
    toggleStyleOptionsToolTip: "More/Less label styling options.",

    convertSelectionToLabels:
      "A mix of label and non-label objects were selected when all label displays were changed. In order to do this the current selection was converted to all the labels of those objects.",

    dashPattern: "Dash Pattern",
    dashPatternCheckBoxToolTip:
      "Enable or Disable a dash pattern for the selected objects.",

    fillColor: "Fill Color",
    labelFrontFillColor: "Label Front Fill Color",
    labelBackFillColor: "Label Back Fill Color",
    pointRadiusPercent: "Point Radius",
    angleMarkerRadiusPercent: "Angle Marker Radius",
    angleMarkerOptions: "Angle Marker Options",
    angleMarkerDoubleArc: "Double Arc",
    angleMarkerTickMark: "Tick Mark",

    strokeColor: "Stroke Color",
    strokeWidthPercent: "Stroke Width",
    dynamicBackStyle: "Dynamic Back Style",
    globalBackStyleContrast: "Global",
    backStyleContrast: "Back Style Contrast",
    backStyleContrastToolTip:
      "By default the back side display style of an object is determined by the front style of that object and the value of Global Back Style Contrast. A Back Style Contrast of 100% means there is no color or size difference between front and back styling. A Back Style Contrast of 0% means that the object is invisible and its size reduction is maximized.",

    labelStyleOptions: "Label Text Options",
    labelStyleOptionsMultiple: "(Multiple)",
    labelText: "Label Text",
    labelCaption: "Label Caption",
    renameLabels: "Rename All",
    maxLabelDisplayTextLengthWarning:
      "Label must be between 1 and {max} characters long.",
    minLabelDisplayTextLengthWarning:
      "Label must contain at least 1 character.",
    maxLabelDisplayCaptionLengthWarning:
      "Must be at most {max} characters long.",
    labelTextScalePercent: "Label Scale",
    labelTextRotation: "Label Rotation",
    labelDisplayText: "Label Text",
    labelDisplayCaption: "Label Caption",
    labelTextStyle: "Label Text Style",
    labelTextFamily: "Label Text Family",
    genericSanSerif: "Sans-Serif Font",
    genericSerif: "Serif Font",
    monospace: "Monospace",
    cursive: "Cursive",
    fantasy: "Fantasy",
    normal: "Normal",
    italic: "Italic",
    bold: "Bold",
    none: "None",
    underline: "Underline",
    strikethrough: "Strikethrough",
    overline: "Overline",
    labelTextDecoration: "Label Text Decoration",
    labelDisplayMode: "Label Display Mode",
    labelDisplayModes: {
      nameOnly: "Name Only",
      captionOnly: "Caption Only",
      valueOnly: "Value Only",
      nameAndCaption: "Name and Caption",
      nameAndValue: "Name and Value"
    },
    labelObjectVisibility: "Label And Object Visibility",
    selectObjectsToShow: "Select Objects to Show",
    labelVisible: "Label Visible",
    objectVisible: "Object Visible"
  },
  handlers: {
    nEqualOneAngleNSect:
      "You must choose to divide angles into more than 1 equal pieces.",
    nSetAngleNSect: "You are dividing angles into {number} equal pieces.",
    bisectedAngleAlready:
      "Angle {angle} has already been bisected. Choose another angle or divide this one into more than two equal pieces.",
    nSectedAngleAlready:
      "Angle {angle} has already been divided into {number} equal pieces. Choose another angle or divide it into something other than {number} equal pieces.",
    angleSuccessfullyBisected: "Angle {angle} has be successfully bisected",
    angleSuccessfullyNSected:
      "Angle {angle} has be successfully divided into {number} equal pieces.",
    nEqualOneSegmentNSect:
      "You must choose to divide segments into more than 1 equal pieces.",
    nSetSegmentNSect: "You are dividing segments into {number} equal pieces.",
    bisectedSegmentAlready:
      "Segment {segment} has already been bisected. Choose another segment or divide this one into more than two equal pieces.",
    nSectedSegmentAlready:
      "Segment {segment} has already been divided into {number} equal pieces. Choose another segment or divide it into something other than {number} equal pieces.",
    segmentSuccessfullyBisected:
      "Segment {segment} has be successfully bisected",
    segmentSuccessfullyNSected:
      "Segment {segment} has be successfully divided into {number} equal pieces.",
    ellipseAntipodalSelected:
      "The foci of an ellipse are not allowed to be antipodal or identical. Select another location.",
    ellipseFocus2Selected:
      "All foci of the ellipse selected. Now select a point on the ellipse.",
    ellipseFocus1Selected:
      "One focus of the ellipse selected. Now select a second non-antipodal focus.",
    ellipseInitiallyToSmall:
      "To create an ellipse initially you must select a point on the ellipse that is further away from each focus. Select a different location further from the foci.",

    circleCenterSelected:
      "Center of circle selected. Now select a point on the circle.",
    duplicatePointMessage: "Duplicate point. Select another.",
    duplicatePointDistanceMeasurement:
      "The distance between points {pt0Name} and {pt1Name} has already been measured. This distance is measurement {measurementName}.",
    newMeasurementAdded: "New measurement {name} added.",
    selectAnotherPoint: "Select the next point.",
    duplicatePointCoordinateMeasurement:
      "The coordinates of point {ptName} have already been measured.",
    newSegmentMeasurementAdded: "New measurement {name} added.",
    duplicateSegmentMeasurement:
      "The selected segment has already been measured. The length of segment {segName} is measurement {measurementName}.",
    duplicateLineMessage: "Duplicate line. Select another.",
    duplicateLineAngleMeasurement:
      "The angle between lines {line0Name} and {line1Name} has already been measured. This angle is measurement {measurementName}.",
    duplicateSegmentMessage: "Duplicate segment. Select another.",
    duplicateSegmentAngleMeasurement:
      "The angle between segments {seg0Name} and {seg1Name} has already been measured. This angle is measurement {measurementName}.",
    segmentsWithOutCommonEndpoint:
      "The selected segment does not have a common endpoint with the previously selected one. Select another.",
    segmentWithOutEndpointOnLine:
      "The selected segment does not have a endpoint on the previously selected line. Select another.",
    lineDoesNotContainEndpointOfSegment:
      "The selected line does contain an endpoint on the previously selected segment. Select another.",
    duplicateSegmentLineAngleMeasurement:
      "The angle between segment {segName} and line {lineName} has already been measured. This angle is measurement {measurementName}.",
    antipodalPointMessage:
      "The selected point is antipodal or equal to the first selected point. Select another.",
    antipodalPointMessage2:
      "The selected point is antipodal or equal to the second selected point. Select another.",
    newAngleAdded: "New angle measure added.",
    newAngleAddedV2: "New angle measure {name} added.",
    duplicateThreePointAngleMeasurement:
      "The angle with vertex {pt1Name}, from {pt0Name} and to {pt2Name} has already been measured. This angle is measurement {measurementName}.",
    selectMorePoints: "Select {needed} more point(s).",
    selectAnotherLineOrSegment: "Select 1 more line or segment.",
    newCoordinatePointMeasurementAdded: "New coordinate measurements added",
    intersectionOneDimensionalSelected:
      "One dimensional object {name} selected. Select another.",
    intersectionOneDimensionalDuplicate: "Duplicate object. Select another.",
    intersectionOneDimensionalNotIntersect:
      "Selected objects do not intersect.",
    intersectionOneDimensionalAlreadyExists:
      "Intersection point already exists.",
    intersectionOneDimensionalPointCreated:
      "One intersection point successfully created.",
    moveHandlerNothingSelected: "No object selected. Rotating Sphere.",
    moveHandlerObjectOnBackOfSphere:
      "Were you trying to move an object on the back of the sphere?  If so, press and hold the shift key to select objects on the back of the sphere.",
    panZoomHandlerZoomInLimitReached: "Zoom in limit reached.",
    panZoomHandlerZoomOutLimitReached: "Zoom out limit reached.",
    selectionUpdate:
      "Selection Update: {number} objects selected. Hold the Alt/Option key to add or subtract from the current selection.",
    selectionUpdateNothingSelected: "No objects selected.",
    pointCreationAttemptDuplicate: "There is already a point at this location.",
    circleCreationAttemptDuplicate:
      "There is already a circle with this center and radius.",
    ellipseCreationAttemptDuplicate:
      "There is already an ellipse with these foci and angle sum.",
    segmentCreationAttemptDuplicate:
      "There is already a line segment with these endpoints, this normal vector, and length.",
    lineCreationAttemptDuplicate:
      "There is already a line with this normal vector.",
    lineThruPointPointSelected:
      "Point selected. Now select a one dimensional object to determine the perpendicular.",
    lineThruPointLineSelected:
      "Line {name} selected. Now select a location to create a new point or to create a point on an object.",
    lineThruPointSegmentSelected:
      "Segment {name} selected. Now select a location to create a new point or to create a point on an object.",
    lineThruPointCircleSelected:
      "Circle {name} selected. Now select a location to create a new point or to create a point on an object.",
    lineThruPointEllipseSelected:
      "Ellipse {name} selected. Now select a location to create a new point or to create a point on an object.",
    lineThruPointParametricSelected:
      "Parametric {name} selected. Now select a location to create a new point or to create a point on an object.",

    antipodeDuplicate: "The antipode of this point has already been created.",
    polarLineDuplicate:
      "The polar line of this point has already been created.",
    polarPointDuplicate:
      "The polar points of this {object} has already been created.",
    newSegmentIntersectsOrToClose:
      "The selected segment intersects the previously selected segments or the free endpoint of the selected segment is too close to one of the previously selected segments.",
    newSegmentMustHaveEndpointInCommon:
      "The selected segment doesn't have an endpoint in common with the end point of the previously selected segments.",
    newSegmentMustCloseTriangle:
      "The selected segment doesn't form a triangle with the previously selected segments.",
    previouslyMeasuredPolygon:
      "This polygon was measured previously.  See measurement {token}.",
    newPolygonAdded: "A new polygon was created."
  },

  objectTree: {
    aMidLineOf: "The line bisecting angle {angle}.",
    anNsectLineOf:
      "Angle {angle} is divided into {N} equal parts and this is the line with index {index}.",
    aMidPointOf: "A midpoint of segment {segment}",
    anNsectPointOf:
      "Segment {segment} is divided into {N} equal parts and this is the point with index {index}.",
    bigonWithEdges:
      "The area of a bi-gon with ordered edges {edges}. Area: {val}",
    triangleWithEdges:
      "The area of a triangle with ordered edges {edges}. Area: {val}",
    polygonWithEdges:
      "The area of a polygon with ordered edges {edges}. Area: {val}",
    expression: "Expression",
    parserError: "Reached end of input while parsing expression",
    expectedRightParenthesis: "Expected ')' at {text}",
    expectedLeftParenthesis: "Expected '(' at function name {text}}",
    expectedRightButParenthesis: "Expected ')', but received {text}",
    unexpectedInput: "Unexpected input at {text}",
    unexpectedToken: "Unexpected token at {text}",
    nonNumericExponents: "Can't handle non-numeric exponents",
    unknownFunction: "Unknown mathematical function {text}.",
    unhandledTokenType: "Unhandled token type {text} {text2}",
    undefinedVariable: "Undefined variable {text}",
    divideByZero: "Attempted to divide by zero.",
    startOfInput: "Start of input",
    cycleValueDisplayMode:
      "Click to cycle to the next value display mode including multiples of pi and degrees.",
    toggleDisplay: "Toggle the display of the corresponding object.",
    toggleLabelDisplay:
      "Toggle the  display of the corresponding object's label.",
    slider: "Slider",
    sliderValue: "{token}: Slider: {val}",
    noObjectsInDatabase: "No objects in database",
    result: "Result",
    calculationExpression: "Calculation Expression",
    min: "Min",
    max: "Max",
    step: "Step",
    create: "Create",
    anglePoints:
      "Angle formed by points {p1}, {p2}, and {p3} with measure {val}.",
    angleSegments:
      "Angle formed by lines {seg1} and {seg2} with measure {val}.",
    angleLines:
      "Angle formed by segments {line1} and {line2} with measure {val}.",
    angleSegmentLine:
      "Angle formed by segment {seg} and line {line} with measure {val}.",
    angleLineSegment:
      "Angle formed by line {line} and segment {seg} with measure {val}.",
    calculationDescription:
      "Calculation based on expression {str} with value {val}",
    calculationValue: "{token}: Calc: {val}",
    coordinateOf: "The {axisName} coordinate of point {pt}: {val}",
    coordOf: "{token}: {pt} {axisName}: {val}",
    x: "x",
    y: "y",
    z: "z",
    distanceBetweenPts:
      "Distance between points {pt1} and {pt2}. Distance: {val}",
    distanceValue: "{token}: Dist: {val}",
    segmentLength: "Length of segment {seg}. Length: {val}",
    antipodeOf: "Antipode of point {pt}",
    aPolarPointOf: "Polar point of line {line} with index {index}.",
    circleThrough: "Circle with center {center} through point {through}",
    ellipseThrough:
      "Ellipse with foci {focus1} and {focus2} through point {through}",
    intersectionPoint:
      "Intersection of {typeParent1} {parent1} and {typeParent2} {parent2} with index {index}",
    lineThrough:
      "Line through points {pt1} and {pt2} with normal vector <{normalX},{normalY},{normalZ}>",
    polarLine:
      "Polar line to point {pt} with normal vector <{normalX},{normalY},{normalZ}>",
    segmentThrough:
      "Line segment with endpoints {pt1} and {pt2} and normal vector <{normalX},{normalY},{normalZ}>",
    pointOnOneDimensional: "Point on {typeParent} {parent}",
    freePoint: "Free point",
    perpendicularLineThru:
      "Perpendicular line to {oneDimensionalParentType} {oneDimensional} through point {pt} with index {index}",
    tangentLineThru:
      "Tangent line to {oneDimensionalParentType} {oneDimensional} through point {pt} with index {index}",
    deleteNode: "Delete the selected object.",

    parametricCurves: "Parametric Curves",

    parametricCoordinates: "Parametric Formulas",

    xParametricCoordinate: "X(t) formula",
    yParametricCoordinate: "Y(t) formula",
    zParametricCoordinate: "Z(t) formula",
    xCoordExpressionTip:
      "An expression (possibly depending on measurement tokens) for the x coordinate for the parametric curve.",
    yCoordExpressionTip:
      "An expression (possibly depending on measurement tokens) for the y coordinate for the parametric curve.",
    zCoordExpressionTip:
      "An expression (possibly depending on measurement tokens) for the z coordinate for the parametric curve.",
    tExpressionData: "Optional Tracing Expressions",
    tMinExpression: "Minimum Parameter Tracing Expression",
    tMinExpressionTip:
      "An optional expression (that MUST depend on measurements tokens) that gives the starting t value when tracing the parametric curve. This value is always evaluated to be greater than or equal to the minimum parameter value.",
    tMaxExpression: "Maximum Parameter Tracing Expression",
    tMaxExpressionTip:
      "An optional expression (that MUST depend on measurements tokens) that gives the ending t value when tracing the parametric curve. This value is always evaluated to be less than or equal to the maximum parameter value.",
    exactlyOneEmptyTExpression:
      "Maximum and Minimum Parameter Tracing Expression must either both be empty or both be defined.",

    tMinNumber: "Minimum parameter(t) Value",
    tMinNumberTip:
      "A required absolute minimum t (must be a number) value for tracing the parametric curve that is the lower bound for the optional tMin Tracing Expression.",
    tMaxNumber: "Maximum parameter(t) Value",
    tMaxNumberTip:
      "A required absolute minimum t (must be a number) value for tracing the parametric curve that is the upper bound for the optional tMax Tracing Expression.",
    cuspParameterValues: "Cusp t values (if any)",
    cuspParameterValuesTip:
      "The comma separated list of the t (each must be a number) values of the parameter (if any) where the parametric curve has cusps. If the curve is closed and their is a cusp point at the point of closure, include both the minimum and maximum parameter value.",
    cuspValuesOutOfBounds:
      "At least one of the cusp parameter values is not between the minimum and maximum parameter values. Check the cusp parameter values.",
    currentTValue: "Current Value: ",
    tMinNotLessThantMax:
      "The minimum t value must be less than the maximum t value for at least one set of measurements. Change at least one t value expressions.",
    notAUnitParametricCurve:
      "Parametric curves must on the unit sphere; this curve was not unit at a t value of {tVal}. Check the coordinates of the parametric formulas.",
    notPerpCurveAndDerivative:
      "The parametric derivative must be perpendicular to the the unit parametric curve vector; these were not perpendicular at a t value of {tVal}.",

    endPointOfParametric: "The {end} point of parametric curve {parent}.",
    tracePointOfParametric: "The trace point of parametric curve {parent}.",
    parametricDescription:
      "Parametric curve with coordinates ({xExpression}, {yExpression}, {zExpression}) for t from {tMinNumber} to {tMaxNumber}.",
    duplicateParametricCurve: "Duplicate parametric curves are not allowed.",
    unableToComputeTheDerivativeOf:
      "We were unable to compute the derivative of one of the coordinate expressions. Error: {error}"
  },

  constructions: {
    privateConstructions: "Private Constructions",
    publicConstructions: "Public Constructions",
    unsavedConstructionMsg:
      "You have unsaved work. Do you want to stay on this page and keep your work or switch to another page and discard your work.",
    unsavedObjectsMsg:
      "You have unsaved objects. Loading a new construction will remove all the current ones. Do you want to proceed or cancel?",
    firestoreConstructionLoaded: "Construction successfully loaded.",
    firestoreConstructionSaved: "Construction successfully saved.",
    firestoreConstructionDeleted: "Construction successfully deleted.",
    firestoreSaveError: "Construction was not saved.",
    constructionNotFound: "Construction {docId} not found."
  }
} as LocaleMessages;
