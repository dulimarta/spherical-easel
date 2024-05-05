//import { defineConfig } from 'vitepress'
//import markdownItAnchor from 'markdown-it-anchor'
//import markdownItFoo from 'markdown-it-foo'
// const link = require("link","@vuepress/utils");
// const { convertTypeAcquisitionFromJson } = require("typescript");
// const projectRoot = process.cwd();
// const alias = link.resolve(projectRoot, 'src');

export default {
  lang: "en-US",
  text: "Spherical Easel",
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
    i18nRouting: true,
    logo: "/SphericalEaselLogo.png",
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
        "@maginapp/vitepress-plugin-katex",
        {
          delimiters: "dollars"
        }
      ],
    ],
    config: md => {
      md.use(require("markdown-it-container"), "card", {
        validate: function(params) {
          return params.trim().match(/^card\s+(.*)$/);
        },

        render: function(tokens, idx) {
          var m = tokens[idx].info.trim().match(/^card\s+(.*)$/);

          if (tokens[idx].nesting === 1) {
            // opening tag
            return (
              "<card><summary>" + md.utils.escapeHtml(m[1]) + "</summary>\n"
            );
          } else {
            // closing tag
            return "</card>\n";
          }
        }
      });
    }
  }
}

    //   //   display the header in the sidebar from *all* pages not just the active one
    //   displayAllHeaders: true
//     ]

//   },

