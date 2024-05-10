---
title: Edit Tools
lang: en-US
prev: /userguide/
---

# Edit Tools

Each of these tools allows the user to edit an arrangement.

## <tool-title title="Selection" iconName="select"/>{#selection}


::: tool-description

Select object(s) to change their visual style or to perform actions on them with other tools.

::: tool-details Selecting Objects:

- Mousing over an object will highlight the object in focus and clicking (mouse press and release at the same location) will select that object. Holding the <KeyShortcuts macShift pcShift /> key highlights and selects objects on the back of the sphere.
- To add or subtract to your current selection, press and hold the <KeyShortcuts macOpt pcCtrl /> key when clicking. A click will add the objects to the current selection or, if the click is on an already selected object, that object will be removed from the current selection.
- Labels are an attribute of an object, like color, and are therefore not selectable. Use the [Toggle Label Display](/tools/display#toggle-label-display) <IconBase icon-name="toggleLabelDisplay" /> tool to change the display of the label. To style a label, select the object it labels, open the Style Panel <IconBase icon-name="stylePanel" /> and open Label Style.

- All selected objects will glow (i.e. have a highlight color displayed in the background of the object) and slowly blink.
- To select multiple objects, mouse press and drag to create a selection rectangle. Any non-label object in or partially within that rectangle will be added to the current selection when the mouse is released. Holding the shift key <KeyShortcuts macShift pcShift /> creates the selection rectangle on the back of the sphere.
- To clear your selection, mouse press and release without moving at a location with no objects nearby.
- To single out one object when multiple objects are nearby, mouse over (with _no_ mouse press or release) that location (where there are at least two objects nearby) and press and hold a number key <kbd>1-9</kbd>. Depending on the key, a single object will be highlighted at that number depth. To add this object to the selected list, mouse press and release without moving.
- To select all visible points, move the mouse into the Sphere Canvas and press the <kbd>p</kbd> key. All visible points should be highlighted. To move them into the current selection, mouse press and release _without_ moving the mouse on the Sphere Canvas. Similarly to select all visible ...
  - circles use the <kbd>c</kbd> key
  - lines use the <kbd>l</kbd> key
  - segments use the <kbd>s</kbd> key
  - ellipses use the <kbd>e</kbd> key
  - angle markers use the <kbd>A</kbd> key (capital A)
  - parametrics use the <kbd>P</kbd> key (capital P)
  - polygons use the <kbd>O</kbd> key (capital O)
  - all non-label objects use the <KeyShortcuts macCmd macLetter="a" pcCtrl pcLetter="a"  /> keys

**Changing Visual Style:**

- If the Style Panel <IconBase icon-name="stylePanel" /> is open, the selected object or objects are the focus of the Style Panel. When an object is in focus its style properties are displayed in the Style Panel and you can edit them. Note: if multiple objects are in focus, the common style properties are displayed and you can edit them all simultaneously.

**Perform Other Tool Actions**

- If you select an object or objects and then activate another tool then the action of that tool is applied to the selected object(s) so long as the selected object(s) are appropriate for the tool. For example,
  - if you select multiple objects and then activate the Delete Tool <IconBase icon-name="delete" />, all selected objects (with their labels) will be deleted.
  - if you select two points and then activate the [Circle Tool](/tools/basic#circle) <IconBase icon-name="circle" />, then a circle will be created with the first selected point as the center and the second as a point on the circle determining the radius.
  - if you select three points and a line and then activate the [Ellipse Tool](./conic#ellipse) <IconBase icon-name="ellipse" />, then the points and lines are ignored, unselected, and no new ellipse is created because an ellipse is created from only three points.

:::

::: tool-title

## Delete <IconBase notInLine  icon-name="delete" />

:::

::: tool-description

Delete selected objects.

::: tool-details

- Clicking at a location when an object is highlighted deletes that object and all the objects that depend on that object, including its label.
- You cannot delete labels. If you use the Delete Tool on a label, the label is merely hidden.
- If this tool is activated with any objects selected, the selected objects, with their labels, are deleted automatically.

:::

::: tool-title

## Undo <IconBase notInLine  icon-name="undo" /> and Redo <IconBase notInLine icon-name="redo" />

:::

::: tool-description

Undo or redo the last action.

::: tool-details

- These tools are always found in the upper left hand corner of the Sphere Canvas.
- These tools undo or redo the last action.
- Undo is bound to the key stroke <KeyShortcuts macCmd macLetter="z" pcCtrl pcLetter="z"  />.
- Redo is bound to the key stroke <KeyShortcuts macShift macCmd macLetter="z" pcCtrl pcLetter="y"  />.
- Zooming and rotating are undoable, except in the case when rotating (including [momentum rotations](/userguide/titlebar#global-settings)), panning, or mouse wheel zooming. In those cases only the view before and after are recorded and the intermediate views are not.
- If either of these tools are activated with any objects selected, the selected objects are unselected and ignored.

:::

::: tool-title

## Clear <IconBase notInLine icon-name="clearConstruction" />

:::

::: tool-description

Clears the current construction on the Sphere Canvas without saving.

::: tool-details

- This tools is found in the upper right hand corner of the Sphere Canvas.
- This tool clears the Sphere Canvas without saving the current construction.
- Clicking this button resets the Sphere Canvas so that the user can start a new construction.
- This action is not undoable.

:::

::: tip
If the user wants to clear the sphere in an undoable way, activate the [Selection Tool](./edit#selection) <IconBase icon-name="select" />, select all objects with <KeyShortcuts macCmd macLetter="a" pcCtrl pcLetter="a"  />, then activate the Delete Tool <IconBase icon-name="delete" />.

:::

::: tool-title

## Copy Visual Style

:::

::: tool-description

Copy the style attributes of a template object to other objects.

::: tool-details

- TODO: Not yet implemented.
- The first object selected becomes the template.
- Clicking on subsequent objects will change the style of those objects to match the template object's style. TODO: Does this work across types? That is, can you copy the style of a point to the style of a circle? I think yes.
- If this tool is activated with any objects selected, they are all unselected and ignored.

:::
