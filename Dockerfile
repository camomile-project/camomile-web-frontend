FROM node:0.10.38

ADD . /app
WORKDIR /app
RUN npm install

EXPOSE 8070

CMD ["node", "web-server.js"]
