---
sidebar: auto
title: User Manual
lang: en-US
---

![Spherical Easel Logo](../SphericalEaselLogo.gif)

Temp image: A cool centered illustration goes here -- perhaps an animated gif. TODO: Update image

# Spherical Easel User Manual

## Overview

The Spherical Easel window is divide into several regions: Title Bar, Object & Tools Panel, Sphere Canvas, and Style Panel. The Style Panel is hidden initially and can be made visible by clicking on the Style Settings (TODO:AddIconImage) icon in the upper right corner of the Sphere Canvas. The functionality of each region is described below.

TODO: Add picture with all regions labeled

### Top Region: Title Bar

The Title Bar is across the top and includes a Menu icon (TODO:AddIconImage - three horizontal lines hamburger menu icon) on the left end, a Help icon (TODO: AddIconImage) and a global settings icon (TODO:AddIconImage) on the other end.

#### Menu Options

This menu allows you to select among the following options:

- New Easel
- Save
- Load
- Export (SVG, EPS, TikZ)
- Import

To import a file, it must be a text JavaScript file in the format of a list of points and a list of faces like
[this](./importFileExample.md). All points will be normalized to have length one automatically. ??? TODO: Not sure how this might work just guessing right now.

#### Global Settings

### Middle Region: Sphere Canvas

on the sphere outlined with a black boundary circle displayed each of the four corners has an icon to

#### Undo/Redo

This contains the sphere

#### Settings

#### Zooming

- In
- Out
- Pan?
- Full Screen
- Home

#### Move

- Point On Object (Included for completeness - this should happen automatically shouldn't be needed)
- Intersection Point (Included for completeness - this should happen automatically shouldn't be needed)
- Tool/Object Tabs
- Styling Objects

### Keyboard Shortcuts

- Shift is back of sphere
- Hold down number 1-9 to select that number object fom selected objects (Previously selected objects don't appear on the selected objects list)
- Command M (and PC equivalent is...) switches to the move tool

## Left/Bottom Region: Tool & Objects Panel Tabs

### Tool list

[User Tools](./tools.md)

### Object List

- Points
- Segments
- Lines
- Circles
- Conics
- Measurements
- Calculations <- Explain

## Right Region: Style Panel

### Basic Tab (i.e. information displayed by the label)

- Name( Auto Generated but user overridable not unique usually short, like “P1”, “L4”, “C2” or “H1”, user might enter a LaTeX string))
- Showing/Hidden
- Definition text for parent (Free = value, intersection(C1,C2), Midpoint(A,B), N-Sect(5,j,3), Segment(j),Circle(P1,P2)…)
- Caption (always user generated, usually longer, like “The centroid”, might be a LaTeX string)
- Showing Options (Name, Caption, Value, Name & Value, Caption & Value)
- Trace (Applies to points, lines and circles only)

### Front (Style) Tab

- Fill Color (Point, Circle, Ellipse, and Polygon only)
- Stroke Color
- Opacity
- Stroke Width

### Back (Style) Tab

- Fill Color (Point, Circle, Ellipse, and Polygon only)
- Stroke Color
- Opacity
- Stroke Width

### Advanced Tab

- Script a user written script that controls some aspect (color, showing, location?) of the object
- Percent showing (Segments, Circles, Ellipses, Parametric -- creates a new kind of point at the endpoint)
