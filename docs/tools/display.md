---
title: Display Tools
sidebarDepth: 2
lang: en-US
---

# Display Tools

Each of these tools allows a user to adjust the display of an arrangement.

::: tool-title

## Hide Object

:::
::: tool-description
Hide selected objects.

::: tool-details

- Clicking at a location hides all nearby objects.
- When an object is hidden its label is also hidden.
- When hiding a line segment or point that is part of a [Measured Angle](/tools/measurement.html#angle) and an angle marker is display, hiding that object will also hide the angle marker.
- If this tool is activated with any objects selected, the select objects are hidden automatically.
  ::: tip
  If when clicking at a location more than one object becomes hidden and this is not the desired behavior, then Undo you first action, change to the [Selection Tool](edit.html#selection), and then select the object or objects to be hidden. Then activating this tool will hide the selected objects.
  :::

  ::: tool-title

## Show/Hide Label

:::
::: tool-description
Hide or show the label of selected objects.
::: tool-details

- Clicking at a location toggles the display of all nearby objects' label.
- To toggle the display of a label, the user can click directly on (or near) the label or can click on (or near) the object to which it is attached.
- If this tool is activated with any objects selected, the display of the selected objects' label is toggled automatically.

  ::: tip
  If when clicking at a location more than one object's label becomes hidden or shows and this is not the desired behavior, then Undo you first action, change to the [Selection Tool](edit.html#selection), and then select the object or objects whose label's you want to toggle. Then activating this tool will toggle the appropriate labels.
  :::

::: tool-title

## Move

:::
::: tool-description
Move the location of a single object.
::: tool-details

- Mouse press and dragging on a single free object will move the location of the object on the sphere. Mouse release will terminate the movement of that object and place it at a new location.
- There are two kinds of free objects:
  - Those which reside at the top layer or second to top layer of the dependency structure. For example, suppose three points are created on the sphere using the [Point Tool](/tools/basic.html#point) (and are not snapped - [see this tip](/tools/basic.html#point)- to any object) then they are in the top or first layer of the dependency structure. If those points are used to create an ellipse using the [Ellipse Tool](/tools/basic.html#ellipse) then the ellipse is in the second layer of the dependency structure.
  - Those points that are either created with the [Point On Object Tool](/tools/construction.html#point-on-object) or are automatically created in this way when creating another object.
- **Not** all objects are movable. Only free objects are movable. For example, an intersection point (which is on the third layer) of two circles (on the second layer) depends on the two circles and **cannot** be independently moved. However, each circle can be moved because the points on which the circle itself depends are at the top (i.e. first layer) of the dependency structure.
- Moving a free circle or ellipse is the same thing as simultaneously moving the points or objects on which it depends.
- Non-ellipse conics and parametric curves (user defined) are never moveable. Parametric curves can be moved using a Measurement object in the parametric definition.
- Moving a line or line segment rotates that line about the axis connecting the first point on the line to the antipode of that first point.
- If this tool is activated with any single free object selected, clicking and dragging the mouse will change the location of that object.
  :::

  ::: tool-title

## Rotation

:::
::: tool-description
Rotate the current view.
::: tool-details

- Clicking and dragging will change the current view of the sphere. The mouse press location is moved to the current location of the mouse while dragging. The mouse release location sets the final view of the sphere.
- If the [Momentum](/userguide/#top-region-title-bar) feature is activated, then after the mouse is released, the view will continue to change. If the Decay value is set to 1 the view will continue to rotate indefinitely. To stop all rotation either click at a location or deactivate this tool.
- If this tool is activated with a point or line selected, clicking and dragging will either rotate around that point or along that line (i.e. around the poles of the line). Mouse release will stop the rotation (except for the [Momentum](/userguide/#top-region-title-bar) rotation). To stop the rotation click at a location. To rotate in a different way, deactivate the tool (by selecting another one) to clear the selected objects and then select the Rotation Tool again.  
  :::
