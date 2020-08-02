---
title: Measure
lang: en-US
---

# Measure the Triangle

## 10. Use the Measure Segment Tool

Activate the [Measure Length Tool](/tools/measurement.html#length) and mouse release on one of the line segments in the triangle. Notice that when this measurement is made a new category, called Measurements, appears in the Objects tab (in addition to the Points, Line Segments and Calculations categories). Under this category a new row has appeared have appeared displaying the length of the selected line segment.

TODO: add image showing this intermediate step

::: tool-details Spherical Geometry: Distance versus Length
Notice that the Measure Segment Tool (TODO:AddIconImage) is different than the Measure Distance Tool (TODO:AddIconImage). The Measure Segment Tool measures the length of a segment which is always less than $2\pi$ and the Measure Distance Tool measures the distance between two points which is always less than $\pi$ because we are on a unit sphere. You can select the Settings icon (TODO: fix the wording and AddIconImage) and adjust the number of decimal places that are displayed.
:::

## 11. Use the Measure Angle Tool

Activate the [Measure Angle Tool](/tools/measurement.html#angle) and select two line segments of the triangle with a common endpoint at $A$ or select three vertices of the triangle in order so that the desired angle is formed at the middle point (point $A$). Notice that the order in which you select the line segments or points matters. If an angle marker appears that is not the angle you want use the Undo button or the Delete Tool (TODO:AddIconImage) and try selecting them in a different order. When you measure an angle, a row describing some of its properties (including its value) will appear in the Measurement Section of the [Objects Tab](/userguide/#objects-tab). The value of the angle measure is displayed as a multiple of $\pi$.

TODO: add image showing this intermediate step

::: details Angles are Geometric Objects
When two line segments have an endpoint in common one angle is formed but there are two potential angle measures associated with that angle depending if you measure the smaller or larger angle (one is always bigger than or equal to $\pi$). Spherical Easel always selects the angle that is determined by the right-hand rule (i.e. if you put the fingers of your right hand in the direction of the first segment selected with your thumb pointing away from the center of the sphere and curl them in the direction of the second segment selected, the region swept out by your fingers is the angle measured).
TODO: Add an image show the two ways of selecting points or line segments (numbered then with partial arrowed circle or just numbered) and the angles that are determined.
:::

## 12. Use the Calculation Tool

We are going to add a calculation expression to the Calculation Section of the [Objects Tab](/userguide/#objects-tab) that checks that if $a$ is the common side length and $A$ is the common angle measure of our equilateral triangle then the expression $\tan(\frac{a}{2})^2 = 1 - 2 \cos(A)$ is always true.

When you created the measurements in the previous two steps, the Objects Tab displayed not only the numerical value of the measurement but a Measurement Token. The Measurement Token is a the letter M followed by a number, like "M2". You can use this token to reference that measurement in a calculation expression. For example, if the only two measurements you have created are the ones you created in the previous two steps (and you measure the line segment first and the angle second) then the Measurement Token "M1" references the numerical value of the length of $a$ and the token "M2" references the numerical value of the angle at vertex $A$.

Activate the [Calculation Tool](/tools/measurement.html#calculation) and a dialog box should appear. To compute the right-hand side of the expression enter "tan(M1/2)^2" in the blank input line in the dialog box and press enter. You should see a new row appear in the Calculation Section of the [Objects Tab](/userguide/#objects-tab) and the value in the row is the value of $\tan(\frac{a}{2})^2$. Activate the Calculation Tool again and see if you can compute the value of $1 - 2 \cos(A)$. These two computed values should be the same.

Use the [Move Tool](/tools/display.html#move) to move the vertices of the triangle and observe that the two calculations are the same.

TODO: Add an image show the two ways of selecting points or line segments (numbered then with partial arrowed circle or just numbered) and the angles that are determined.

::: tip
Sometimes it is easier to create a third computation that is the simply difference of two other computations. If this difference is zero you know that the two quantities are equal.
:::
