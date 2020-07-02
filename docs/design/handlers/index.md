---
title: Handler Design Overview
lang: en-US
prev: /design/
---

# Handler Overview

The handlers decide how to handle user mouse and keyboard input to implement a particular tool. All handlers implement the interface <span class="interface">ToolStrategy</span>

<<< @/src/eventHandlers/ToolStrategy.ts#toolStrategy{2-7}

The <span class="method">activate()</span> and <span class="method">deactivate()</span> methods are run at the eponymous times during the life cycle of the tool. The <span class="method">activate()</span> method processes all the [selected objects](/tools/edit.html#selection) and decides whether or not to execute the appropriate tool routines. The <span class="method">deactivate()</span> method clears the appropriate variable in the tool so that they don't interfere with the execution of other tools.

Almost all handlers extend <span class="class">MouseHandler</span> (the exception is <span class="class">PanZoomHandler</span>). This means that almost all handlers have access to the following variables that are computed in the <span class="method">mouseMoved()</span> method.

- <span class="variable">currentSpherePoint</span> This the location on the sphere of default radius corresponding to mouse location.
- <span class="variable">currentScreenPoint</span> This the location of the
- <span class="variable">isOnSphere</span>

<<< @/src/eventHandlers/MouseHandler.ts
