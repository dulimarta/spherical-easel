---
home: true
heroImage: /SphericalEaselLogo.png
heroText: Spherical Easel
tagline: An interactive app for exploring spherical geometry
actionText: "Quick Start: Explore Equilateral Triangles →"
actionLink: /quickstart/
features:
  - title: Construct
    details: Easily construct spherical arrangements of points, lines, circles, and conics using tangents, bisections, and more.
  - title: Measure & Calculate
    details: Numerically measure lengths, distances, angles, and areas. Create user defined calculations to explore spherical geometry conjectures.
  - title: Explore & Export
    details: Rotate arrangements, customize the style of display, and then save, load, share, and export your creations to TikZ, SVG, and more.
footer: David Austin, William Dickinson, Hans Dulimarta, Michelle Dowling. License agreements [CC-BY-NC-SA](https://creativecommons.org/licenses/by-nc-sa/4.0/) | Copyright © 2002 - present
prev: false
next: /quickstart/construct
lang: en-US
---

Spherical Easel is an interactive [Vue](https://vuejs.org/) application for exploring spherical geometry. This application allows users to draw, label, and control the behavior of spherical constructions involving [points](/tools/basic#point), [lines](/tools/basic#line), [line segments](/tools/basic#line-segment), [circles](/tools/basic#circle), [conics](/tools/conic), [polygons](/tools/basic#polygon), and custom user defined [parametric curves](/tools/advanced#parametric-curve-user-defined) on the unit sphere. Using construction tools (including [intersections](/tools/construction#intersection), [bisections](/tools/construction#angle-bisector), [tangents](/tools/construction#tangent), [perpendiculars](/tools/construction#perpendicular), and [others](/tools/construction)), measurement tools (including [distance](/tools/measurement#disance), [length](/tools/measurement#length), [angle](/tools/measurement#angle), [polygons](/tools/measurement#polygon) and others), and transformation tools (including [isometries](/tools/transformation) and [inversion](/tools/transformation#create-inversion)) users can create precise geometric arrangements and numerically confirm conjectures in spherical geometry. In addition to being able to customize the look and feel of the displayed objects, registered users have the ability to share, load, save, export their constructions (GIF, PNG, SVG, animated GIFs), import certain hand-created arrangements, and control which tools are available for a saved construction (intended primarily for instructors). Non-registered users can share (i.e. generate a link to a particular construction that is only accessible with that link for 4 months) and export their constructions.
<br></br>
This documentation has two major parts: a [User Manual](/userguide/) explaining many of the features of the application available to the user and a [Design Document](/design/) explaining many of the choices we made while coding this application.
<br></br>

Spherical Easel is written in Typescript. This application is open source and use of it is granted under the creative commons license agreements [CC-BY-NC-SA](https://creativecommons.org/licenses/by-nc-sa/4.0/). We welcome your help in making this application better and more universally accessible.
<br></br>

You can help by....

- Helping to translate this program into another language.
- Consulting on how to make this program more accessible to people with low vision.
- Reporting a bug.
- Requesting an enhancement or feature.
- Adding a lesson plan to our [repository](/lessonplans/) to help students learn about spherical geometry.
- Updating these help pages with correction, rewrites or more description. (Most pages in this documentation have a link at the bottom to allow you to suggest a edit to a particular page.)
  <br></br>

If you would like to help in any way or ask us a question please use our [GitHub repository](https://github.com/dulimarta/spherical-easel/issues/new) for reporting an issue and let us know how you would like to help.
<br></br>

We hope you enjoy our app! <br></br>

David, Will, Hans, and Michelle
