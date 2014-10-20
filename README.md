# Camomile Web Front-End

## Installation

````
$ git clone https://github.com/camomile-project/camomile-web-frontend
$ cd camomile-web-frontend
$ npm install
```

## Usage

```
Usage: node web-server.js [options]

  Options:

    -h, --help            output usage information
    -c, --camomile <url>  base URL of Camomile server (e.g. https://camomile.fr/api)
    -p, --pyannote <url>  base URL of PyAnnote server (e.g. https://camomile.fr/tool)
````

or use environment variables `CAMOMILE_API` and `PYANNOTE_API`:

```
$ export CAMOMILE_API=https://camomile.fr/api
$ export PYANNOTE_API=https://pyannote.fr/tool
$ node web-server.js
Web App --> http://localhost:8070/
Camomile API --> https://camomile.fr/api
PyAnnote API --> https://pyannote.fr/tool
```
