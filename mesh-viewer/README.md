## Viewer

This is the actual client application that fetches presigned URLs from `mesh-server` and visualizes them on browser using THREE.js. To run the program first install dependencies with

`npm install`

then build the project with 

`npm run build`

Since the script is creating a web worker it will not work if the `index.html` is opened directly from the file system. A work around for this is to install for example `local-web-server` by 

`npm install -g local-web-server`

Navigate to the `dist` directory that is created in the build phase and from there run 

`ws`

The application should now be available on `localhost:8000`