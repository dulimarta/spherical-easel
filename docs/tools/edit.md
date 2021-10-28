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

- All selected objects will glow (i.e. have a highlight color displayed in the background of the object) and slowly blink.
- To select multiple objects, mouse drag and create a rectangle. Anything partially within that region will be selected when the mouse is released. (TODO: Not Implemented yet)
- To clear your selection, mouse press and release at a location with no objects nearby.
- To add or subtract to your current selection, press and hold the <kbd>Alt/Option</kbd> key when mouse pressing. A mouse press will add the objects to the current selection or, if the mouse press is on already selected objects, those objects will be removed from the current selection.
- To single out one object when multiple objects are nearby, mouse over (with _no_ mouse press or release) that location (where there are at lease two objects nearby) and press and hold a number key <kbd>1-9</kbd>. Depending on the key, a single object will be highlighted. To add this object to the selected list, mouse press and release without moving.
- To select multiple objects with the key press action:
  1. Mouse over a location near the first object and key press a number to highlight the desired object
  2. Mouse press and release (without moving the mouse) - the first object should be selected
  3. Mouse over a location near the second object and key press a number to highlight the desired object
  4. Mouse press and release (without moving the mouse) - the first and second objects should be selected
- To select all points, move the mouse into the sphere and press and hold the <kbd>p</kbd> key. All points should be highlighted. To move them into the current selection, mouse press at an empty location on the sphere and release once. Similarly to select...
  - All circles use the <kbd>c</kbd> key
  - All lines use the <kbd>l</kbd> key
  - All segments use the <kbd>s</kbd> key
  - All ellipses use the <kbd>e</kbd> key
  - All angle markers <kbd>a</kbd> key
  - All parametrics <kbd>P</kbd> key (capital P)
  - All polygons <kbd>O</kbd> key (capital O)

**Changing Visual Style:**

- If the Style Panel in open, the selected object or objects are in the focus of the Style Panel. When an object is in focus its style properties are displayed in the Style Panel and you can edit them. Note: if multiple objects are in focus, the common style properties are displayed and you can edit them all simultaneously.

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

- These tools are found always found in the upper left hand corner of the sphere frame.
- These tools undo or redo the last action.
- Zooming and rotating are undoable, except in the case when rotating (including [momentum rotations](/userguide/titlebar.html#global-settings)), panning, or mouse wheel zooming. In those cases only the view before and after are recorded and the intermediate views are not.
- If either of these tools is activated with any objects selected, the selected objects are unselected and ignored.

:::

::: tool-title

## Copy Visual Style

:::

::: tool-description

Copy the style attributes of a template object to other objects.

::: tool-details

- Not yet implemented.
- The first object selected becomes the template.
- Clicking on subsequent objects will change the style of those objects to match the template object's style. TODO: Does this work across types? That is, can you copy the style of a point to the style of a circle? I think yes.
- If this tool is activated with any objects selected, they are all unselected and ignored.

:::
