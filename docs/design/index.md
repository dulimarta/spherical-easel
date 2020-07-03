---
title: Design Document
next: /design/handlers/
prev: /tools/edit.md
mathjax:
  presets: '\def\lr#1#2#3{\left#1#2\right#3}'
---

# Spherical Easel Design Document

## Overview

- Code patterns
- Components
- Zoom Port
- Global Settings

## Coordinates CSS Transform Trick

The sphere is rendered at

<TikzPicture latex="myfile.tex"></TikzPicture>

<<< @/src/global-settings.ts#boundarycircle

<div v-html="circle"></div>
<!-- <div v-html="move_circle"></div>
<div v-html="test1"></div> -->
<!-- <div v-html="test2"></div> -->

<script>
export default {
    data () {
        const tex = {
            "circle": String.raw`
            \usetikzlibrary{shapes,through,intersections,calc}
            \usetikzlibrary{through}
            \begin{tikzpicture}  
            \draw[fill,red] (0,0) circle (1in);
            \end{tikzpicture}`,

            "test1": String.raw`
            \begin{tikzpicture}[sibling distance=80pt,box/.style={rectangle,draw}] 
            \node[box] {TeX}
            child {node[box] {Plain\TeX}} child {node[box] {\LaTeX}
             child {node[box] {amsmath}} child {node[box] {graphicx}} child {node[box] {hyperref}}
            }; \end{tikzpicture}`, 

            "test2":String.raw`
            \usetikzlibrary{intersections}
            \begin{tikzpicture}[scale=3]
                \clip (-0.1,-0.2) rectangle (1.1,1.51);
                \draw[step=.5cm,gray,very thin] (-1.4,-1.4) grid (1.4,1.4);
                \draw[->] (-1.5,0) -- (1.5,0);
                \draw[->] (0,-1.5) -- (0,1.5);
                \draw (0,0) circle [radius=1cm];
                \filldraw[fill=green!20,draw=green!50!black] (0,0) -- (3mm,0mm) arc [start angle=0, end angle=30, radius=3mm] -- cycle;
                \draw[red,very thick] (30:1cm) -- +(0,-0.5);
                \draw[blue,very thick] (30:1cm) ++(0,-0.5) -- (0,0);
                \path [name path=line1] (1,0) -- (1,1);
                \path [name path=line2] (0,0) -- (30:1.5cm);
                \draw [name intersections={of=line1 and line2, by=x}] [very thick,orange]{(1,0) -- (x)};
            \end{tikzpicture}
            `,

            "move_circle": String.raw`
            \usetikzlibrary{shapes,through,intersections,calc}
            \begin{tikzpicture}
                \coordinate (P) at (0,0);
                \coordinate (Q) at (-20:15mm);
                \draw[blue] (P) circle (15mm);
                \draw[fill] (P) circle (2pt);
                \draw[fill] (Q) circle (2pt);
                \node at (P) [left]{$C$};
                \node at (Q) [right]{$O$};
                \begin{scope}[xshift=32mm, yshift=18mm]
                    \coordinate (P1) at (0,0);
                    \coordinate (Q1) at (-20:15mm);
                    \node at (P1) [above]{$C'$};
                    \node at (Q1) [right]{$O'$};
                    \draw[fill] (P1) circle (2pt);
                    \draw[fill] (Q1) circle (2pt);
                    \node(c) at (P1) [draw,red,circle through=(Q1)] {};
                    \coordinate(Q2) at (intersection 1 of c and P1--Q);
                    \draw[fill] (Q2) circle (2pt);
                    \node at (Q2) [above,left]{$O_c$};
                \end{scope}
                \draw[dashed] (P1) -- (Q);
            \end{tikzpicture}`
        }
        var translated = {}
        for (const name in tex) {
            translated[name] = String.raw`<script type="text/tikz">` + tex[name] + "<\/script>"

        }
        return translated
    }

}
</script>

<!-- Uncomment out the two lines below and the script container in config.js to draw a circle.
Reload/Refresh the page twice! -->
<!-- ::: script
::: -->

![An image](/SphericalEaselLogo.png)

## User Interface (Vue Components)

## [Event Handlers Details](./handlers/)

## Commands

## Languages

## Models

## Plottables

## Store

## Views

## Vistors

$$
$$

```

```
