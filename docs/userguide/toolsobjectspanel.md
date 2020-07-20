---
title: Tools and Objects Panel
lang: en-US
---

# Tools & Objects Panel

In the Tools & Objects Panel there are two tabs.

## Tools Tab

There are many tools and they are explained [in their own section of this document.](/tools/edit.html).

## Objects Tab

Every time an object is created it is displayed in the Sphere Canvas and then listed in the this tab. In addition, every measurement creates a row in this tab. This list is sorted into groups by the type of object or measurement displayed. Each group starts with a header and an icon to toggle between collapsing the group and displaying all members of the group. Empty groups are hidden. The following are the groups:

- [Points](/tools/basic.html#point)
- [Line Segments](/tools/basic.html#line-segment)
- [Lines](/tools/basic.html#line)
- Angle Markers - See the Details Section of the [Measure Angle Tool](/tools/measurement.html#angle)
- [Circles](/tools/basic.html#circle) (Including [Circular Arcs](/tools/advanced.html#circular-arc))
- [Conics](/tools/conic.html)
- [Polygons](/tools/basic.html#polygon-too-hard)
- [Parametric Curves](/tools/advanced.html#parametric-curve-user-defined)
- [Transformations](/tools/transformation.html)
- [Text](/tools/basic.html#text)
- [Measurements](/tools/measurement.html)
- [Sliders](/tools/measurement.html#slider)
- [Calculations](/tools/measurement.html#calculation)

Within each group information about each object is displayed in a row that includes

- A small button/icon to control if the object is hidden or not. This is a circle that is filled if the object is displayed and empty if the object is hidden.
- Short [Name](/userguide/stylepanel.html#name)
- An information zone that display different pieces of information depending on the class of the object:
  - [Measurements](/tools/measurement.html) and [Calculations](/tools/measurement.html#calculation): Toggle between
    1. Measurement Token followed by the measurement's current value (default)
    2. [Definition Text](/userguide/stylepanel.html#definition-text)
  - [Sliders](/tools/measurement.html#slider): Toggle between:
    1. A actual adjustable copy of the the slider is displayed, with a play/pause button, increase/decrease speed options, the Measurement Token and current value. (Default)
    2. A display allowing the user to adjust the lower and upper bounds, and step size.
  - All other classes only the [Definition Text](/userguide/stylepanel.html#definition-text) is displayed.
- A button/icon to pull up a menu that asks the user to select between:
  - Delete - Removes the object and all dependent objects from the arrangement.
  - Style - This option selects the object and opens the Style Panel so it can easily be edited.
  - Display Multiples of $\pi$ - This is only an option for Measurement, Slider, and Calculation objects and controls if the value is displayed should be in multiples of $\pi$. By default, all displayed values are multiples of $\pi$ and so are always postpended with a $\pi$ unless this option is changed.

Row organization (The Information zone is the longest):

| Show/Hide icon | Short name | Information | Three vertical dots icon |
| -------------- | ---------- | ----------- | ------------------------ |


### Calculations

Each time a [measurements](/tools/measurement.html) tool is used a Measurement Token appears in the row of the Object Tab that describes the measurement or calculation. A Measurement Token is a capital letter M followed by a number. You can use this token in defining an expression with the [Calculation Tool](/tools/measurement.html#calculation) or in the [Advanced Tab](/userguide/stylepanel.html#advanced-tab) to create custom calculations that are updated as the objects on the sphere are moved. After the Measurement Token is value of the measurement or calculation.

An example can be found in the [measuring](/quickstart/measure.html#_3-use-the-calculation-row) part of the [Quick Start Guide](/quickstart/) on equilateral triangles.

<!-- Do I need a second example?
Here is a second example verifies that for a right triangle $ABC$ with right angle at side lengths $a$, $b:

- Clear the sphere by selecting the New Option on the blah blah menu.
- Create a circle using the [Circle Tool](/tools/basic.html#circle).
- Measure the distance between the center point of the circle and the point on the circle using the [Distance Tool](/tools/measurement.html#distance). Notice that a new row in the Measurement Section of the Objects Tab is created and that the Measurement Token M1 is displayed. -->

You can enter a constant in a calculation expression (i.e. an entry with no Measurement Tokens) and then use the created Measurement Token to create a [Line Segment](/tools/basic.html#line-segment) or [Circular Arc](/tools/advanced.html#circular-arc) with a constant length or a line at [fixed angle to another line through a point](/tools/measuredobject.html#measured-angle-line).

### Transformations

Create a transformation then apply it. Give example of creating one and then applying it.
