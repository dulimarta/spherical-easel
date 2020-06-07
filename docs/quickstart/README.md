---
sidebar: auto
title: Explore Equilateral Triangles
lang: en-US
---

![Spherical Easel Logo](./SphericalEaselLogo.gif)

Temp image: A cool centered illustration goes here -- perhaps an animated gif. TODO: Update image

# Quick Start: Explore Equilateral Triangles

In the spirit of Euclid, we will guide the user through the steps to

- Construct a spherical equilateral triangle with common
  side length $a$ and angle $A$.
- Adjust the display style of the triangle and its location on the sphere.
- Numerically confirm the relationship $\tan(\frac{a}{2})^2 = 1 - 2 \cos(A)$.
- Add scripts to parts of the triangle so that one of the vertices is displayed only when $\angle A \geq \frac{\pi}{3}$ and the color of one of the sides of the triangle changes color depending on its length (i.e. the value of $a$).

## Construction

### 1. Display the Tools Tab

On the left hand side of the Spherical Easel application window (or the bottom if mobile) there is a Objects & Tools Panel. This panel contains two tabs at the top: a Tools tab (TOOD:AddIconImage) that displays the available tool buttons and an Object tab (TOOD:AddIconImage icon) that displays a list of the plotted objects, measurements, and calculations. Make sure that the Tools tab is active and you can see collection of tools each of which is represented with labeled button in the Objects & Tools Panel.

TODO: add image (with labels) showing the Objects & Tools Panel with the Tools tab displayed and the Sphere Canvas

::: tip
The Objects & Tools Panel may be minimized. It you don't see it, click and release anywhere in the region on the left (or bottom on mobile) or on the right arrow icon (TODO:AddIconImage) to maximize it. When maximized you can control the size of it by mousing over its right (top) border and when you see the mouse icon change to (TODO:AddIconImage), click and drag the border.
:::

### 2. Use the Segment Tool

Activate the Segment Tool by clicking on the Segment Tool button (TOOD:AddIconImage) in the Objects & Tools Panel and then, on the sphere outlined with a black boundary circle displayed in the center Sphere Canvas Panel, click (mouse press), drag, and mouse release to create a line segment.
::: tip
If you don't like the results you can click the Undo button (TOOD:AddIconImage icon) in the upper left of the Sphere Canvas Panel or you can activate the Delete Tool (TODO:AddIconImage) and delete objects and try again.
:::

### 3. Use the Circle Tool

Activate the Circle Tool (TOOD:AddIconImage) and then click (mouse press) on one endpoint of the line segment, and then drag and mouse release on the other endpoint of the line segment. You should have constructed a line segment from the center of a circle to a point on the boundary of that circle.

TODO: add image showing this intermediate step

::: details Check: Are you constructing or merely plotting an arrangement?
You should check your construction by activating the Move Tool (TOOD:AddIconImage) and using the mouse to move various elements of your construction. For example, if you mouse press and drag on the center point of the circle, **both** the circle and the line segment should update and the center of the circle should remain the one endpoint of the line segment. Similarly, if you move the other endpoint of the line segment, **both** the circles and the line segment should update and that endpoint should remain on the circle. If your construction doesn't behave this way you are merely plotting and you should use the Undo button or select the new option on the (TODO:update) blah menu to try again. Try to press and release the mouse closer to the endpoints of the line segment to make sure that the endpoints of the line segment and the point on the circle are the same. Spherical Easel always assumes that if you create a point near an existing point you would like to use the nearby point and not create a new one.
:::

### 4. Use the Circle Tool Again

If necessary, activate the Circle Tool and create a circle with center at the _other_ endpoint of the line segment and release at the center of the first circle so that you have two circles with common radius of the line segment and centers at each endpoint of the line segment.

### 5. Use the Segment Tool Again

By mouse pressing _near_ the location of one of the intersection points of the two circles and then dragging and releasing at the the center of one of the circles create a line segment from an intersection of the circles to one end point of the line segment. Repeat this to create a line segment from the same intersection point to the other endpoint of the line segment.

