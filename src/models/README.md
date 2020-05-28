# Design

Some files under this directory may have a unique association with files in the `plotables` directory.
For instance, `SEPoint` in this directory is associated with `plotables/Point`.

- Classes under this directory should be independent of the graphical library chosen for rendering the visual appearance of the geometric objects.
- Classes under the `plotables` directory should be mainly be responsible for rendering the visual appearance (color, line style, shading, etc.) on the canvas.

The files in this subdirectory manage the fixed (abstract) unit sphere data structure. Each class should contain a reference (called ref) to the cooresponding graphical (Two.js) object that lives in the plotables subdirectory. There should be uses (methods/functions or variables) that use the rendering/graphical tools (i.e. TwoJS currently) except ref the pointer to the rendering class.
