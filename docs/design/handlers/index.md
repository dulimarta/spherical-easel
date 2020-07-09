---
title: Handler Design Overview
lang: en-US
prev: /design/
---

# Event Handler Overview

The handlers decide how to handle user mouse and keyboard input to implement a particular tool. All handlers implement the interface <span class="interface">ToolStrategy</span>

<<< @/src/eventHandlers/ToolStrategy.ts#toolStrategy{2-7}

The <span class="method">activate()</span> and <span class="method">deactivate()</span> methods are run at the eponymous times during the life cycle of the tool. The <span class="method">activate()</span> method processes all the [selected objects](/tools/edit.html#selection) and decides whether or not to execute the appropriate tool routines. The <span class="method">deactivate()</span> method clears the appropriate variable in the tool so that they don't interfere with the execution of other tools.

Almost all handlers extend <span class="class">MouseHandler</span> (the exception is <span class="class">PanZoomHandler</span>). This means that almost all handlers have access to the following variables that are computed in the <span class="method">mouseMoved()</span> method.

- <span class="variable">currentSphereVector</span>: This the <span class="class">Vector3</span> location on the ideal unit sphere corresponding to the current mouse location.
- <span class="variable">previousSphereVector</span>: This the <span class="class">Vector3</span> location on the ideal unit sphere of corresponding to the previous mouse location.
- <span class="variable">currentScreenVector</span>: This the <span class="class">Two.Vector</span> location in the Default Screen Plane of the current mouse location.
- <span class="variable">previousScreenVector</span>: This the <span class="class">Two.Vector</span> location in the Default Screen Plane of the previous mouse location.
- <span class="variable">isOnSphere</span>: This boolean variable indicates if the current mouse location is inside the boundary circle in the Default Screen Plane

In addition, the <span class="method">mouseMoved()</span> method queries the Vuex Store to find and highlight all the nearby objects. The variable <span class="variable">hitNodules</span> is an array of nearby SEObjects that is sorted into the different class like <span class="variable">hitPoints</span>, <span class="variable">hitSegments</span>, <span class="variable">hitLines</span>, etc.

<<< @/src/eventHandlers/MouseHandler.ts