TODO: Add image showing this intermediate step

::: tip
Spherical Easel always assumes that if you attempt to create a point _near_ an intersection of two objects you would like the point exactly at the intersection. Similarly, if you attempt to create a point near a one-dimensional object it is assumed that you want the point created _on_ the object. (A point is on an object, or "glued" to it, if you can move the point but it never leaves the object it is glued to.)
:::

### 6. Hide the circles and explore

Activate the Hide Tool (TODO:AddIconImage) and mouse release on each of the circles (but not on either point that defines a circle) to hide them. Now activate the Move Tool (TOOD:AddIconImage) and click and drag either endpoint of the original line segment around. You should notice that the triangle remains equilateral. Notice you won't be able to move the third vertex of the triangle independently, because that one is defined by the two circles and can't be moved directly even if the circles are not hidden.

::: tip
In the middle of dragging press and _hold_ the <kbd>Shift</kbd> key and notice that the selected point moves to the back of the sphere. This is generally how you can move objects on the back of the sphere or select objects on the back of the sphere.
:::

## Adjust the Style and Display

### 1. Use the Rotate Tool

Activate the Rotate Tool (TOOD:AddIconImage) and then mouse press and drag on the sphere to move your construction around on the sphere. You can rotate your construction repeatedly by releasing and clicking and dragging again. Drag your construction to the back of the sphere. Notice that when your construction is on the back of the sphere it is displayed in a slightly different style, you can adjust this the front style and back style behavior using the next step.

### 2. Adjust the Style and Labels

By either right clicking on any vertex of the triangle and selecting settings from the menu, or by activating the Objects tab (TODO:AddIconImagine) and clicking on the three vertical dots at the end of the row containing the information about any one of the points or by clicking the Settings Icon (TODO:AddIconImage) in the upper right corner of the Sphere Canvas, activate the Style Panel. The Style Panel should appear on the right side of the application window and contain several tabs. Each of the tabs allows you to adjust certain features of the selected object, in this case the point that is the focus (the one you selected). Notice that their are options for adjusting the front and back styles either automatically using the global contrast variable or manually. See if you can change the label of one of the points to $A$ and display it.

