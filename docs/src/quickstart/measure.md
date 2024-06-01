---
title: Measure
lang: en-US
---

# Measure the Triangle

## 10. Use the Measure Segment Tool

Activate the [Line Segment Length Tool](/tools/measurement#length) <IconBase icon-name="segmentLength" /> in the "Measurement Tools" group. Then mouse click and release on the $a$ line segment in the triangle.

When this measurement is made two things change, one you can easily see and the other in a panel you have to open:

 - The visible easily seen change is that the label now includes the length of $a$ in multiples of $\pi$.
 - The other change is that a new list, called Measurements, appears in the Objects <IconBase icon-name="objectsTab" /> tab accessible from the leftmost vertical panel.  Opening this tab shows a list of each item type in the construction (in addition to the "Expression", "Parametric Curves" and "Sliders" panels which are always displayed). These include
   - Points,
   - Line Segments,
   - Circles, and
   - Measurements.

Expanding each item gives a row for each element of the construction including the name and several icons for modifying the display of the element. Notice when you mouse over a row the corresponding element is highlighted.

TODO: add image showing this intermediate step blah blah

::: details Spherical Geometry: Distance versus Length

Notice that the Measure Line Segment Tool <IconBase icon-name="segmentLength" /> is different than the Measure Distance Tool <IconBase icon-name="pointDistance" />. The Measure Line Segment Tool measures the length of a segment which is always less than $2\pi$ and the Measure Distance Tool measures the distance between two points which is always less than $\pi$ because we are on a unit sphere. You can select the Settings icon (TODO: fix the wording and AddIconImage) and adjust the number of decimal places that are displayed.
:::

## 11. Use the Measure Angle Tool

Activate the [Measure Angle Tool<IconBase icon-name="angle" />](/tools/measurement#length)  in the "Measurement Tools" group. Then select two line segments of the triangle with a common endpoint at $A$ or select three vertices of the triangle in order so that the desired angle is formed at the middle point (point $A$). Notice that the order in which you select the line segments or points matters. If an angle marker appears that is not the angle you want use the Undo <IconBase icon-name="undo" /> button or the Delete Tool <IconBase icon-name="delete" /> and try selecting them in a different order.

When you measure the angle made two things change, one you can easily see and the other in a panel you have to open:

 - The visible easily seen change is that the label now includes the angle of $A$ in multiples in degrees.
 - The other change is that a new item appeared on the Measurements list (in the Objects <IconBase icon-name="objectsTab" /> tab accessible from the leftmost vertical panel.  Opening this tab shows a list of each item type in the construction.) See [Measurement Section of the Objects Tab](/userguide/toolsobjectspanel#objects-list)

TODO: add image showing this intermediate step

::: details Angles are Geometric Objects
When two line segments have an endpoint in common one angle is formed but there are two potential angle measures associated with that angle depending if you measure the smaller or larger angle (one is always bigger than or equal to $\pi$). Spherical Easel always selects the angle that is determined by the right-hand rule (i.e. if you put the fingers of your right hand in the direction of the first segment selected with your thumb pointing away from the center of the sphere and curl them in the direction of the second segment selected, the region swept out by your fingers is the angle measured). TODO: Add an image show the two ways of selecting points or line segments (numbered then with partial arrowed circle or just numbered) and the angles that are determined.
:::
## 12. Use the Expression Panel

We are going to add a calculation expression to the Calculation Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base> that checks that if $a$ is the common side length and $A$ is the common angle measure of our equilateral triangle then the expression $\tan(\frac{a}{2})^2 = 1 - 2 \cos(A)$ is always true.

When you created the measurements in the previous two steps, measurement list in the Objects Tab <icon-base  iconName="objectsTab"/> displayed not only the numerical value of the measurement but a Measurement Token. The Measurement Token is a the letter M followed by a number, like "M1" or "M2". You can use this token to reference that measurement in a calculation expression. For example, if the only two measurements you have created are the ones you created in the previous two steps (and you measure the line segment first and the angle second) then the Measurement Token "M1" references the numerical value of the length of $a$ and the token "M2" references the numerical value of the angle at vertex $A$.

Expand the "Expression Panel" in Objects <IconBase icon-name="objectsTab" /> tab. To compute the right-hand side of the expression enter "tan(M1/2)^2" in the blank input line in the dialog box and press the plus icon to add the expression to measurement list. You should see a new row appear in the Measurement Section and the value in the row is the value of $\tan(\frac{a}{2})^2$.

Use the "Expression Panel" and see if you can compute the value of $1 - 2 \cos(A)$. These two computed values should be the same.

Use the [Move Tool <IconBase icon-name="move" />](/tools/display#move) to move the vertices of the triangle and observe that the two calculations are the same.

TODO: Add an image show the two ways of selecting points or line segments (numbered then with partial arrowed circle or just numbered) and the angles that are determined.

::: tip
Sometimes it is easier to create a third computation that is the simply difference of two other computations. If this difference is zero (or very small) you know that the two quantities are equal.
:::
