---
title: Constructing
lang: en-US
---

# Construct An Equilateral Triangle

## 1. Display the Tools Tab

On the left hand side of the Spherical Easel application window (or the bottom if mobile) there is a Objects & Tools Panel. This panel contains two tabs at the top: a Tools tab (TOOD:AddIconImage) that displays the available tool buttons and an Object tab (TOOD:AddIconImage icon) that displays a list of the plotted objects, measurements, and calculations. Make sure that the Tools tab is active and you can see collection of tools each of which is represented with labeled button in the Objects & Tools Panel.

TODO: add image (with labels) showing the Objects & Tools Panel with the Tools tab displayed and the Sphere Canvas

::: tip
The Objects & Tools Panel may be minimized. It you don't see it, click and release anywhere in the region on the left (or bottom on mobile) or on the right arrow icon (TODO:AddIconImage) to maximize it. When maximized you can control the size of it by mousing over its right (top) border and when you see the mouse icon change to (TODO:AddIconImage), click and drag the border.
:::

## 2. Use the Segment Tool

Activate the Segment Tool by clicking on the Segment Tool button (TOOD:AddIconImage) in the Objects & Tools Panel and then, on the sphere outlined with a black boundary circle displayed in the center Sphere Canvas Panel, click (mouse press), drag, and mouse release to create a line segment.

TODO: add image showing this intermediate step

::: tip
If you don't like the results you can click the Undo button (TOOD:AddIconImage icon) in the upper left of the Sphere Canvas Panel or you can activate the Delete Tool (TODO:AddIconImage) and delete objects and try again.
:::

## 3. Use the Circle Tool

Activate the Circle Tool (TOOD:AddIconImage) and then click (mouse press) on one endpoint of the line segment, and then drag and mouse release on the other endpoint of the line segment. You should have constructed a line segment from the center of a circle to a point on the boundary of that circle.

TODO: add image showing this intermediate step

::: tool-details Construction Check: Are you constructing or merely plotting an arrangement?

You should check your construction by activating the Move Tool (TOOD:AddIconImage) and using the mouse to move various elements of your construction. For example, if you mouse press and drag on the center point of the circle, **both** the circle and the line segment should update and the center of the circle should remain the one endpoint of the line segment. Similarly, if you move the other endpoint of the line segment, **both** the circles and the line segment should update and that endpoint should remain on the circle. If your construction doesn't behave this way you are merely plotting and you should use the Undo button or select the New menu option on the (TODO:update) blah menu to try again. Always try to click close to the endpoints of the line segment to make sure that the endpoints of the line segment and the point on the circle are the same. Spherical Easel always assumes that if you attempt to create a point near an existing point, you would like to use the nearby point and not create a new one.
:::

## 4. Use the Circle Tool Again

If necessary, activate the Circle Tool and create a circle with center at the _other_ endpoint of the line segment and release at the center of the first circle so that you have two circles with common radius of the line segment and centers at each endpoint of the line segment.

TODO: add image showing this intermediate step

## 5. Use the Segment Tool Again

By mouse pressing _near_ the location of one of the intersection points of the two circles and then dragging and releasing at the the center of one of the circles create a line segment from an intersection of the circles to one end point of the line segment. Repeat this to create a line segment from the same intersection point to the other endpoint of the line segment.

TODO: Add image showing this intermediate step

::: tip
Spherical Easel always assumes that if the user attempts to create a point _**near**_ an intersection of two one-dimensional objects, the user would like the point to be constrained to always be placed at precisely intersection of the objects.
:::

## 6. Hide the circles and explore

TODO: Add image showing this intermediate step

Activate the Hide Tool (TODO:AddIconImage) and mouse release on each of the circles (but not on either point that defines a circle) to hide them. Now activate the Move Tool (TOOD:AddIconImage) and click and drag either endpoint of the original line segment around. You should notice that the triangle remains equilateral. Notice you won't be able to move the third vertex of the triangle independently, because that one is defined by the two circles and can't be moved directly even if the circles are not hidden.

::: tip
In the middle of dragging press and _hold_ the <kbd>Shift</kbd> key and notice that the selected point moves to the back of the sphere. This is generally how you can move objects on the back of the sphere or select objects on the back of the sphere.
:::