::: tip
You can use [$\LaTeX$](https://en.wikipedia.org/wiki/LaTeX) to typeset your captions and labels by enclosing the appropriate $\LaTeX$ command or symbol code in dollar signs ($).  So $A$ is entered as \$A\$, $\theta$ as \$\theta\$, and $E= \frac{mc^2}{\sqrt{1-\frac{v^2}{c^2}}}$ as \$E = \frac{mc^2}{\sqrt{1-\frac{v^2}{c^2}}}\$.
:::

To change the object that the Style Panel is focused on, merely leave the Style Panel open and click on the object either in the Sphere Canvas or on the corresponding row in the Objects tab. See if you can change the color of the line segments to red and label the line segment across from point $A$ as $a$.

To close the Style Panel, click the (TODO:AddIconImage) icon in the upper right hand corner.

TODO:Inlcude a image of the results of this.

## Measure the Triangle

### 1. Use the Measure Segment Tool

Activate the Measure Segment Tool (TODO:AddIconImage) and mouse release on one of the line segments in the triangle. Notice that when this measurement is made a new category, called Measurements, appears in the Objects tab (in addition to the Points, Segments and Calculations categories). Under this category a new row has appeared have appeared displaying the length of the selected line segment.

::: details Spherical Geometry: Distance versus Length
Notice that the Measure Segment Tool (TODO:AddIconImage) is different than the Measure Distance Tool (TODO:AddIconImage). The Measure Segment Tool measures the length of a segment which is always less than $2\pi$ and the Measure Distance Tool measures the distance between two points which is always less than $\pi$ because we are on a unit sphere. You can select the Settings icon (TODO: fix the wording and AddIconImage) and adjust the number of decimal places that are displayed.
:::

### 2. Use the Measure Angle Tool

Activate the Measure Angle Tool (TODO:AddIconImage) and select two line segments of the triangle with a common endpoint $A$ or select three vertices of the triangle in order so that the desired angle is formed at the middle point (point $A$). Notice that the order in which you select the line segments or points matters. If an angle marker appears that is not the angle you want use the Undo button or the Delete Tool (TODO:AddIconImage) and try selecting them in a different order. A new row should appear under the Measurements category in the Objects tab displaying the angle measure as a multiple of $\pi$.

::: details Angles are Geometric Objects
When two line segments have an endpoint in common one angle is formed but there are two potential angle measures associated with that angle depending if you measure the smaller or larger angle. Spherical Easel always selects the angle that is determined by the right-hand rule (i.e. if you put the fingers of your right hand in the direction of the first segment with your thumb pointing away from the center of the sphere and curl them to the direction of the second, the region swept out by your fingers is the angle measured).
:::

TODO: Add an image show the two ways of selecting points or line segments (numbered then with partial arrowed circle or just numbered) and the angles that are determined.

### 3. Use the Calculation Row

Activate the Objects tab in the Objects & Tools Panel and look for the Calculation category. Under this category you should see a blank input box/line. We are going to add a Calculation that checks that if $a$ is the common side length and $A$ is the common angle measure of our equilateral triangle then the expression $\tan(\frac{a}{2})^2 = 1 - 2 \cos(A)$ is always true.

When you created the measurements in the previous two steps, the Objects tab displayed not only the numerical value of the measurement but a measurement token. The measurement token is a the letter M followed by a number, like "M2". You can use this token to reference that measurement in a calculation. For example, if the only two measurement you have created are the ones you created in the previous two steps (and you measure the line segment first and the angle second) then the measurement token "M1" references the numerical value of the length of $a$ and the token "M2" references the numerical value of the angle at vertex $A$.

To compute the right-hand side of the expression enter "tan(M1)^2" in the blank input line and press enter. You should see a new computation appear that corresponds to the right-hand side's value. Under this computation a new blank input box/line should appear. See if you can compute the left-hand side of the expression in this new blank line. These two computed values should be the same.

::: tip
Sometimes it is easier to create a third computation that is the simply difference of two other computations. If this difference is zero you know that the two quantities are equal.
:::

## Advanced Scripting

### 1. Focus the Style Panel

Activate the Style Panel by either right clicking on any vertex of the triangle and selecting settings from the menu, or by activating the Objects tab (TODO:AddIconImagine) and clicking on the three vertical dots at the end of the row containing the information about any one of the points. This focuses the Style Panel on one of the points.

### 2. Use the Advanced tab

Activate the Advanced tab in the Style Panel and look for the box labeled "Condition to Show Object". We are going to add a script in this box so that this vertex is displayed only when $\angle A \geq \frac{\pi}{3}$. If measurement token that refers to the measure of angle at vertex $A$ is still "M2", then enter "M2 >= pi/3" into this box. Use the Move Tool (TODO:AddIconImage) to move the vertices of the triangle. You should notice that when the measure of angle $A$ is bigger than or equal to $\frac{\pi}{3}$ then the point disappears and is visible otherwise.

### 3. Dynamically Adjust the Colors

Focus the Style Panel on one of the line segments and activate the Advanced tab. In the region that says "Dynamic Colors" you should find three box labeled "Red:", "Green:", and "Blue:". We can enter an expression (with value from 0 to 1) in each of these three boxes that controls the Red, Green, and Blue components of the color of the line segment. We are going to make the color of this line segment vary from pure red to pure green depending on its length (i.e. the value of $a$).

If measurement token that refers to the measure of the length of segment $a$ is still "M1", enter "M1/(2\*pi)" in the Red box and enter "1-M1/(2\*pi)" in the Green box. Notice that I divided the measurement by $\pi$ so that "M1/(2\*pi)" would be between 0 and 1. Now use the Move Tool (TODO: AddIconImage) and watch the color of the line segment change as the triangle changes size.
