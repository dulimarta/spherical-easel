//const moment = require("moment");

module.exports = {
  // Settings to enable the user to edit this pages in GitLab
  // full GitLab url.
  repo: "/gitlab.com/hans.dulimarta/sphericalgeometryvue",
  // Customizing the header label
  // Defaults to "GitHub"/"GitLab"/"Bitbucket" depending on `themeConfig.repo`
  //repoLabel: "Contribute!",

  //Plugins to enable specialized behavior (for example, LaTeX/MathJax )
  plugins: [
    [
      "vuepress-plugin-mathjax",
      {
        target: "svg",
        macros: {
          "*": "\\times"
        }
      }
    ]
    // [
    //   "@vuepress/last-updated",
    //   {
    //     dateOptions: {
    //       hours12: false
    //     }
    //   }
    //   {
    //     transformer: (timestamp, lang) => {
    //       // Don't forget to install moment yourself
    //       const moment = require("moment");
    //       moment.locale(lang);
    //       return moment(timestamp).fromNow();
    //     }
    //   }
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
      lang: "id-ID",
      title: "ID:Spherical Easel",
      description:
        "ID:Explore Spherical Geometry: A user guide and design guide for Spherical Easel"
    }
  },
  //Settting for the theme -- each locale gets it own theme
  themeConfig: {
    //All locales use this logo, appears in the upper left on each page
    logo: "/SphericalEaselLogo.png",
    locales: {
      //The US-English theme
      "/": {
        //Added to pages so user will know when last updates, uses the timestamp of git, master branch
        lastUpdated: "Last Update",
        // text for the language dropdown
        selectText: "Languages",
        // label for this locale in the language dropdown
        label: "English",
        // Aria Label for locale in the dropdown (this is an assistive technology item)
        ariaLabel: "Languages",
        // Invite user to edit these pages via GitLab(?), defaults to false, set to true to enable
        editLinks: true,
        // text for the edit-on-gitlab link
        editLinkText: "Help us by editing this page on GitLab",
        // config for Service Worker, I don't know what these do? TODO: answer
        serviceWorker: {
          updatePopup: {
            message: "New content is available.",
            buttonText: "Refresh"
          }
        },
        //Enable searching on the the documentation using the third party aloglia https://www.algolia.com/
        //algolia docsearch options for current locale
        algolia: {
          apiKey: "<API_KEY>",
          indexName: "<INDEX_NAME>"
        },
        searchPlaceholder: "Search...",
        search: true,
        searchMaxSuggestions: 10,
        //Settings for the navigation bar at the top of each page
        nav: [
          { text: "Home", link: "/" },
          {
            text: "Documentation",
            ariaLabel: "Documentation Menu",
            items: [
              { text: "Quick Start Guide", link: "/quickstart/" },
              { text: "User Manual", link: "/userguide/" },
              { text: "Design Documents", link: "/design/" }
            ]
          }
          //{ text: "External", link: "https://google.com" },
        ],
        //Settings for the sidebar, this is done in groups so that
        // quick start, user guide, and design documents each have their own sidebar
        sidebar: {
          //The Quick Start Side Bar options, list the files it should put into the sidebar (grabs h2 and h3 headers)
          //TODO: The <br/> character should be a newline! I think this is a bug in the VuePress -- I can't get &nbsp; or any emoji to work in that slot either -- related to https://github.com/vuejs/vuepress/pull/206
          "/quickstart/": [
            ["", "Quick Start Guide<br/>Equilateral Triangles"], //Note the explicit text as the second entry in the array
            "construct.md",
            "explorestyle.md",
            "measure.md",
            "script.md"
          ],
          //The User Guide sidebar file list
          "/userguide/": ["index.md", "tools.md"],
          //The Design Documentation sidebar file list
          "/design": ["index.md"],
          // The "fallback" side bar file list -- I think this is a default so you never get a blank side bar
          "/": [
            "" /* / */,
            "contact" /* /contact.html */,
            "about" /* /about.html */
          ]
        },
        displayAllHeaders: true
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
