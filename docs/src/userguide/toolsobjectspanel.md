---
title: Tools and Objects Panel
lang: en-US
---

# Tools & Objects Panel

In the Tools & Objects Panel there are two tabs.

## Tools Tab <icon-base notInLine iconName="toolsTab"> </icon-base>

There are many tools and they are explained [in their own section of this document.](/tools/edit).

## Objects Tab <icon-base notInLine iconName="objectsTab"> </icon-base>

### Expression Panel

Upon entering this expansion panel, the user is prompted to enter a calculation expression. This expression can use mathematical functions and constants (like $\sin(\pi)$ or $\tan(e^2)$, but not $\cot$, $\csc$ or $\sec$). In addition, the user can also use a Measurement Token (created for each measurement object) to refer to the value of the measurement. Each Mesurement Token is a capital M followed by a number. The expression is regularly parsed and either the approximate value is computed or an error is reported. An example can be found in the [measuring](/quickstart/measure#_3-use-the-calculation-row) part of the [Quick Start Guide](/quickstart/) on equilateral triangles.

<!-- Do I need a second example?
Here is a second example verifies that for a right triangle $ABC$ with right angle at side lengths $a$, $b:

- Clear the sphere by selecting the New Option on the blah blah menu.
- Create a circle using the [Circle Tool](/tools/basic#circle).
- Measure the distance between the center point of the circle and the point on the circle using the [Distance Tool](/tools/measurement#distance). Notice that a new row in the [Measurement Section of the Objects List](/userguide/toolsobjectspanel#objects-list). is created and that the Measurement Token M1 is displayed. -->

Some tips for using this feature:

- To enter $\pi$ type "pi".
- To enter $e$ type "e", the number that is approximately $2.718...$
- To compute the square root of the value corresponding to Measurement Token M1, type "sqrt(M1)" or "(M1)^(1/2)".
- You can enter a constant for the calculation expression (i.e. an entry with no Measurement Tokens) and then use the created Measurement Token to create a fixed radius [Measured Circle](/tools/measuredobject#measured-circle), a line at [fixed angle to another line through a point](/tools/measuredobject#measured-angle-line), or a rotation or translation by a fix amount.
- ???Calculation objects can be edited in the [Advanced Tab](/userguide/stylepanel#advanced-tab) of the [Style Panel](/userguide/stylepanel).
- When a calculation object <icon-base iconName="calculationObject" /> is created, a row describing some of its properties (including its value and Measurement Token) will appear in the [Measurement Section of the Objects List](/userguide/toolsobjectspanel#objects-list).
- When this tool is activated all previously selected objects are unselected and ignored.

### Parametric Curve Panel

This expansion panel create a curve based on user supplied parametric description.

- The user can enter the parametric description of a spherical curve by entering the Parametric Formulas, Optional Tracing Expressions, minimum/maximum parameter $t$ values, and $t$ values that are cusps in the curve (if any).
- Suppose the parametric curve is given by $P(t) = \langle x(t), y(t), z(t)\rangle$ where the curve is traced out for $t$ values between minimum ($t_{min}$) and maximum ($t_{max}$) parameter bounds. The $x(t)$, $y(t)$, and $z(t)$ formulas (they can depend on Measurement Tokens, but _must_ use the reserved parameter $t$) are entered in the Parametric Formulas panels and the values of $t_{min}$ and $t_{max}$ are entered in the minimum/maximum parameter boxes at the bottom. To add the curve to the construction click the plus sign.
- Note that $t_{min}$ and $t_{max}$ _must be numbers_ and cannot depend on measurement tokens. If the user would like the curve to be traced out between two $t$ values that depend on Measurement Tokens, use the Optional Tracing Expressions. These are two expressions that _must_ depend on measurements tokens, that give the starting and ending $t$ values when tracing the parametric curve. These values are always evaluated to be between $t_{min}$ and $t_{max}$. If the minimum expression evaluated to a value that is greater than the evaluation of the maximum expression, the curve is not draw.
- If there are any values that are cusp points, the $t$ parameter values (a list of numbers separated by commas) must be entered into the Cusp $t$ Values box.

<!--- If the $z(t)$ argument is missing it is assumed that $z(t) = \sqrt{1- (x(t)^2 + y(t)^2)}$.
- The curve can be open or closed. Closed means the curve drawn so as to connect $P(t_{min})$ and $P(t_{max})$. Although if $P(t_{min}) = P(t_{max})$ and this is a cusp point, it may be better to have this drawn as open curve.
- When drawn the curve is scaled so $||P(t)|| =1$ for all $t$.
- An optional parameter sets the number of points used to sample the curve. A larger number will be drawn in more detail, but may slow the app. The default is ????.
- A parametric curve can be edited in the Advanced Tab of the Style Panel.-->

- When a parametric curve is created, a row describing some of its properties will appear in the Parametric Section of the [Objects Tab](/userguide/#objects-tab) <icon-base  iconName="objectsTab"> </icon-base>. This includes slider that controls a point on the parametric.
- Here is an [example](/tools/exampleparametric) of how to enter a parametric curve.

### Slider Panel

When opening this expansion panel, the user can enter the minimum value, the step size, and the maximum value. Click the plus sign to add it to the [Measurement Section of the Objects List](/userguide/toolsobjectspanel#objects-list).

<!--- The lower bound, upper bound, step size, animation options (on, loop or reflect) can be edited in the [Advanced Tab](/userguide/stylepanel#advanced-tab) of the [Style Panel](/userguide/stylepanel).-->

- When a slider is created, a row describing some of its properties (including its value and Measurement Token) and the slider itself will appear in the [Measurement Section of the Objects List](/userguide/toolsobjectspanel#objects-list). This includes a play/stop buttons, a selection of speeds, and looping options.

### Objects list

Every time an object is created it is displayed in the Sphere Canvas and listed in the this section sorted by type. Each type group starts with a header and an icon to toggle between collapsing the group and displaying all members of the group. Empty groups are hidden. The following are the groups:

- [Points](/tools/basic#point)
- [Lines](/tools/basic#line)
- [Line Segments](/tools/basic#line-segment)
- [Circles](/tools/basic#circle) (Including [Circular Arcs](/tools/advanced#circular-arc))
- [Conics](/tools/conic)
- [Parametric Curves](/userguide/toolsobjectspanel#parametric-curve-panel)
- [Transformations](/tools/transformation)
- [Text](/tools/basic#text)
- [Measurements](/tools/measurement) Within this group the following are displayed each with its own measurement token.

  - [Line Segment Length](/tools/measurement#length)
  - [Point Distance](/tools/measurement#distance)
  - [Angles](/tools/measurement#angle)
  - [Coordinates](/tools/measurement#coordinates)
  - [Triangles](/tools/measurement#triangle)
  - [Polygons](/tools/measurement#polygon)
  - [Sliders](/userguide/toolsobjectspanel#slider-panel)
  - [Calculations](/userguide/toolsobjectspanel#expression-panel)

Expanding each group revels a list of those objects. Each item in that list appears in a row that contains some or all of the following (depending on the type of object being shown):

- The object type's icon
- The object's short user [defined name](/userguide/stylepanel#name). Hovering over this zone will display a tool tip that gives more details about the object. If the object is a Measurement Token, its token is also displayed and clicking on this will add the measurement token to the Calculation Expression box in the [Expression Panel](/userguide/toolsobjectspanel#expression-panel). If the user is created a [measured circle](/tools/measuredobject#measured-circle), clicking in the zone will use this measurement for the the radius of the circle.
- If the object is a [Measurement](/tools/measurement) object:
  - The button <icon-base iconSize ="20" iconName="cycleNodeValueDisplayMode"/> cycles the display of the value between one of three modes
    - Multiples of $\pi$
    - Degrees
    - Value
  - The button <icon-base iconSize ="20" iconName="copyToClipboard"/> copies the value of the measurement to the clipboard.
- The icon <icon-base iconSize ="20" iconName="showNode"/>/<icon-base  iconSize ="20" iconName="hideNode"/> controls if the object is hidden or not.
- The icon <icon-base iconSize ="20" iconName="showNodeLabel"/>/<icon-base iconSize ="20" iconName="hideNodeLabel"/> controls if the object's label is hidden or not.
- The icon <icon-base  iconSize ="20" iconName="deleteNode"/> to delete the object and everything, including the label, that depends on that object.

- The rows corresponding to [Parametric Curves](/userguide/toolsobjectspanel#parametric-curve-panel) and [Sliders](/userguide/toolsobjectspanel#slider-panel) are described elsewhere.

### Transformations

Create a transformation then apply it. Give example of creating one and then applying it.

## Saved Constructions Tab <icon-base notInLine iconName="constructionsTab"> </icon-base>

A list of the publicly and privately constructions that are available to the user to open.
