---
title: Developer Manual
lang: en-US
---

# Developer Manual

## Install Build Tools 

1. Install NodeJS
2. Install Yarn
3. Install Jest

## Running Development Server

The `scripts` section of `package.json` includes two entries for launching the development servers.

1. `docs:serve` for launching a local VuePress server to view the documentation (your are currently viewing it)
2. `app:serve` for launching a local server to run the Vue web application itself

The default port number to connect to these servers is 8080.
When that port number is not available the server will try the next higher number.
Depending on which one of the two you launched first, one will use port 8080 and the other one will use 8081.
To view the app and the documentation you can then connect to `localhost:8080` and `localhost:8081`.

To mimic the setup when the app is deployed at a non-root path, we use `/dev` as the simulated deployment path.

:::tip
A non-root path is required when you don't have access to the machine web server configuration file and the
host server requires you use your own `public_html` directory associated with your account.
This typical setup applies to most educational institutions where the school website is deployed at `https://your.school.name.edu` and 
faculty/student websites must be deployed at `https://your.school.name.edu/youruserid`.
In this particular case, `youruserid` is the URL deployment path.

:::

## Deployment

Prior to deployment be sure to verify correct settings in the following files:

1. `vue.config.js`: the property `publicPath` must match the URL deployment path as required by the web host you are using.

    | Host    | `publicPath`           |
    |---------|------------------------|
    | Netlify | `/`                    |
    | GitLab  | `sphericalgeometryvue` |

2. `docs/.vuepress/config.js`: the property `base` must match the URL path at which the online documentation will be access. The default setting is to use the `/docs` (sub)path of the web app.

    | Host    | `base`                      |
    |---------|-----------------------------|
    | Netlify | `/docs`                     |
    | GitLab  | `sphericalgeometryvue/docs` |

    :::important
    If you choose a different path to view the documentation, be sure to also update `src/App.vue`. The toolbar includes a question mark icon (`mdi-help-circle`) which is linked to the online documentation using Vue Router `<router-link>` tag

    | Host    | `<router-link to="___">`           |
    |---------|------------------------------------|
    | Netlify | `/docs`                            |
    | GitLab  | full URL path to the documentation |

    :::

3.