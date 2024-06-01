export default {
  lang: "en-US",
  title: "Spherical Easel",
  description:
        "Explore Spherical Geometry: A user guide and design guide for Spherical Easel",

  //The srcDir is used so that the VitePress site will be built relative to this directory
  srcDir: './src',
  markdown: {
    // After installing the package via add -D markdown-it-mathjax3, this enables latex in the markdown files
    math: true
  },

  themeConfig: {
    lastUpdated: true,// Displays last updated on each page
    editLink: { //Display a link to edit the page on github
      pattern: 'https://github.com/dulimarta/spherical-easel/tree/main/docs/:link'
    },
    search: {
      provider: 'local'
    },
    i18nRouting: true,
    logo: "/SphericalEaselLogo.gif",
    nav: [
      {
      text: "Navigation",
      ariaLabel: "Navigation Menu",
      items: [
      { text: "Home", link: "/" },
      { text: "About", link: "/about.md" },
      { text: "Contact", link: "/contact.md" },
        ]
      },
      {
        text: "Documentation",
        ariaLabel: "Documentation Menu",
        items: [
          { text: "Quick Start Guide", link: "/quickstart/" },
          { text: "User Manual", link: "/userguide/" },
          { text: "Tools Documents", link: "/tools/edit" },
          { text: "Design Documents", link: "/design/" },
          { text: "Lesson Plans", link: "/lessonplans/" }
        ]
      }
    ],

    footer: {
      message: "License agreements <a href='https://creativecommons.org/licenses/by-nc-sa/4.0/'target='_blank''> CC-BY-NC-SA </a>",
      copyright: 'Copyright © 2002-present David Austin, William Dickinson, Hans Dulimarta, Michelle Dowling, Vinicius Lima'
    },

    //Settings for the sidebar, this is done in groups so that
    // quick start, user guide, and design documents each have their own sidebar
    sidebar: {
      // '/tools/': [
      //   {
      //     text: "Quick Start Guide",
      //     link: "/quickstart/"
      //   },
      //   {
      //     //collapsed: false,
      //     //sidebarDepth: 0,
      //     text: "Tools",
      //     items: [
      //     { text:"Edit", link:"/tools/edit"},
      //     { text:"Display", link:"/tools/display"},
      //     { text:"Basic", link:"/tools/basic"},
      //     { text:"Construction", link:"/tools/construction"},
      //     { text:"Measurement", link:"/tools/measurement"},
      //     { text:"Conic", link:"/tools/conic"},
      //     { text:"Advanced", link:"/tools/advanced"},
      //     { text:"Transformation", link:"/tools/transformation"},
      //     { text:"Measured Object", link:"/tools/measuredobject"},
      //     { text:"Tool Tips", link:"/tools/"}
      //     ]
      //   }
      // ],
      // The root Or default sidebar (matches all directories so must be listed last)
      "/": [
        {
          text: "Quick Start Guide",
          link: "/quickstart/",
          collapsed: false,
          sidebarDepth: 0,
          items: [
            { text: "Equilateral Triangles",link: "/quickstart/"},
            { text: "Construct", link: "/quickstart/construct" },
            { text: "Style", link: "/quickstart/explorestyle" },
            { text: "Measure", link: "/quickstart/measure" },
            { text: "Script", link: "/quickstart/script" }
          ]
        },
        {
          text: "User Manual",
          //link: "/userguide/",
          collapsed: true,
          sidebarDepth: 1,
          items: [
            { text: "Manual Overview", link: "/userguide/" },
            { text: "Title Bar", link: "/userguide/titlebar" },
            { text: "Sphere Canvas", link: "/userguide/spherecanvas" },
            {
              text: "Tools And Objects Panel",
              link: "/userguide/toolsobjectspanel"
            },
            { text: "Style Panel", link: "/userguide/stylepanel" }
          ]
        },
        {
          text: "Tool Documents",
          //link: "/tools/",
          collapsed: true,
          sidebarDepth: 0,
          items: [
            { text:"Edit", link:"/tools/edit"},
            { text:"Display", link:"/tools/display"},
            { text:"Basic", link:"/tools/basic"},
            { text:"Construction", link:"/tools/construction"},
            { text:"Measurement", link:"/tools/measurement"},
            { text:"Conic", link:"/tools/conic"},
            { text:"Advanced", link:"/tools/advanced"},
            { text:"Transformation", link:"/tools/transformation"},
            { text:"Measured Object", link:"/tools/measuredobject"},
            { text:"Tool Tips", link:"/tools/"}
          ]
        },
        {
          text: "Design Documents",
          //link: "/design/",
          collapsed: true,
          sidebarDepth: 0,
          items: [
            {text: "Overview", link: "/design/"},
            {text: "Adding a tool - Outline", link: "/design/addingatooloutline"}
          ]
        },
        {
          text: "Lesson Plans",
          //link: "/lessonplans/",
          collapsed: true,
          sidebarDepth: 0,
          items: [{ text: "Introduction", link: "/lessonplans/" }]
        },
        {
          text: "App Information",
          //link: "/about",
          collapsed: true,
          //sidebarDepth: 1,
          items: [
            {text:"Home", link:"/"},
            {text: "About", link:"about"} ,
            {text: "Contact", link:"contact"}
          ]
        }
      ],
    },
    plugins: [
      [
        "@maginapp/vitepress-plugin-katex", //enable LaTeX on the pages
        {
          delimiters: "dollars"
        }
      ],
    ],
  }
}