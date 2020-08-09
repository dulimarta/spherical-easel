---
title: Display Tools
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
- When an object is hidden its label is also hidden. However, after using this tool, you can select the object in the Objects Tab and then use the Style Panel to show the label. This allows the user to hide an angle marker and but then use the angle marker's label to display text to label the angle.
- When hiding a line segment or point that is part of a [Measured Angle](/tools/measurement.html#angle) and an angle marker is display, hiding that object will also hide the angle marker.
- If the user would like to show all hidden objects, hold the <kbd>S</kbd> key and click on the Sphere Canvas and all hidden objects will be shown.
- If this tool is activated with any objects selected, the selected objects are hidden automatically.
  ::: tip
  If when clicking at a location more than one object becomes hidden and this is not the desired behavior, then Undo you first action, change to the [Selection Tool](edit.html#selection), and then select the object or objects to be hidden. Then activating this tool will hide the selected objects.
  :::

  ::: tool-title

## Show/Hide Label

:::
::: tool-description
Hide or show the label of selected objects.
::: tool-details

- Clicking at a location toggles the display of all nearby objects' labels.
- If the user would like to

  - only show labels when clicking, hold the <kbd>S</kbd> keys and click on the Sphere Canvas. All nearby objects will have their labels shown.
  - only hide labels when clicking, hold the <kbd>H</kbd> keys and click on the Sphere Canvas. All nearby objects will have their labels hidden.
  - show all object's labels, hold the <kbd>Shift</kbd> + <kbd>S</kbd> key and click once on the Sphere Canvas. All labels will be shown.
  - hide all object's labels, hold the <kbd>Shift</kbd> + <kbd>H</kbd> key and click once on the Sphere Canvas. All labels will be hidden.

- To toggle the display of a label, the user can click directly on (or near) the label or can click on (or near) the object to which it is attached.
- If this tool is activated with any object(s) selected, the display of the selected objects' label(s) is toggled automatically.

  ::: tip
  If when clicking at a location more than one object's label becomes hidden or shown and this is not the desired behavior, then Undo you first action, change to the [Selection Tool](edit.html#selection), and then select the object or objects whose label's you want to toggle. Then activating this tool will toggle the appropriate labels.
  :::

::: tool-title

## Move

:::
::: tool-description
Move the location of a single object.
::: tool-details

- Mouse press and dragging on a single free object will move the location of the object on the sphere. Mouse release will terminate the movement of that object and place it at a new location.
- There are two kinds of free objects:
  - Those which reside at the top layer or second to top layer of the dependency structure. For example, suppose three points are created on the sphere using the [Point Tool](/tools/basic.html#point) (and are not snapped - [see this tip in the Point Tool](/tools/basic.html#point) - to any object) then they are in the top or first layer of the dependency structure. If those points are used to create an ellipse using the [Ellipse Tool](/tools/basic.html#ellipse) then the ellipse is in the second layer of the dependency structure.
  - Those points that are either created with the [Point On Object Tool](/tools/construction.html#point-on-object) or are automatically created in this way when creating another object.
- **Not** all objects are movable. Only free objects are movable. For example, an intersection point (which is on the third layer) of two circles (on the second layer) depends on the two circles and **cannot** be independently moved. However, each circle can be moved so long as the points on which the circle itself depends are at the top (i.e. first layer) of the dependency structure.
- Moving a free circle or ellipse is the same thing as simultaneously moving the points or objects on which it depends.
- Non-ellipse conics and parametric curves (user defined) are never moveable. Parametric curves can be "moved" using a Measurement object in the parametric definition.
- Moving a free line or line segment rotates that line about the axis connecting one of the points on the line or line segment to its antipode. Pressing the <kbd>Alt</kbd> key toggles the point that the line or line segment rotates about.
- Moving a free line segment with the <kbd>Crtl</kbd> key pressed, moves both endpoints simultaneously. They both rotate about the perpendicular to the plane containing the last mouse location and the current mouse location as the user drags.
- You can move the location of a slider displayed in the Sphere Frame.
- If this tool is activated with any single free object selected, clicking and dragging the mouse will change the location of that object.

::: tip
When moving a free line or line segment pressing the <kbd>Alt</kbd> key toggles the point that the line or line segment rotates about. To move both endpoints of a line segment, press the <kbd>Crtl</kbd> key when moving.
:::

::: tool-title

## Rotation

:::
::: tool-description
Rotate the current view.
::: tool-details

- Clicking and dragging will change the current view of the sphere. The mouse press location is moved to the current location of the mouse while dragging. The mouse release location sets the final view of the sphere.
- If the [Momentum](/userguide/#top-region-title-bar) feature is activated, then after the mouse is released, the view will continue to change. The time it will continue to rotate is determined by the Decay Time which has a maximum of 5 minutes. To stop all rotation either click at a location or deactivate this tool.
- If the user has Momentum enabled, but while dragging the sphere, pauses for a period of time (about 0.25 seconds) before mouse releasing, the momentum feature will not be activated.
- Pressing the <kbd>Alt</kbd> rotates the display about the (not displayed) north pole of the display (the upper most point on the screen). This is the same as a translation along the (not displayed) equator of the displayed sphere.
- If this tool is activated with a single point or line segment or line selected, clicking and dragging will either rotate around that point or along that line segment or line (i.e. around the poles of the line or the line containing the line segment). Mouse release will stop the rotation (except for the [Momentum](/userguide/#top-region-title-bar) rotation). To stop the rotation click at a location. To rotate in a different way, deactivate the tool (by selecting another one) to clear the selected objects and then select the Rotation Tool again.

::: tip

If the momentum mode is enabled and the user doesn't want the current arrangement to rotate after a mouse release, pausing with the mouse pressed for a period of time before mouse releasing will temporarily disable the momentum feature.

:::

::: tool-title

## Zoom, Pan, and Standard View

:::

::: tool-description

Pan, Zoom In or Out on the current view or return to the standard view.

::: tool-details

- Select the Zoom In or Zoom Out to perform the corresponding action on a mouse press and release at the same location.
  - The zoom is centered on the mouse click location.
  - [The percent zoom can be set by the user.](/userguide/titlebar.html#global-settings)
- With either tool, if the user mouse presses at one location, move the mouse, and then mouse releases, the view is panned from the mouse press to the mouse release location (and updated in between).
- Pinching on a track pad or using a mouse wheel will zoom in or out centered at the current location of the mouse. The percent of zoom in or out is determined by the change in the mouse wheel or pinch change value.

  - On a Mac:

    - Hold the <kbd>Command</kbd> and use a two finger pinch or expansion to zoom in or out
    - TODO: Can the user pan with a track pad?

  - On a PC with a track pad: (TODO: confirm these directions)

    - Hold the <kbd>Alt</kbd> key and use a two finger pinch or expansion to zoom in or out.
    - TODO: Can the user pan with a track pad?

- The zoom standard tool restores the view to the largest possible one of the sphere given the current size of the window.
- If either of these tools is activated with any objects selected, the selected objects are unselected and ignored.

:::
