FROM node:22-alpine3.21
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package.json ./
USER node
RUN npm install
COPY --chown=node:node . .
RUN npm version patch
RUN npm run build
EXPOSE 7004
CMD [ "node", "dist/index.js"]