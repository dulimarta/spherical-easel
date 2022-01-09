
# Reference: https://vuejs.org/v2/cookbook/dockerize-vuejs-app.html
# Use Alpine NodeJS as the base image for both dev and production
FROM node:14.15-alpine


# Copy from local into the image
WORKDIR ./

RUN apk add python3
RUN npm install -g npm@8.3.0
# RUN npm install -g http-server

# node-gyp must be installed globally
# Reference: https://github.com/nodejs/node-gyp/blob/master/docs/Updating-npm-bundled-node-gyp.md

# For NPM 7.x or 8.x
RUN npm explore npm/node_modules/@npmcli/run-script -g -- npm_config_global=false npm install node-gyp@latest

# For older NPM
# RUN npm explore npm/node_modules/npm-lifecycle -g -- npm install node-gyp@latest

COPY package*.json /


RUN npm install
COPY . .
# RUN npm run app:build
EXPOSE 8080

CMD ["npm", "run", "app:serve"]
