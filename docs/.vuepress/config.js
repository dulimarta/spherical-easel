module.exports = {
  //Specify the output directory for vuepress build. If a relative path is specified, it will be resolved based on process.cwd().
  dest: "dist/docs",
  // The following setting for "base" works on hosts which allow us to publish
  // on root directory (like Vercel, Netlify).
  // On hosts which require project name (like GitHub or GitLab) set the "base" to the path
  // below the root.
  base: "/docs/", // For deployment on Netlify
  // base: "/sphericalgeometryvue/docs/", // For deployment on GitLab
  // To use the http://tikzjax.com/ these must be included in the header.
  head: [
    [
      "link",
      {
        rel: "stylesheet",
        type: "text/css",
        href: "https://tikzjax.com/v1/fonts.css"
      }
    ],
    // Notice that this JS file and two others are in the /public directory.
    // ef253ef29e2f057334f77ead7f06ed8f22607d38.wasm and 7620f557a41f2bf40820e76ba1fd4d89a484859d.gz
    // The link below couldn't be the link to the file at http://tikzjax.com/ because of a
    // CORS (cross origin request sharing) issue, so we moved this file and the two it
    // references to the local directory.
    ["script", { src: "/tikzjax.js" }]
  ],
  // This section is needed so that the plugin containers work (i.e. the :::tool-title etc in the markdown)
  markdown: {
    extendMarkdown: md => {
      // use more markdown-it plugins!
      md.use(require("markdown-it-texmath"));
    },
    extendMarkdown: md => {
      md.use(require("markdown-it-vuepress-code-snippet-enhanced"));
    }
  },
  //Plugins to enable specialized behavior (for example, LaTeX/MathJax )
  plugins: [
    [
      "@maginapp/vuepress-plugin-katex",
      {
        delimiters: "dollars"
      }
    ],
    // Checks for dead links in md files usage: vuepress check-md [docsDir]
    [`check-md`],
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
    ["@vuepress/back-to-top"],

    // display the title and icons of the tools
    [
      "vuepress-plugin-container",
      {
        type: "tool-title",
        before: info => "",
        after: "",
        defaultTitle: ""
      }
    ],

    //display the short description of the tool
    [
      "vuepress-plugin-container",
      {
        type: "tool-description",
        before: info =>
          `<div class="tool-description"><p class="tool-description-title">${info}</p>`,
        after: "</div>",
        defaultTitle: {
          "/": "Description:",
          "/id/": "IDDescription:"
        }
      }
    ],

    // Display the details of the tool
    [
      "vuepress-plugin-container",
      {
        type: "tool-details",
        before: info =>
          `<div class="tool-details"><p class="tool-details-title">${info}</p>`,
        after: "</div>",
        defaultTitle: {
          "/": "Details:",
          "/id/": "IDDetails:"
        }
      }
    ],

    // Uncomment this script container and use
    //
    // ::: script
    // :::
    //
    // in a markdown-it file to get the <script> tag and TikZ drawing into the markdown.
    // Be sure to refresh/reload the page twice!
    [
      "vuepress-plugin-container",
      {
        type: "script",
        before: info => `<script type="text/tikz">
      \\begin{tikzpicture}
        \\draw (0,0) circle (1in);
      \\end{tikzpicture}`,
        after: "</script>",
        defaultTitle: ""
      }
    ]
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
  ],
  //Settings to enable languages/locales
  locales: {
    // The key is the path for the locale to be nested under.
    // As a special case, the default locale can use '/' as its path.
    "/": {
      lang: "en-US", // this will be set as the lang attribute on <html>
      title: "Spherical Easel",
      description:
        "Explore Spherical Geometry: A user guide and design guide for Spherical Easel"
    },
    "/languages/id/": {
      lang: "id",
      title: "ID:Spherical Easel",
      description:
        "ID:Explore Spherical Geometry: A user guide and design guide for Spherical Easel"
    }
  },
  //Setting for the theme -- each locale gets it own theme
  themeConfig: {
    //enable smooth scrolling so keyboard scrolling won't jump
    smoothScroll: true,

    //All locales use this logo, appears in the upper left on each page
    logo: "/SphericalEaselLogo.png",

    locales: {
      //The US-English theme
      "/": {
        //Added to each page so user will know when last updates, uses the timestamp of
        // git, master branch does not use the plug in
        lastUpdated: "Last Updated",
        // text for the language dropdown
        selectText: "Languages",
        // label for this locale in the language dropdown
        label: "English",
        // Aria Label for locale in the dropdown (this is an assistive technology item)
        ariaLabel: "Languages",
        // Settings to enable the user to edit this pages in GitLab
        // full GitLab url. TODO: This doesn't work the link in the nav doesn't show
        repo: "https://gitlab.com/hans.dulimarta/sphericalgeometryvue/",
        // Customizing the header label
        // Defaults to "GitHub"/"GitLab"/"Bitbucket" depending on `themeConfig.repo`
        repoLabel: "Contribute!",
        // Invite user to edit these pages via GitLab(?), defaults to false, set to true to enable
        // TODO: This doesn't enable the "edit me" links on each page
        editLinks: true,
        // text for the edit-on-gitlab link
        editLinkText: "Help us by editing this page on GitLab",
        //Enable searching on the the documentation using the third party aloglia https://www.algolia.com/
        //   algolia docsearch options for current locale THIS NEEDS TO BE CONFIGURED TO WORK
        //   algolia: {
        //     apiKey: "<API_KEY>",
        //     indexName: "<INDEX_NAME>"
        //   },
        searchPlaceholder: "Search...",
        search: true,
        searchMaxSuggestions: 10,

        //Settings for the navigation bar at the top of each page
        nav: [
          //{
          // text: "Navingation",
          // ariaLabel: "Navigation Menu",
          // items: [
          { text: "Home", link: "/" },
          //{ text: "About", link: "/about.md" },
          //{ text: "Contact", link: "/contact.md" },
          //   ]
          // },
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
          //{ text: "External", link: "https://google.com" },
        ],

        //Settings for the sidebar, this is done in groups so that
        // quick start, user guide, and design documents each have their own sidebar
        sidebar: {
          //The  Tools Documentation sidebar file list
          "/tools/": [
            "/tools/edit",
            "/tools/display",
            "/tools/basic",
            "/tools/construction",
            "/tools/measurement",
            "/tools/conic",
            "/tools/advanced",
            "/tools/transformation",
            "/tools/measuredobject",
            "/tools/"
          ],
          //   The root Or default sidebar (matches all directories so must be listed last)
          "/": [
            {
              title: "Quick Start Guide", // required
              //path: "/quickstart/", // optional, link of the title, which should be an absolute path and must exist
              //collapsable: false, // optional, defaults to true
              sidebarDepth: 0, // optional, defaults to 1
              children: [
                {
                  title: "Explore Equilateral Triangles",
                  path: "/quickstart/"
                },
                { title: "Construct", path: "/quickstart/construct" },
                { title: "Style", path: "/quickstart/explorestyle" },
                { title: "Measure", path: "/quickstart/measure" },
                { title: "Script", path: "/quickstart/script" }
              ]
            },
            {
              //The User Guide sidebar file list
              title: "User Manual", // required
              //path: "/userguide/", // optional, link of the title, which should be an absolute path and must exist
              //collapsable: false, // optional, defaults to true
              sidebarDepth: 1, // optional, defaults to 1
              children: [
                { title: "Manual Overview", path: "/userguide/" },
                { title: "Title Bar", path: "/userguide/titlebar" },
                { title: "Sphere Canvas", path: "/userguide/spherecanvas" },
                {
                  title: "Tools And Objects Panel",
                  path: "/userguide/toolsobjectspanel"
                },
                { title: "Style Panel", path: "/userguide/stylepanel" }
              ]
            },
            {
              //The  Tools Documentation sidebar file list
              title: "Tool Documents", // required
              //path: "/tools/", // optional, link of the title, which should be an absolute path and must exist
              //collapsable: false, // optional, defaults to true
              sidebarDepth: 0, // optional, defaults to 1
              children: [
                "/tools/edit",
                "/tools/display",
                "/tools/basic",
                "/tools/construction",
                "/tools/measurement",
                "/tools/conic",
                "/tools/advanced",
                "/tools/transformation",
                "/tools/measuredobject",
                "/tools/"
              ]
            },
            {
              //The Design Documentation sidebar file list
              title: "Design Documents", // required
              //path: "/design/", // optional, link of the title, which should be an absolute path and must exist
              //collapsable: false, // optional, defaults to true
              sidebarDepth: 1, // optional, defaults to 1
              children: ["/design/", "/design/addingatooloutline"]
            },
            {
              //The lesson plans sidebar file list
              title: "Lesson Plans", // required
              //path: "/design/", // optional, link of the title, which should be an absolute path and must exist
              //collapsable: false, // optional, defaults to true
              sidebarDepth: 1, // optional, defaults to 1
              children: [{ title: "Introduction", path: "/lessonplans/" }]
            },
            {
              // The "fallback" side bar file list -- This is the root sidebar
              title: "More Information", // required
              //path: "/about", // optional, link of the title, which should be an absolute path and must exist
              collapsable: false, // optional, defaults to true
              //sidebarDepth: 1, // optional, defaults to 1
              children: [
                "" /* / */,
                "about" /* /about.html */,
                "contact" /* /contact.html */
              ]
            }
          ],

          //   display the header in the sidebar from *all* pages not just the active one
          displayAllHeaders: true
        }
      },
      //The Bahasa Indonesian theme (Not complete yet)
      "/languages/id/": {
        selectText: "ID:Languages",
        label: "Bahasa Indonesia",
        // Invite user to edit these pages, defaults to false, set to true to enable
        editLinks: true,
        // text for the edit-on-gitlab link
        editLinkText: "ID:Help us by editing this page on GitLab",
        serviceWorker: {
          updatePopup: {
            message: "ID:New content is available.",
            buttonText: "ID:Refresh"
          }
        },
        nav: [
          { text: "ID:Home", link: "/languages/id/" },
          {
            text: "ID:Documentation",
            ariaLabel: "ID:Documentation Menu",
            items: [
              {
                text: "ID:Quick Start Guide",
                link: "/languages/id/quickStartGuide.md"
              },
              {
                text: "ID:Documentation Guide",
                link: "/languages/id/userguide/"
              },
              { text: "ID:Design Document", link: "/languages/id/design/" }
            ]
          }
        ],
        algolia: {},
        sidebar: {
          "/languages/id/": [
            /* ... */
          ],
          "/languages/id/nested/": [
            /* ... */
          ]
        },
        search: true,
        searchMaxSuggestions: 10
      }
    }
  }
};
