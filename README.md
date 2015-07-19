# Camomile Web Front-End

## Deploy with Docker

```
$ docker run -d
             -e CAMOMILE_API=https://camomile.fr/api \
             -e CAMOMILE_LOGIN=my_login \
             -e CAMOMILE_PASSWORD=my_password \
             camomile/web
```

### Docker automated build

Thanks to Docker automated build, Docker image `camomile/web` is always in track with latest version in branch `master`.

You can however build your own Docker image using
```
$ git clone https://github.com/camomile-project/camomile-web-frontend.git
$ cd camomile-web-frontend
$ docker build -t camomile/web . 
```

## Deploy locally

### Installation 

````
$ git clone https://github.com/camomile-project/camomile-web-frontend
$ cd camomile-web-frontend
$ npm install
```

### Usage

```
$ node web-server.js [options]

Options:

    --camomile <url>       URL of Camomile server (e.g. https://camomile.fr/api)
    --login <login>        Login for Camomile server (for queues creation)
    --password <password>  Password for Camomile server
````

or use environment variables `CAMOMILE_*` and `PYANNOTE_API`:

```
$ export CAMOMILE_API=https://camomile.fr/api
$ export CAMOMILE_LOGIN=my_login
$ export CAMOMILE_PASSWORD=my_password
$ node web-server.js