// }

  //Specify the output directory for vuepress build. If a relative link is specified, it will be resolved based on process.cwd().
  // dest: "dist/docs",
  // The following setting for "base" works on hosts which allow us to publish
  // on root directory (like Vercel, Netlify).
  // On hosts which require project name (like GitHub or GitLab) set the "base" to the link
  // below the root.
  //base: "/docs/", // For deployment on Netlify
  // base: "/sphericalgeometryvue/docs/", // For deployment on GitLab
  // To use the http://tikzjax.com/ these must be included in the header.
  // head: [
  //   [
  //     "link",
  //     {
  //       rel: "stylesheet",
  //       type: "text/css",
  //       href: "https://tikzjax.com/v1/fonts.css"
  //     }
  //   ],
    // Notice that this JS file and two others are in the /public directory.
    // ef253ef29e2f057334f77ead7f06ed8f22607d38.wasm and 7620f557a41f2bf40820e76ba1fd4d89a484859d.gz
    // The link below couldn't be the link to the file at http://tikzjax.com/ because of a
    // CORS (cross origin request sharing) issue, so we moved this file and the two it
    // references to the local directory.
  //   ["script", { src: "/tikzjax.js" }]
  // ],

  // This section is needed so that the plugin containers work (i.e. the :::tool-text etc in the markdown)
  // markdown: {
    // extendMarkdown: md => {
    //   // use more markdown-it plugins!
    //   md.use(require("markdown-it-texmath"));
    // },
    // extendMarkdown: md => {
    //   md.use(require("markdown-it-vuepress-code-snippet-enhanced"));
    // }
  // },
  //Plugins to enable specialized behavior (for example, LaTeX/MathJax )
  // plugins: [
    // [
    //   "@maginapp/vuepress-plugin-katex",
    //   {
    //     delimiters: "dollars"
    //   }
    // ],
    // Checks for dead links in md files usage: vuepress check-md [docsDir]
    // [`check-md`],
    // [
    //   "vuepress-plugin-mathjax",
    //   {
    //     target: "svg",
    //     macros: {
    //       "*": "\\times"
    //     }
    //   }
    // ],
    //Adds the arrow that returns the user to the top of long pages
    // ["@vuepress/back-to-top"],

    // display the text and icons of the tools
    // [
    //   "vuepress-plugin-container",
    //   {
    //     type: "tool-text",
    //     before: info => "",
    //     after: "",
    //     defaulttext: ""
    //   }
    // ],

    //display the short description of the tool
    // [
    //   "vuepress-plugin-container",
    //   {
    //     type: "tool-description",
    //     before: info =>
    //       `<div class="tool-description"><p class="tool-description-text">${info}</p>`,
    //     after: "</div>",
    //     defaulttext: {
    //       "/": "Description:",
    //       "/id/": "IDDescription:"
    //     }
    //   }
    // ],

    // Display the details of the tool
    // [
    //   "vuepress-plugin-container",
    //   {
    //     type: "tool-details",
    //     before: info =>
    //       `<div class="tool-details"><p class="tool-details-text">${info}</p>`,
    //     after: "</div>",
    //     defaulttext: {
    //       "/": "Details:",
    //       "/id/": "IDDetails:"
    //     }
    //   }
    // ],

    // Uncomment this script container and use
    //
    // ::: script
    // :::
    //
    // in a markdown-it file to get the <script> tag and TikZ drawing into the markdown.
    // Be sure to refresh/reload the page twice!
    // [
    //   "vuepress-plugin-container",
    //   {
    //     type: "script",
    //     before: info => `<script type="text/tikz">
    //   \\begin{tikzpicture}
    //     \\draw (0,0) circle (1in);
    //   \\end{tikzpicture}`,
    //     after: "</script>",
    //     defaulttext: ""
    //   }
    // ],
    // [
    //  '@vuepress/register-components',
    //   {
    //     components: [
    //       {
    //         name: 'IconBase',
    //         link: '/src/components/IconBase.vue'
    //       }
    //     ]
    //   }
    // ],
    // [
    //   '@vuepress/register-components',
    //    {
    //      components: [
    //        {
    //          name: 'pc-vs-mac-shortcuts',
    //          link: 'pc-vs-mac-shortcuts.vue'
    //        }
    //      ]
    //    }
    //  ],
    // ["vuepress-plugin-typescript", {
    //   tsLoaderOptions: {
    //     transpileOnly: true,
    //     compilerOptions: {
    //       target: "ES2019"
    //     }
    //   }
    // }]
    // [
    //   // This plug in is not used unless we use a custom theme
    //   //  see https://vuepress.vuejs.org/plugin/official/plugin-last-updated.html
    //   //   then access it with {{$page.lastUpdated}}
    //   ("@vuepress/last-updated",
    //   {
    //     transformer: (timestamp, lang) => {
    //       // Don't forget to install moment yourself
    //       // See https://momentjs.com/docs/#/use-it/typescript/
    //       const moment = require("moment");
    //       moment.locale(lang);
    //       //moment().format("dddd, MMMM Do YYYY, h:mm a");
    //       return moment(timestamp)
    //         .fromNow()
    //         .format("dddd, MMMM Do YYYY, h:mm a");
    //     }
    //   })
    // ]
  // ],
  //Settings to enable languages/locales
  // locales: {
  //   // The key is the link for the locale to be nested under.
  //   // As a special case, the default locale can use '/' as its link.
  //   "/": {
  //     lang: "en-US", // this will be set as the lang attribute on <html>
  //     text: "Spherical Easel",
  //     description:
  //       "Explore Spherical Geometry: A user guide and design guide for Spherical Easel"
  //   },
  //   "/languages/id/": {
  //     lang: "id",
  //     text: "ID:Spherical Easel",
  //     description:
  //       "ID:Explore Spherical Geometry: A user guide and design guide for Spherical Easel"
  //   }
  // },
  //Setting for the theme -- each locale gets it own theme
  // themeConfig: {
  //   editLink: {
  //     pattern: 'https://github.com/dulimarta/spherical-easel/tree/main/docs/:link'
  //   },
  //   i18nRouting: true,
  //   //All locales use this logo, appears in the upper left on each page
  //   logo: "/SphericalEaselLogo.png",


  //   //enable smooth scrolling so keyboard scrolling won't jump
  //   smoothScroll: true,

  //   // Settings to enable the user to edit this pages in GitLab
  //   // full GitLab url. TODO: This doesn't work the link in the nav doesn't show
  //   //repo: "https://gitlab.com/hans.dulimarta/sphericalgeometryvue/",
  //   //repo: 'https://github.com/dulimarta/spherical-easel', //assumes github see https://vuepress.vuejs.org/theme/default-theme-config.html#git-repository-and-edit-links
  //   repo: '/dulimarta/spherical-easel',
  //   // Customizing the header label
  //   // Defaults to "GitHub"/"GitLab"/"Bitbucket" depending on `themeConfig.repo`
  //   repoLabel: "Contribute!",
  //   // if your docs are in a different repo from your main project:
  //   docsRepo: '/dulimarta/spherical-easel',
  //   // if your docs are not at the root of the repo:
  //   docsDir: '/docs',
  //   // if your docs are in a specific branch (defaults to 'master'):
  //   docsBranch: 'main',
  //   // Invite user to edit these pages via GitLab(?), defaults to false, set to true to enable


  //   locales: {
  //     //The US-English theme
  //     "/": {
  //       //Added to each page so user will know when last updates, uses the timestamp of
  //       // git, master branch does not use the plug in
  //       lastUpdated: "Last Updated",
  //       // text for the language dropdown
  //       selectText: "Languages",
  //       // label for this locale in the language dropdown
  //       label: "English",
  //       // Aria Label for locale in the dropdown (this is an assistive technology item)
  //       ariaLabel: "Languages",

  //       //Enable searching on the the documentation using the third party aloglia https://www.algolia.com/
  //       //   algolia docsearch options for current locale THIS NEEDS TO BE CONFIGURED TO WORK
  //       //   algolia: {
  //       //     apiKey: "<API_KEY>",
  //       //     indexName: "<INDEX_NAME>"
  //       //   },
  //       searchPlaceholder: "Search...",
  //       search: true,
  //       searchMaxSuggestions: 10,

  //       //Settings for the navigation bar at the top of each page
      //   nav: [
      //     //{
      //     // text: "Navingation",
      //     // ariaLabel: "Navigation Menu",
      //     // items: [
      //     { text: "Home", link: "/" },
      //     //{ text: "About", link: "/about.md" },
      //     //{ text: "Contact", link: "/contact.md" },
      //     //   ]
      //     // },
      //     {
      //       text: "Documentation",
      //       ariaLabel: "Documentation Menu",
      //       items: [
      //         { text: "Quick Start Guide", link: "/quickstart/" },
      //         { text: "User Manual", link: "/userguide/" },
      //         { text: "Tools Documents", link: "/tools/edit" },
      //         { text: "Design Documents", link: "/design/" },
      //         { text: "Lesson Plans", link: "/lessonplans/" }
      //       ]
      //     }
      //     //{ text: "External", link: "https://google.com" },
      //   ],

      //   //Settings for the sidebar, this is done in groups so that
      //   // quick start, user guide, and design documents each have their own sidebar
      //   sidebar: {
      //     //The  Tools Documentation sidebar file list
      //     "/tools/": [
      //       "/tools/edit",
      //       "/tools/display",
      //       "/tools/basic",
      //       "/tools/construction",
      //       "/tools/measurement",
      //       "/tools/conic",
      //       "/tools/advanced",
      //       "/tools/transformation",
      //       "/tools/measuredobject",
      //       "/tools/"
      //     ],
      //     //   The root Or default sidebar (matches all directories so must be listed last)
      //     "/": [
      //       {
      //         text: "Quick Start Guide",
      //         //link: "/quickstart/",
      //         //collapsed: false,
      //         sidebarDepth: 0, // optional, defaults to 1
      //         items: [
      //           {
      //             text: "Explore Equilateral Triangles",
      //             link: "/quickstart/"
      //           },
      //           { text: "Construct", link: "/quickstart/construct" },
      //           { text: "Style", link: "/quickstart/explorestyle" },
      //           { text: "Measure", link: "/quickstart/measure" },
      //           { text: "Script", link: "/quickstart/script" }
      //         ]
      //       },
      //       {
      //         //The User Guide sidebar file list
      //         text: "User Manual",
      //         //link: "/userguide/",
      //         //collapsed: false,
      //         sidebarDepth: 1, // optional, defaults to 1
      //         items: [
      //           { text: "Manual Overview", link: "/userguide/" },
      //           { text: "text Bar", link: "/userguide/textbar" },
      //           { text: "Sphere Canvas", link: "/userguide/spherecanvas" },
      //           {
      //             text: "Tools And Objects Panel",
      //             link: "/userguide/toolsobjectspanel"
      //           },
      //           { text: "Style Panel", link: "/userguide/stylepanel" }
      //         ]
      //       },
      //       {
      //         //The  Tools Documentation sidebar file list
      //         text: "Tool Documents",
      //         //link: "/tools/",
      //         //collapsed: false,
      //         sidebarDepth: 0, // optional, defaults to 1
      //         items: [
      //           "/tools/edit",
      //           "/tools/display",
      //           "/tools/basic",
      //           "/tools/construction",
      //           "/tools/measurement",
      //           "/tools/conic",
      //           "/tools/advanced",
      //           "/tools/transformation",
      //           "/tools/measuredobject",
      //           "/tools/"
      //         ]
      //       },
      //       {
      //         //The Design Documentation sidebar file list
      //         text: "Design Documents",
      //         //link: "/design/",
      //         //collapsed: false,
      //         sidebarDepth: 1, // optional, defaults to 1
      //         items: ["/design/", "/design/addingatooloutline"]
      //       },
      //       {
      //         //The lesson plans sidebar file list
      //         text: "Lesson Plans",
      //         //link: "/design/",
      //         //collapsed: false,
      //         sidebarDepth: 1, // optional, defaults to 1
      //         items: [{ text: "Introduction", link: "/lessonplans/" }]
      //       },
      //       {
      //         // The "fallback" side bar file list -- This is the root sidebar
      //         text: "More Information",
      //         //link: "/about",
      //         collapsed: false,
      //         //sidebarDepth: 1,
      //         items: [
      //           "" /* / */,
      //           "about" /* /about.html */,
      //           "contact" /* /contact.html */
      //         ]
      //       }
      //     ],

      //     //   display the header in the sidebar from *all* pages not just the active one
      //     displayAllHeaders: true
      //   }
      // },
  //     //The Bahasa Indonesian theme (Not complete yet)
  //     "/languages/id/": {
  //       selectText: "ID:Languages",
  //       label: "Bahasa Indonesia",
  //       // Invite user to edit these pages, defaults to false, set to true to enable
  //       editLinks: true,
  //       // text for the edit-on-gitlab link
  //       editLinkText: "ID:Help us by editing this page on GitLab",
  //       serviceWorker: {
  //         updatePopup: {
  //           message: "ID:New content is available.",
  //           buttonText: "ID:Refresh"
  //         }
  //       },
  //       nav: [
  //         { text: "ID:Home", link: "/languages/id/" },
  //         {
  //           text: "ID:Documentation",
  //           ariaLabel: "ID:Documentation Menu",
  //           items: [
  //             {
  //               text: "ID:Quick Start Guide",
  //               link: "/languages/id/quickStartGuide.md"
  //             },
  //             {
  //               text: "ID:Documentation Guide",
  //               link: "/languages/id/userguide/"
  //             },
  //             { text: "ID:Design Document", link: "/languages/id/design/" }
  //           ]
  //         }
  //       ],
  //       algolia: {},
  //       sidebar: {
  //         "/languages/id/": [
  //           /* ... */
  //         ],
  //         "/languages/id/nested/": [
  //           /* ... */
  //         ]
  //       },
  //       search: true,
  //       searchMaxSuggestions: 10
  //     }
  //   }
  // },
  // configureWebpack(config) {
  //   // Enable dev tool to allow debugging of setup issue
  //   config.devtool = false;
  //   config.resolve.alias["@"] - alias;
  // }
// };
