---
title: Display Tools
lang: en-US
---

# Display Tools

Each of these tools allows a user to adjust the display of an arrangement.

::: tool-title

## Hide Object <IconBase notInline icon-name="hide" />

:::
::: tool-description

Hide selected objects.

::: tool-details

- Mousing over an object will highlight the object in focus and clicking will hide that object.
- When an object is hidden its label is also hidden.
- While using this tool, if the user would like to show all the objects that the user has hidden _since_ _the_ _tool_ was activated, press the <kbd>s</kbd> (lowercase s) key and those objects will be shown. (This is equivalent to undoing all the hiding operations since the tool was activated.)
- While using this tool, if the user would like to show _all_ hidden objects, press the <kbd>S</kbd> (Capital S) key and all hidden objects will be shown.
- If this tool is activated with any objects selected, the selected objects are hidden automatically.

:::

::: tip
If the user wishes to display a label without displaying the object, the user can open the Objects Tab <IconBase icon-name="objectsTab" />, navigate to and expand the appropriate object type, and then, in the row of the object, use the display label toggle button <IconBase icon-name="showNodeLabel" /> or <IconBase icon-name="hideNodeLabel" /> to show or hide the label.
:::

::: tool-title

## Toggle Label Display <IconBase notInline icon-name="toggleLabelDisplay" />

:::
::: tool-description

Hide or show the label of selected objects.

::: tool-details

- Mousing over an object will highlight the object in focus and clicking will toggle the visibility of that object's label. If the object in focus is a label and the user clicks it, that label is hidden.
- To show all visible objects' labels, use the press the <KeyShortcuts macLetter="s" pcLetter="s" />.
- To hide all visible objects' labels, use the press the <KeyShortcuts macLetter="h" pcLetter="h" />.
- If this tool is activated with any object(s) selected, the display of the selected objects' labels are toggled automatically.

:::

::: tip
If when clicking at a location more than one object's label becomes hidden or shown and this is not the desired behavior, then [Undo](/tools/edit#undo-and-redo) <IconBase icon-name="undo" /> you first action, change to the [Selection Tool](/tools/edit#selection) <IconBase icon-name="select" />, and then select the object or objects whose label's you want to toggle. Then activating this tool will toggle the appropriate labels.
:::

::: tool-title

## Move <IconBase notInline icon-name="move" />

:::
::: tool-description
Move the location of a free object.
::: tool-details

