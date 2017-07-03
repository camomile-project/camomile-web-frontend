# Camomile Web Front-End

## Deploy with Docker

```
$ docker build -t camomile/web .
$ docker run -d --net=host camomile/web
```

The web frontend assumes that the camomile server, pyannote and the camomile analytics tool are properly setup.