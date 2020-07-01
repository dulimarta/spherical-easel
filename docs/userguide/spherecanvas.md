---
title: Sphere Canvas
lang: en-US
---

# Sphere Canvas

This is found in the middle of the screen. Initially the Sphere Canvas is empty and only a black two-dimensional outline of the sphere is visible. The user can activate certain [tools](/tools/) by clicking on them in the [Tools Tabs](). Once a tool is active, [mouse](/userguide/#mouse-events) and [keyboard](/userguide/#keyboard-shortcuts) events are interpreted by the active tool to create geometric objects (like [lines](/tools/basic.html#line), [line segments](/tools/basic.html#line-segment), [circles](/tools/basic.html#circle), [conics](/tools/conic.html), [polygons](/tools/basic.html#polygon-too-hard), and custom user defined [parametric curves](/tools/advanced.html#parametric-curve-user-defined) on the unit sphere. These objects together can be used to create complex geometric arrangements that are displayed on this canvas.

The sphere can be [rotated](/tools/display.html#rotation) and the view can be [zoomed and paned](/tools/display.html#zoom-pan-and-standard-view) to explore the arrangement. Rotating the sphere and zooming and panning the view doesn't change the relationship between the geometric objects only the view of those objects. The relationships between the objects can be changed by activating the [Move Tool](/tools/display.html#move) and clicking and dragging the movable objects. Not all objects are movable - see details in the move tool description.

The style of the displayed of the objects can be adjusted using the [Style Panel](/userguide/stylepanel.html).

## Default Tools in the Corners

There are three slots for tools in each of the four corners of the Sphere Canvas. By default only some of them are filled with commonly used tools. For example, if you have scrolled to the bottom of the Tools Tab to activate and use a tool, then typically the next operation you want to perform is to move the objects you just created to explore them a bit. Rather than scrolling back to the top of the Tools Tab to select the Move Tool, you can simply click on the Move button in the lower left-hand corner of the Sphere Canvas

By registering, the user can [select the tools that appear in each of the corner slots.](/userguide/titlebar.html#benefits-of-registering). The default tools are described here.

### Undo/Redo Operations

In the upper left-hand corner of the Sphere Canvas are the tools for [undoing and redoing](/tools/edit.html#undo-redo) actions performed during a construction.

### Activate the Style Panel

In the upper right-hand corner of the Sphere Canvas, is a gear icon for displaying the [Style Panel](/userguide/stylepanel.html). This allows the user to update the visual style of the geometric objects and to control other aspects of the display.

### Panning, Zooming and Standard View

In the lower right-hand corner of the Sphere Canvas are the [pan/zoom in, pan/zoom out, and zoom standard tools.](/tools/display.html#zoom-pan-and-standard-view) The zoom tools magnify the view of the sphere and the zoom standard tool restores the view to the largest possible view of the sphere given the current size of the window.

### Move Objects

In the lower left-hand corner of the Sphere Canvas is the [Move Tool](/tools/display.html#move).

## Keyboard Shortcuts

As you play with Spherical Easel these keyboard shortcuts can help accelerate your exploration.

- Holding the <kbd>Shift</kbd> while using the mouse (pressing, dragging, clinking, or releasing) means that the action will be directed to the back of sphere.
- When you are using the Selection Tool and multiple objects are selected at a mouse press location holding a number key <kbd>1-9</kbd> will select different objects. That is, if you mouse press at a location and multiple objects are selected they should all glow, but if you mouse press at the same location and hold a number key only one object, depending on the key held, should glow.
- <kbd>Command</kbd> + <kbd>M</kbd> (and PC equivalent is...) switches to the Move tool
- <kbd>Command</kbd> + <kbd>R</kbd> (and PC equivalent is...) switches to the Rotate tool
- <kbd>Command</kbd> + <kbd>D</kbd>(and PC equivalent is...) switches to the Delete tool
- <kbd>Command</kbd> + <kbd>H</kbd> (and PC equivalent is...) switches to the Show/Hide Object tool

## Mouse Events

Through out this documentation, **mouse down** or **mouse press** is the action of pressing the mouse button down at a location, **mouse release** is the action of releasing the button at a location, **clicking** is the action of mouse down and mouse release at the same location, and **mouse dragging** or **dragging** or **click and dragging** is the action of mouse down at a location and mouse release at a different location.

## Creating Points

While there is a [Point On Object Tool](/tools/construction.html#point-on-object) and an [Intersection Tool](/tools/construction.html#intersection) these are included only for completeness and only in extraordinary circumstances should these tools be needed. Spherical Easel always assumes the if the user attempts to create a point _**near**_ an intersection of two one-dimensional objects, the user would like the point to be an intersection of the objects. Similarly, Spherical Easel always assumes that if the user attempts to create a point _**near**_ a one-dimensional object, it is assumed that the user wanted the point created _**on**_ the object (i.e. in such a way the that point is constrained to be on the object).
