# ========================
# Launching with docker.io
# ========================

# build docker image
docker build -t hbredin/camomile:dev .

# run Camomile API in container
docker run -d -t -v $PWD:/app -p 4001:8070 hbredin/camomile:dev
