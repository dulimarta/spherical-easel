---
title: User Manual
lang: en-US
sidebarDepth: 4
prev: /quickstart/
next: /tools/
---

# Spherical Easel User Manual

## Overview

UNIT SPHERE!!!!

The Spherical Easel window is divide into several regions: Title Bar, Tools & Objects Panel, Sphere Canvas, and Style Panel. The Style Panel is hidden initially and can be made visible by clicking on the Style Settings (TODO:AddIconImage) icon in the upper right corner of the Sphere Canvas. The functionality of each region is described below.

TODO: Add picture with all regions labeled

### Top Region: Title Bar

The Title Bar is across the top and includes a File System icon (TODO:AddIconImage - three horizontal lines hamburger menu icon) on the left end, a Help icon (TODO: AddIconImage) and a global settings icon (TODO:AddIconImage) on the other end.

#### File System Options

This menu allows you to select among the following options:

- New (prompts user to save and then clear the sphereCanvas)
- Save (prompts user to select save location - saves text file? - Save to server?)
- Open (Prompts use to find a previously saved easel session)
- Export (prompts user to select among SVG, EPS, TikZ)
- Import (To import a file, it must be a plain text file (containing JavaScript?) in the format of a list of points and a list of faces like [this](./importfileexample.md). All points will be normalized to have length one automatically. ??? TODO: Not sure how this might work just guessing right now.)

#### Global Settings

Clicking on this icon (TODO: AddIconImage) allows user to

- pick a different language,
- set the number of displayed decimal places,
- Set the Momentum and Decay feature of the [Rotate Tool](/tools/display.html#rotateion). Checking the Momentum box will allow the rotate tool to continue rotating the current view after the user has stopped actively rotating the sphere. The sphere will continue to rotate and slow depending on a Decay parameter. A Decay value of zero is the same as not allowing Momentum and a Decay value of 1 means the sphere never stops rotating (if left undisturbed).
- register so they can save and load from server, create custom URL that restrict the tools available to the user, create a custom URL to send that displayed a particular arrangement?

#### Help

Opens these help pages **in another tab**

### Middle Region: Sphere Canvas

TODO: Include an image to illustrate this.

Displayed each of the four corners are a collection of icons to do various commonly needed tasks as you adjust your arrangement.

#### Top Left Corner: Undo/Redo

These undo (TODO: AddIconImage) and redo (TODO: AddImage Icon) the last actions performed.

#### Top Right Corner: Settings

This icon (TODO: AddIconImage) opens the Style Panel and enables the user to customize the look and feel of the arrangement. (TODO: Link to StylePanel Description)

#### Bottom Right Corner: Zooming

There are several buttons in this corner:

- In (Turns on a pan/zoom tool so that a mouse release zooms in at the location of the mouse by 10 or 15% and a mouse press & dragging event zooms initially at 10/15% at the start location (i.e. mouse press) of the mouse, but then the portview/view window is dragged around until the mouse release event)
- Out (Same as the zoom in, but zooming out instead)
- Pan (only drags the current view port around)
- Full Screen (Toggle between full screen and not. Toggle between Google icon:fullscreen and Google icon: fullscreen-exit)
- Home (restore to the largest possible view of the sphere given the current size of the window)

#### Bottom Left Corner: Move

Turns on the [Move Tool](/tools/display.html#move) so user can easily return to this mode when the Tools & Objects Panel is long (i.e. you just activated and used a tool at the bottom of the list and don't want to scroll back to the top of the tool list to turn on the move tool to explore the change you just made.)

### Keyboard Shortcuts

As you play with Spherical Easel these keyboard shortcuts can help accelerate your exploration.

- Holding the <kbd>Shift</kbd> while using the mouse (pressing, dragging, clinking, or releasing) means that the action will be directed to the back of sphere.
- When you are using the Selection Tool and multiple objects are selected at a mouse press location holding a number key <kbd>1-9</kbd> will select different objects. That is, if you mouse press at a location and multiple objects are selected they should all glow, but if you mouse press at the same location and hold a number key only one object, depending on the key held, should glow.
- <kbd>Command</kbd> + <kbd>M</kbd> (and PC equivalent is...) switches to the Move tool
- <kbd>Command</kbd> + <kbd>R</kbd> (and PC equivalent is...) switches to the Rotate tool
- <kbd>Command</kbd> + <kbd>D</kbd>(and PC equivalent is...) switches to the Delete tool
- <kbd>Command</kbd> + <kbd>H</kbd> (and PC equivalent is...) switches to the Show/Hide Object tool

### Mouse Events

Through out this documentation, **mouse down** or **mouse press** is the action of pressing the mouse button down at a location, **mouse release** is the action of releasing the button at a location, **clicking** is the action of mouse down and mouse release at the same location, and **mouse dragging** or **dragging** or **clicking and dragging** is the action of mouse down at a location and mouse release at a different location.

### Creating Points

While there is a [Point On Object Tool](/tools/construction.html#point-on-object) and an [Intersection Tool](/tools/construction.html#intersection) these are included only for completeness and only in extraordinary circumstances should these tools be needed. Spherical Easel always assumes the if the user attempts to create a point _**near**_ an intersection of two one-dimensional objects, the user would like the point to be an intersection of the objects. Similarly, Spherical Easel always assumes that if the user attempts to create a point _**near**_ a one-dimensional object, it is assumed that the user wanted the point created _**on**_ the object (i.e. in such a way the that point is constrained to be on the object).

## Left/Bottom Region: Tools & Objects Panel

In the Tools & Objects Panel there are two tabs.

### Tools Tab

There are many tools and they are explained in their own section of this document
[User Tools](/tools/)

### Objects Tab

- Points
- Segments
- Lines
- Circles
- Conics
- Measurements
- Calculations <- Explain

## Right Region: Style Panel

Sliders!!!

### Basic Tab (i.e. information displayed by the label)

- Name( Auto Generated, user overridable, not unique, usually short, like “P1”, “L4”, “C2” or “H1”, user might enter a LaTeX string))
- Showing/Hidden check box
- Definition text for parent (Free = value, intersection(C1,C2), Midpoint(A,B), N-Sect(5,j,3), Segment(j),Circle(P1,P2)…) This is auto generated and is also used in the object list
- Caption (always user generated, usually longer, like “The centroid”, might be a LaTeX string)
- Showing Options
  - Select one: Name, Caption, Value, Name & Value, Caption & Value
- Label check box and then
  - size
  - color (front and back)
  - font?
- Trace/Locus (Applies to points, lines and circles only)
  - size (only for points)
  - color
  - stroke color
  - stroke width

### Front (Style) Tab

- Fill Color (Point, Circle, Ellipse, Polygon only)
- Stroke Color
- Stroke Width
- Opacity

### Back (Style) Tab

- Fill Color (Point, Circle, Ellipse, and Polygon only)
- Stroke Color
- Opacity
- Stroke Width

### Advanced Tab

- Script a user written script that controls some aspect (color, showing, location?) of the object
- Percent showing (Segments, Circles, Ellipses, Parametric -- creates a new kind of point at the endpoint)
