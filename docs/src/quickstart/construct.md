---
title: Constructing
lang: en-US
---

# Construct An Equilateral Triangle

## 1. Activate the Tools Mode

On the left hand side of the Spherical Easel application window there are two vertical panels. The left most darker one is for changing between modes.  There are four modes:

- Tools <IconBase icon-name="toolsTab" />: A list of categories of tools should be display including "Edit", "Display", etc. The current active tool and its icon is displayed at the very top of inner panel.
- Objects <IconBase icon-name="objectsTab" />: At the top of inner panel are three panels: "Expression", "Parametric Curves", and "Slider". Expression will be used in [step #12](/quickstart/measure#12-use-the-calculation-tool). As you construct items in the Sphere Canvas, a list of each item type will appear in this panel. Opening each type list, gives access to each element in your construction.
- Constructions <IconBase icon-name="constructionsTab" /> This will display a list of your (owned) constructions, a list of starred constructions <IconBase icon-name="starConstruction" />, and a list of public constructions. When you have the correct permissions you can save your constructions.
- Earth <IconBase icon-name="earthTab" /> This displays options related to earth mode and latitude and longitude.

The default is the Tools mode.  Make sure that the Tools mode is active and you can see collection of tool groups.

TODO: add image (with labels) showing this and Sphere Canvas

## 2. Use the Line Segment Tool

Activate the Line Segment Tool by clicking on the "Basic Tools" group and then on the "Create Line Segment" <IconBase icon-name="segment" /> button. Then, on the sphere outlined with a black boundary circle displayed in the center Sphere Canvas Panel, click (mouse press), drag, and mouse release to create a line segment.

TODO: add image showing this intermediate step

::: tip
If you don't like the results you can click the Undo <IconBase icon-name="undo" /> button lower part of the Sphere Canvas Panel or you can activate the Delete Tool <IconBase icon-name="delete" /> in the "Edit Tools" group and delete objects and try again.
:::

## 3. Use the Circle Tool

Activate the Circle Tool by clicking the "Create Circle" <IconBase icon-name="circle" /> button in the "Basic Tools" group. Next click (only mouse press) on one endpoint of the line segment, and then drag and mouse release on the other endpoint of the line segment. You should have constructed a line segment from the center of a circle to a point on the boundary of that circle.

TODO: add image showing this intermediate step

::: details Construction Check: Are you constructing or merely plotting an arrangement?

You should check your construction by activating the Move Tool <IconBase icon-name="move" />  in the "Display Tools" group and using the mouse to move various elements of your construction. For example, if you mouse press and drag on the center point of the circle, **both** the circle and the line segment should update and the center of the circle should remain the one endpoint of the line segment. Similarly, if you move the other endpoint of the line segment, **both** the circles and the line segment should update and that endpoint should remain on the circle. If your construction doesn't behave this way you are merely plotting and you should use the Undo <IconBase icon-name="undo" /> button. Always try to click close to the endpoints of the line segment to make sure that the endpoints of the line segment and the point on the circle are the same. Spherical Easel always assumes that if you attempt to create a point near an existing point, you would like to use the nearby point and not create a new one.
:::

## 4. Use the Circle Tool Again

If necessary, activate the Circle Tool <IconBase icon-name="circle" />  again and create a circle with center at the _other_ endpoint of the line segment and release at the center of the first circle so that you have two circles with common radius of the line segment and centers at each endpoint of the line segment.

TODO: add image showing this intermediate step

## 5. Use the Line Segment Tool Again

Again activate the Line Segment tool ("Create Line Segment" <IconBase icon-name="segment" /> in "Basic Tools" group). Then by mouse pressing _near_ the location of one of the intersection points of the two circles and then dragging and releasing at the the center of one of the circles create a line segment from an intersection of the circles to one end point of the line segment. Repeat this to create a line segment from the same intersection point to the other endpoint of the line segment.

TODO: Add image showing this intermediate step

::: tip
Spherical Easel always assumes that if the user attempts to create a point _**near**_ an intersection of two one-dimensional objects, the user would like the point to be constrained to always be placed at precisely intersection of the objects.
:::

## 6. Hide the circles and explore

TODO: Add image showing this intermediate step

Activate the Hide Tool <IconBase icon-name="hide" /> in the "Display Tools" group. Then click and mouse release on each of the circles (but not on either point that defines a circle) to hide them. Now activate the Move Tool <IconBase icon-name="move" /> and click and drag either endpoint of the original line segment around. You should notice that the triangle remains equilateral. Can you explain why it is equilateral? _Note_: You won't be able to move the third vertex of the triangle independently, because that one is defined by the two circles and can't be moved directly even if the circles are not hidden.

::: tip
In the middle of dragging press and _hold_ the <KeyShortcuts macShift pcShift  /> key and notice that the selected point moves to the back of the sphere. Holding the <KeyShortcuts macShift pcShift  /> key direct all mouse actions to the back of the sphere.
:::

::: details **Congratulations!** You have constructed an equilateral triangle!

Now discover a flaw in Euclid: Make the triangle as big as possible. Does the triangle always exist? Do two circles that share a common line segment radius always intersect? No! Contrast this with Euclidean geometry.

:::
