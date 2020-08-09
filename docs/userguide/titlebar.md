---
title: Title Bar
lang: en-US
---

# Title Bar

The Title Bar is across the top and includes a File System icon (TODO:AddIconImage - three horizontal lines hamburger menu icon) on the left end, a Help icon (TODO: AddIconImage) and a global settings icon (TODO:AddIconImage) on the other end.

## File System Options

This menu allows you to select among the following options:

- New (prompts user to save and then resets the app)
- Save (prompts user to select save location - saves text file? - Save to server?)
- Save As
- Open (Prompts use to find a previously saved easel session)
- Export (prompts user to select among SVG, EPS, TikZ, Animated GIF)
- Import (To import a file, it must be a plain text file (containing JavaScript?) in the format of a list of points and a list of faces like [this](./importfileexample.md). All points will be normalized to have length one automatically. ??? TODO: Not sure how this might work just guessing right now.
- Close (Clear all geometric objects from the Sphere Canvas and close the browser tab)

## Global Settings

Clicking on this icon (TODO: AddIconImage) allows user to

- pick a different language,
- Decide which object types are labeled initially.
- Set the number of displayed decimal places,
- Set the Momentum and Decay feature of the [Rotate Tool](/tools/display.html#rotateion). Checking the Momentum box will allow the rotate tool to continue rotating the current view after the user has stopped actively rotating the sphere. The sphere will continue to rotate and slow depending on a Decay parameter. A Decay value of zero is the same as not allowing Momentum and a Decay value of 1 means the sphere never stops rotating (if left undisturbed).
- Upload a custom background image for the sphere?
- Select the percentage of zoom in/out for each mouse click.
- Register so they can save and load from server, create custom URL that restrict the tools available to the user, create a custom URL to send that displayed a particular arrangement?

## Benefits of Registering

If a user registers they will have the ability to create a URL to a server-side saved construction that can be publicly shared and to create a URL that points to a version of the application where the they can control which tools are available (intended primarily for instructors), and which tools are displayed in the corners of the [Sphere Canvas.](/userguide/spherecanvas.html#default-tools-in-the-corners)

## Help

Opens these help pages **in another tab**
