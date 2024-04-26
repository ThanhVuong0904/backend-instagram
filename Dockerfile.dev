FROM node:18-alpine

ENV NPM_CONFIG_LOGLEVEL warn
RUN echo "set nocompatible" > ~/.vimrc

RUN npm install -g pm2

# Bundle enviroment files
COPY package.json .
COPY package-lock.json .

# Install app dependencies
RUN npm ci

# Bundle APP files
COPY . .

ENV PORT 8000
EXPOSE 8000

CMD [ "sh", "-c", "pm2-runtime ecosystem.config.js" ]