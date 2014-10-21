# Camomile Web Front-End

## Deploy with GitHub Pages

In order to deploy the app to GitHub Pages ([http://camomile-project.github.io/camomile-web-frontend](http://camomile-project.github.io/camomile-web-frontend)), follow this two-steps process.

**Step 1:** install and run web-server.js once (and kill it) to generate `app/config.js`.

```
$ npm install
$ node web-server.js --camomile=blahblah.fr --pyannote=foobar.com
```

**Step 2:** use [`ghp-import`](https://github.com/camomile-project/ghp-import) to push the `app` directory to branch `gh-pages`

```
$ ghp-import -n -p app
```

[Enjoy](http://camomile-project.github.io/camomile-web-frontend)!

## Deploy with Docker

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

    -c, --camomile <url>  base URL of Camomile server (e.g. https://camomile.fr/api)
    -p, --pyannote <url>  base URL of PyAnnote server (e.g. https://camomile.fr/tool)
````

or use environment variables `CAMOMILE_API` and `PYANNOTE_API`:

```
$ export CAMOMILE_API=https://camomile.fr/api
$ export PYANNOTE_API=https://pyannote.fr/tool
$ node web-server.js
```
