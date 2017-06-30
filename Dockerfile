FROM node:0.10.38

ADD . /app
WORKDIR /app
RUN npm install

EXPOSE 8073

CMD ["node", "/app/web-server.js", "--pyannote=http://localhost:8071", "--camomile=http://localhost:8070", "--login=root", "--password=password"]