- Mousing over an object will highlight a free and movable object. Mouse press and dragging on that object will move the location of the object on the sphere and the location of all objects that depends on it will be updated. Mouse release will terminate the movement of that object and place it at a new location.
- **Not** all objects are movable. Only free objects are movable. There are several kinds of free objects:

  1. Points which reside in the top layer of the dependency structure of a construction. For example, points created on the sphere that are not snapped - see this [tip](/tools/basic#point) - to an intersection point.

  2. Lines, line segments, circles, and ellipses which reside in second to top layer of the dependency structure. For example, suppose three points are created on the sphere and are not snapped to any object. Then they are in the top or first layer of the dependency structure. If those points are used to create an ellipse then the ellipse is in the second layer of the dependency structure. These kinds of objects are free and therefore movable.

  3. Points on objects and objects that depend only on points on objects are also free and moveable. For example, suppose two circles are created that intersect at two points and a line segment is constructed between the intersection points. Further suppose that two points are created on the line segment and are used to create a circle $C$. While the line segment is not free, the points on it and the circle $C$ are free and moveable.

  4. Line segments that have a length of $\frac{\pi}{2}$ are free. For example, if two lines are created then a line segment between the two intersection points is free (even though the intersection points are not free). The line segment will rotate about its endpoints.

  5. (TODO: not implemented) You can move the location of a slider displayed in the Sphere Frame.

- Moving a free circle or ellipse is the same thing as simultaneously moving the points or objects on which it depends.
- Moving a free line or line segment rotates it about one of the defining points of the line or an endpoint of line segment. Pressing the <KeyShortcuts macOpt pcAlt /> key toggles the point that the line or line segment rotates about.
- Moving a free line or line segment with the <KeyShortcuts macCtrl pcCtrl /> key pressed, moves both endpoints or defining points simultaneously. They both rotate about the perpendicular to the plane containing the last mouse location and the current mouse location as the user drags.
- Polygons, non-ellipse conics, antipodal points, parametric curves, and objects created using the Construction Tools (except point on object) and Advanced Tools are not moveable. Parametric curves can be "moved" by using a Measurement Object <IconBase icon-name="measurementObject" /> or a Calculation Object <IconBase icon-name="calculationObject" /> in the parametric definition. See [Parametric Curve](/tools/advanced#parametric-curve) for more details
- If the user clicks on an empty space in the Sphere Canvas and then drags, the sphere is rotated (i.e. all objects move, but not relative to each other).
- If this tool is activated with objects selected, the selected objects are unselected and ignored.

:::

::: tip
When moving a free line or line segment pressing the <KeyShortcuts macOpt pcAlt /> key toggles the point that the line or line segment rotates about. To move both endpoints of a line segment (or both points defining a line), press the <KeyShortcuts macCtrl pcCtrl /> key when dragging the line segment (or line).
:::

::: tool-title

## Rotation <IconBase notInline icon-name="rotate" />

:::
::: tool-description
Rotate the sphere.
::: tool-details

- There are three rotation modes:
  - _Free rotation:_ Mouse press at an empty location and dragging will change the current view of the sphere by rotation. The mouse press location is moved to the current location of the mouse while dragging. The mouse release location sets the final view of the sphere (unless the [Momentum](/userguide/#top-region-title-bar) feature is activated )
  - _Object rotation:_ To rotate around a point or along a line (or line segment), mouse over such an object to highlight it and click to select it. The object of rotation is then highlighted and clicking at an empty location and dragging, will then rotate the sphere around or along that object. When the rotation is being performed the object is not highlighted, but when the rotation is complete the object of rotation is re-highlighted. To return to free rotation mode, select the same object again and it will be un-highlighted.
  - _North pole rotation:_ Pressing and holding the <KeyShortcuts macOpt pcAlt /> key rotates the sphere about the (not displayed) north pole of the display (the upper most point on the Sphere Canvas). This is the same as a translation along the (not displayed) equator of the displayed sphere. Releasing the <KeyShortcuts macOpt pcAlt /> key returns to the free rotation mode.
- If the [Momentum](/userguide/#top-region-title-bar) feature is activated, then after the mouse is released, the view will continue to change. The time it will continue to rotate is determined by the Decay Time which has a maximum of 5 minutes. To stop all rotation either click anywhere on the Sphere Canvas or deactivate this tool.
- If the user has Momentum enabled, but while dragging the sphere, pauses the mouse movement for a period of time (about 0.25 seconds) before mouse releasing, the momentum feature will not be activated.
- If this tool is activated with a single point or line segment or line selected, then the object rotation mode will used.

:::

::: tip

If the momentum mode is enabled and the user doesn't want the current arrangement to rotate after a mouse release, pausing with the mouse pressed for a period of time before mouse releasing will temporarily disable the momentum feature.

:::

::: tip

To stop all rotation click anywhere on the Sphere Canvas.

:::

::: tool-title

## Zoom <IconBase notInline icon-name="zoomIn" />/<IconBase notInline icon-name="zoomOut" />, Pan, and Zoom Fit <IconBase notInline icon-name="zoomFit" />

:::

::: tool-description

Pan, Zoom In or Out on the current view or return to the standard view.

::: tool-details

- These tools are found in the lower right hand corner of the Sphere Frame.
- Select the Zoom In <IconBase icon-name="zoomIn" /> or Zoom Out <IconBase icon-name="zoomOut" /> tool to perform the corresponding action on a mouse press and release (a mouse click) at the same location.
  - The zoom is centered on the mouse click location.
  - TODO: [The percent zoom can be set by the user.](/userguide/titlebar#global-settings)
- With either tool, if the user mouse presses at one location, moves the mouse, and then mouse releases, the view is panned from the mouse press to the mouse release location (and updated in between).
- Pinching on a track pad or using a mouse wheel will zoom in or out centered at the current location of the mouse. The percent of zoom in or out is determined by the change in the mouse wheel or pinch change value.
- The Zoom Fit <IconBase icon-name="zoomFit" /> tool restores the view to the largest possible one of the sphere given the current size of the window.
- If either of these tools is activated with any objects selected, the selected objects are unselected and ignored.

:::
