---
title: Design Document
---

# Spherical Easel Design Document

## Overview

- Code patterns
- Components
- Zoom Port
- Global Settings
- Handlers Details

  - Separate Document

- Zooming

  - In
  - Out
  - Pan?
  - Full Screen
  - Home

- undo/redo
- Point On Object (Included for completeness - this should happen automatically shouldn't be needed)
- Intersection Point (Included for completeness - this should happen automatically shouldn't be needed)
- Tool/Object Tabs
- Styling Objects

- Keyboard Shortcuts
  - Shift is back of sphere
  - Hold down number 1-9 to select that number object fom selected objects (Previously selected objects don't appear on the selected objects list)
  - Command M (and PC equivalent is...) switches to the move tool

Tool & Objects Panel Tabs

- Tool list
  [User Tools](./tools.md)
- Object List
  - Points
  - Line Segments
  - Lines
  - Circles
  - Conics
  - Measurements
  - Calculations <- Explain

Style Panel Tabs

- Basic (i.e. information displayed by the label)

  - Name( Auto Generated but user overridable not unique usually short, like “P1”, “L4”, “C2” or “H1”, user might enter a LaTeX string))
  - Showing/Hidden
  - Definition text for parent (Free = value, intersection(C1,C2), Midpoint(A,B), N-Sect(5,j,3), Segment(j),Circle(P1,P2)…)
  - Caption (always user generated, usually longer, like “The centroid”, might be a LaTeX string)
  - Showing Options (Name, Caption, Value, Name & Value, Caption & Value)
  - Trace (Applies to points, lines and circles only)

- Front Style

  - Fill Color (Point, Circle, Ellipse, and Polygon only)
  - Stroke Color
  - Opacity
  - Stroke Width

- Back Style

  - Fill Color (Point, Circle, Ellipse, and Polygon only)
  - Stroke Color
  - Opacity
  - Stroke Width

- Advanced
  - Script a user written script that controls some aspect (color, showing, location?) of the object
  - Percent showing (Line Segments, Circles, Ellipses, Parametric -- creates a new kind of point at the endpoint)

Tools

Edit Tools

- Selection Default
- Selection Region
- Delete
- Copy Visual Style

Display Tools

- Show/Hide Object
- Show/Hide Label
- Move
- Rotation

Basic Tools

- Point
- Line
- Segment
- Circle
- Polygon
- Text

Construction Tools

- Midpoint
- Angle Bisector
- Perpendicular Bisector
- Antipodal Point
- Polar Points
- Tangent
- Perpendicular

Measurement Tools

- Length
- Distance
- Angle
- Slider (Adds a slider to the measurement list)
- Triangle (Measures all six quantities of a triangle plus area)
- Polygon (measures all the angles and lengths and area of polygon)

Conic Tools

- Ellipse
- Parabola
- Hyperbola

Advanced Tools

- N-Sect Segment
- N-Sect Angle
- Three Point Circle
- Conic through 5 points (Is this unique? exist?)
- Parametric Curve (User defined)

Transformation Tools

- Create Reflection
- Create Rotation
- Create Translation
- Create Inversion
- Create Reflection over point
- Apply Mapping (Takes a created mapping and applies that mapping to the selected objects)

Measured Object Tools

- Line Segment of measured length
- Line at measured angle to another line at a point on that line
- Circle of measured radius
- Measured Rotation

Holonomy???

Plottables

- Mapping Point
- Mapping Line
- Mapping Segment
- Mapping Circle
- Mapping Ellipse
- Mapping Parametric
- Circle endpoint
- Segment endpoint
