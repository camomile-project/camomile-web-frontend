# Camomile Web Front-End

## Docker

```
$ docker run -e CAMOMILE_API=https://camomile.fr/api -e PYANNOTE_API=https://pyannote.fr/tool camomile/web
```

### Docker automated build

Thanks to Docker automated build, Docker image `camomile/web` is always in track with latest version in branch `master`.

You can however build your own Docker image using
```
$ git clone https://github.com/camomile-project/camomile-web-frontend.git
$ cd camomile-web-frontend
$ docker build -t camomile/web . 
```

## Local setup

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

    -c, --camomile <url>  base URL of Camomile server (e.g. https://camomile.fr/api)
    -p, --pyannote <url>  base URL of PyAnnote server (e.g. https://camomile.fr/tool)
````

or use environment variables `CAMOMILE_API` and `PYANNOTE_API`:

```
$ export CAMOMILE_API=https://camomile.fr/api
$ export PYANNOTE_API=https://pyannote.fr/tool
$ node web-server.js
```
