---
title: Style Panel
lang: en-US
next: /tools/edit
---

# Style Panel

The Style Panel is found on the right-hand side of the screen. The Style Panel is hidden initially and can be made visible by clicking on the Style Settings (TODO:AddIconImage) icon in the upper right corner of the Sphere Canvas.

The Style Panel allows the user to adjust the visual style and feel of objects displayed in the Sphere Canvas: stroke color and width, fill color, opacity, and labeling. The focus of the Style Panel is one or more selected object whose attributes the user would like to modify. The user can use the [Selection Tool](/tools/edit.html#selection) to select a single object or a collection of objects and then the Style Panel will will display the options for the object or objects. If a single object is in focus, then all options for that object are displayed. If multiple objects are selected then only the adjustable attributes common to all the objects are displayed. The adjustable attributes are spread over several tabs and the functionality of each is described below.

The user can select a Transformation, Measurement, Calculation, or object by clicking on it in the Objects Tab.

## Label Tab

This tab displays the adjustable features of the selected object(s) label including the following:

### Definition Text

This is an automatically generated string that gives some information about the selected object. This is also the string that is displayed in the Object Tab to describe some of the features of the object. This will alway help determine the dependency structure by indicating the parents of the object (if any). The location of points that are free (i.e. have no parents) is listed in this string.

Here are several examples:

- P1(0.214, -0.782, 0.585) - Point 1 is located at the given coordinates.
- Intersection(C1,C2) - A point at the intersection circles 1 and 2. This is different than Intersection(C2,C1) because, generically, two intersections of the circles can be distinguished by the right-hand rule. If you place your right and at the center of the sphere with you fingers pointing in the direction of the center of the first listed circle and sweep your fingers in the direction of center of the second circle, your thumb will indicate which side of the plane containing the plane $P$ the intersection point occurs on. $P$ is the plane containing the center of the sphere and the centers of the two circles.
- On(H1) - A point on hyperbola 1.
- Circle(P2, P3) - A circle with center at point P2 containing point P3.
- Parabola(P1, L2) - A parabola with center P1 and directrix line L2.
- N-Sect(Ls2,3,2) - The 2nd point in the 3-Secting of line segment Ls2.
- Reflection(Li1) - A Reflection over line Li1.
- Text(`<string>`) - The text displayed by the text object.
- M2-Length(Li1) - The length of line segment Li1, with Measurement Token M2.
- M3-SliderVal(S1) - The value of slider S1, with Measurement Token M3.
- M4-CalcVal(Calc1) - The value of the calculation Calc1 with Measurement Token M4
- AngleMarker(Li1, Li2) - Angle Marker between lines Li1 and Li2

### Name

This is automatically generated when the object was created, but the user can change it. The name can contain [$\LaTeX$](https://en.wikipedia.org/wiki/LaTeX) strings and it doesn't have to be unique. These are typically short because of their use in the Definition Text displayed in the Objects Tab. Here are several automatically generated names that demonstrate the default naming conventions:

- P - [Point](/tools/basic.html#point)
- Li - [Line](/tools/basic.html#line)
- Ls - [Line Segment](/tools/basic.html#line-segment)
- C - [Circle](/tools/basic.html#circle)
- E - [Ellipse](/tools/conic.html#ellipse)
- H - [Hyperbola](/tools/conic.html#parabola)
- Pa - [Parabola](/tools/conic.html#hyperbola)
- Po - [Polygon](/tools/basic.html#polygon-too-hard)
- Ca - [Circular Arc](/tools/advanced.html#circular-arc)
- Pc - [Parametric Curve](/tools/advanced.html#parametric-curve-user-defined)
- Rp - [Reflection over a point](/tools/transformation.html#create-reflection-over-point)
- Rl - [Reflection over a line](/tools/transformation.html#create-reflection)
- Ro - [Rotation](/tools/transformation.html#create-measured-rotation)
- Tr - [Translation](/tools/transformation.html#create-translation)
- In - [Inversion](/tools/transformation.html#create-inversion)
- Calc - [Calculation](/userguide/toolsobjectspanel.html#calculations)
- Sl - [Slider](/tools/measurement.html#slider)
- Tx - [Text](/tools/basic.html#text)
- Am - Angle Marker

Maximum length is ?15? characters. TODO: Update? Is a limit even needed?

### Caption

This is a user generated string that helps the user describe the object more fully. For example, a point might have name P10 but the user might also want to display more information about the point and set the caption to the more informative string “The centroid”. This string can contain [$\LaTeX$](https://en.wikipedia.org/wiki/LaTeX) strings and carriage returns.

Maximum length is ?30? characters. TODO: Update? Is a limit even needed?

### Label Styling Options

This allows the user to select the attributes of how the text of the name, value, and caption of labels are rendered on the front and back of the sphere. The options are

- Font Family
- Font Size
- Font Style
- Display Angle
- Decorations
- Front Color
- Back Color

The front color is the color used when rendering the text on the front of the sphere. The back color option is both a check box (labelled "Auto") and a color picker. If the box is unchecked the selected color is used. If the box is checked the color is automatically computed based on a contrast constant and the front color (and the color picker value is ignored). To adjust the contrast use the [Global Settings](/userguide/titlebar.html#global-settings). contrast = 1 => no difference between front and back
Contrast = 0 => Nothing appears on back of sphere for colors and size reduction is maximized

### Label Display Options

This is a check box followed by a pull down menu so the user can select which attributes to display in the label location associated to the object. The options in the pull down menu are:

- Name - Only the name is displayed
- Caption - Only the caption is displayed (unavailable if the caption is not defined)
- Value - Only the value is displayed (unavailable if the value is not defined). For example, if the length of a line segment has been measured, then the label for that line segment will include this option and the value is the length of the line segment.
- Name & Caption - Only the name and caption are displayed (unavailable if the caption is not defined)
- Name & Value - Only the name and value are displayed (unavailable if the value is not defined).

If the box is unchecked nothing is displayed at the label location, the label is hidden, and the options in the pull down menu are ignored. If the box is checked the pull down menu indicates what is displayed at the label location.

### Show Object

If this box is checked the object is shown.

### Trace Options

This is a check box that is unchecked by default. If this feature is activated, a temporary copy of the object is left behind as the object moves on the sphere (i.e. is moved with the [Move Tool](/tools/display.html#move)). To clear the temporary copies deactivate the Move Tool by activating another tool. This is feature only applies to points, lines, and circles.

### Fix Object

Checking this box will make any free objects fixed. That is, the move tool will not be able to move the object. Checking this box for already unmovable objects will have no effect on those objects. To learn more about free objects see the details of the [Move Tool](/tools/display.html#move).

## Front Style Tab

This tab allows the user to adjust the style features of the selected object(s) that pertain to their rendering on the front of the sphere. They include pickers for the following attributes:

- Fill Color And No Fill Options
- Stroke Color And No Stroke Options
- Stroke Width
- Radius
- Dashing Pattern

Which options are displayed depends on the objects selected. For example, the Fill Color is only available for points, circles, conic, and polygons. Radius is only available for points and angle markers and Dashing pattern is only available for one-dimensional objects.

## Back Style Tab

This tab allows the user to adjust the style features of the selected object(s) that pertain to their rendering on the back of the sphere. At the top of this tab is a check box (labelled "Auto").
If the box is unchecked the selected styles are used to render the object on the back of the sphere. If the box is checked the styles are automatically computed based on a contrast constant and the front style (and the style choices are ignored). To adjust the contrast use the [Global Settings](/userguide/titlebar.html#global-settings).
contrast = 1 => no difference between front and back
Contrast = 0 => Nothing appears on back of sphere for colors and size reduction is maximized
  
They include pickers for the following attributes:

- Fill Color And No Fill Option
- Stroke Color And No Stroke Options
- Stroke Width
- Radius
- Dashing Pattern

Which options are displayed depends on the objects selected. For example, the Fill Color is only available for points, circles, conic, and polygons. Radius is only available for points and angle markers and Dashing pattern is only available for one-dimensional objects.

## Advanced Tab

This tab allows the user to adjust some of the style features of the selected objects based on Measurement Token. For example:

- The user can write a boolean valued expression the controls if the object is shown or not (overriding the [Show Object](/userguide/stylepanel.html#show-object) check box).
- The user can write a real valued expression that controls the Red, Blue, or Green component of the color of either the fill (in the case of points) or the stroke color (in the case of one-dimensional objects).
- For [Line Segments](/tools/basic.html#line-segment) and [Circular Arc](/tools/advanced.html#circular-arc) the extension value is set here. The user can enter a fix number or a Measurement Token to control the length of the Line Segment or Circular Arc. Details can be found in the tool descriptions.
- For [Parametric Curves](/tools/advanced.html#parametric-curve-user-defined) this is the tab where the parametric description $P(t)$, lower bound ($t_l$), upper bound ($t_u$), and open/closed options are entered. Details can be found in the tool description.
- The user can edit a [Calculation](/userguide/toolsobjectspanel.html#calculations) in this tab.
- The user edit a [Slider](/tools/measurement.html#slider) in this tab. The user can adjust the lower and upper bounds of the slider, the step size, and if the slider should be animated.
