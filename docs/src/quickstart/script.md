---
title: Scripting
lang: en-US
next: /userguide/
---

# Scripting Objects

## 13. Focus the Style Panel

Activate the Style Panel by either right clicking on any vertex of the triangle and selecting settings from the menu, or by activating the Objects tab (TODO:AddIconImagine) and clicking on the three vertical dots at the end of the row containing the information about any one of the points. This focuses the Style Panel on one of the points.

## 14. Use the Advanced tab

Activate the Advanced tab in the Style Panel and look for the box labeled "Condition to Show Object". We are going to add a script in this box so that this vertex is displayed only when $\angle A \geq \frac{\pi}{3}$. If Measurement Token that refers to the measure of angle at vertex $A$ is still "M2", then enter "M2 >= pi/3" into this box. Use the Move Tool (TODO:AddIconImage) to move the vertices of the triangle. You should notice that when the measure of angle $A$ is bigger than or equal to $\frac{\pi}{3}$ then the point disappears and is visible otherwise.

TODO: add image showing this intermediate step

## 15. Dynamically Adjust the Colors

Focus the Style Panel on one of the line segments and activate the Advanced tab. In the region that says "Dynamic Colors" you should find three box labeled "Red:", "Green:", and "Blue:". We can enter an expression (with value from 0 to 1) in each of these three boxes that controls the Red, Green, and Blue components of the color of the line segment. We are going to make the color of this line segment vary from pure red to pure green depending on its length (i.e. the value of $a$).

If Measurement Token that refers to the measure of the length of segment $a$ is still "M1", enter "M1/(2\*pi)" in the Red box and enter "1-M1/(2\*pi)" in the Green box. Notice that I divided the measurement by $\pi$ so that "M1/(2\*pi)" would be between 0 and 1. Now use the Move Tool (TODO: AddIconImage) and watch the color of the line segment change as the triangle changes size.

TODO: add image showing this intermediate step
