---
title: Edit Tools
lang: en-US
prev: /userguide/
---

# Edit Tools

Each of these tools allows the user to edit an arrangement.

::: tool-title

## Selection <IconBase icon-name="select" />

:::

::: tool-description

Select object(s) to change their visual style or to perform actions on them with other tools.

::: tool-details Selecting Objects:

- Mousing over an object will highlight the object in focus and clicking (mouse press and release at the same location) will select that object. Holding the shift key selects objects on the back of the sphere.
- To add or subtract to your current selection, press and hold the <kbd>Alt/Option</kbd> key when clicking. A click will add the objects to the current selection or, if the click is on an already selected object, that object will be removed from the current selection.
- All selected objects will glow (i.e. have a highlight color displayed in the background of the object) and slowly blink.
- To select multiple objects, mouse press and drag to create a selection rectangle. Anything in or partially within that rectangle will be added to the current selection when the mouse is released. Holding the shift key creates the rectangle on the back of the sphere.
- To clear your selection, mouse press and release without moving at a location with no objects nearby.
- To single out one object when multiple objects are nearby, mouse over (with _no_ mouse press or release) that location (where there are at lease two objects nearby) and press and hold a number key <kbd>1-9</kbd>. Depending on the key, a single object will be highlighted. To add this object to the selected list, mouse press and release without moving.
- To select all points, move the mouse into the Sphere Canvas and press the <kbd>p</kbd> key. All points should be highlighted. To move them into the current selection, mouse press and release _without_ moving the mouse on the Sphere Canvas. Similarly to select ...
  - All visible circles use the <kbd>c</kbd> key
  - All visible lines use the <kbd>l</kbd> key
  - All visible segments use the <kbd>s</kbd> key
  - All visible ellipses use the <kbd>e</kbd> key
  - All visible angle markers <kbd>A</kbd> key (capital A)
  - All visible label <kbd>L</kbd> key (capital L)
  - All visible parametrics <kbd>P</kbd> key (capital P)
  - All visible polygons <kbd>O</kbd> key (capital O)
  - All visible objects <kbd>a</kbd> and <kbd>command</kbd> keys (command/meta a)

**Changing Visual Style:**

- If the Style Panel in open, the selected object or objects are the focus of the Style Panel. When an object is in focus its style properties are displayed in the Style Panel and you can edit them. Note: if multiple objects are in focus, the common style properties are displayed and you can edit them all simultaneously.

**Perform Other Tool Actions**

- If you select an object or objects and then activate another tool then the action of that tool is applied to the selected object(s) so long as the selected object(s) are appropriate for the tool. For example,
  - if you select multiple objects and then activate the Delete Tool, all selected objects will be deleted.
  - if you select two points and then activate the Circle Tool, then a circle will be created with the first selected point as the center and the second as a point on the circle determining the radius.
  - if you select three points and then activate the Circle Tool, then the points are ignored, unselected, and no new circle is created.

:::

::: tool-title

## Delete <IconBase icon-name="delete" />

:::

::: tool-description

Delete selected objects.

::: tool-details

- Clicking at a location when an object is highlighted deletes that object.
- You cannot delete labels. If you use the delete tool on a label, the label is merely hidden.
- When an object is deleted all objects that depend on this object (including its label) are also deleted.
- If this tool is activated with any objects selected, the selected objects are deleted automatically.

:::

::: tool-title

## Undo <IconBase icon-name="undo" /> and Redo <IconBase icon-name="redo" />

:::

::: tool-description

Undo or redo the last action.

::: tool-details

- These tools are always found in the upper left hand corner of the Sphere Canvas.
- These tools undo or redo the last action.
- Zooming and rotating are undoable, except in the case when rotating (including [momentum rotations](/userguide/titlebar.html#global-settings)), panning, or mouse wheel zooming. In those cases only the view before and after are recorded and the intermediate views are not.
- If either of these tools is activated with any objects selected, the selected objects are unselected and ignored.

:::

::: tool-title

## Clear <IconBase icon-name="clearConstruction" />

:::

::: tool-description

Clears the current construction on the Sphere Canvas.

::: tool-details

- This tools is found in the upper right hand corner of the Sphere Canvas.
- This tool clears the Sphere Canvas without saving the current construction.
- Clicking this button resets the Sphere Canvas so that the user can start a new construction.
- This action is not undoable. If the user wants an undoable way of clearing the sphere, activate the select tool, select all objects with <kbd>Command a</kbd>, then activate the delete tool.

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
