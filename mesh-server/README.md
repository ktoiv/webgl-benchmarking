## Server

This folder houses a simple python script and a Dockerfile that could be used to build a docker image thats serves presigned url's from AWS S3.

To build the image run `docker build -t mesh-server .` from this directory. (note that you have to replace placeholder values in `Dockerfile` first and Docker must be installed)

To run the image execute `docker run -p 5000:5000 mesh-server`. The API is now available on `loclahost:5000`

