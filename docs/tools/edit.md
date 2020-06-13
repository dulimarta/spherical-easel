---
title: Edit Tools
lang: en-US
---

# Edit Tools

Each of these tools allows the user to edit an arrangement.

::: tool-title

## Selection

:::

::: tool-description

Select object(s) to change their visual style or to perform actions on them with other tools.

::: tool-details

**Selecting Objects:**

- All selected objects will glow (i.e. have a highlight color displayed in the background of the object).
- To selecting multiple objects, mouse drag and create a rectangle. Anything (TODO: entirely? partially?) with in that region will be selected when the mouse is released.
- To select a single object, mouse click at a location and all nearby objects will be selected. If the user clicks and multiple objects are selected, holding a number key <kbd>1-9</kbd> will select different objects. That is, if the user mouse clicks (without dragging) at a location and multiple objects are selected they will all glow. However if the user mouse presses (without dragging) at the same location and holds a number key only one object, depending on the key held, should glow. You can change which key is pressed while holding the mouse press and different objects will be glow. When you mouse release the glowing object remains glowing and is selected.

**Changing Visual Style:**

- If the Style Panel in open, the selected object or objects are in the focus of the Style Panel. When an object is in focus its style properties are displayed in the Style Panel and you can edit them. Note: if multiple objects are in focus, the common style properties are displayed and you can edit them all simultaneously.

**Perform Other Tool Actions**

- If you select an object or objects and then activate another tool then the action of that tool is applied to the selected object(s) so long as the selected object(s) are appropriate for the tool. For example,
  - if you select multiple objects and then activate the Delete Tool, all selected objects will be deleted.
  - if you select two points and then activate the Circle Tool, then a circle will be created with the first selected point as the center and the second as a point on the circle determining the radius.
  - if you select three points and then activate the Circle Tool, then the points are ignored, unselected, and no new circle is created.

:::

::: tool-title

## Delete

:::

::: tool-description

Delete selected objects.

::: tool-details

- Clicking at a location deletes all nearby objects.
- When an object is deleted its label is also deleted.
- If this tool is activated with any objects selected, the select objects are deleted automatically.

  ::: tip
  If when clicking at a location more than one object is deleted and this is not the desired behavior, then Undo you first action, change to the [Selection Tool](edit.html#selection), and then select the object or objects to be hidden. Then activating this tool will hide the selected objects.

:::

::: tool-title

## Copy Visual Style

:::

::: tool-description

Copy the style attributes of a template object to other objects.

::: tool-details

- The first object selected becomes the template.
- Clicking on subsequent objects will change the style
  of those objects to match the template object's style. TODO: Does this work across types? That is, can you copy the style of a point to the style of a circle? I think yes.
- If this tool is activated with any objects selected, they are all unselected and ignored.

:::
