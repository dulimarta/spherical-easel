FROM node:16

# Create a working directory in the container and make it the current dir
WORKDIR /usr/src/app

COPY ./app-server/package*.json .
COPY ./app-server/tsconfig.json .
COPY ./app-server/geo.ts ./server/geo.ts
COPY ./firebase-backend.ts .
RUN npm install && (cd /usr/src/app && npx tsc)

EXPOSE 4000

CMD ["node", "server/geo.js"]