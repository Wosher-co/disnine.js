# Typescript-Template
A template to work with typescript. Compatibility with docker, and nodemon.

# How to use
There are different npm scripts implemented:

## 1. nodemon
This one will run the typescript directly through **ts-node** with nodemon.
- `npm run dev`

## 2. Normal Start
This one will compile the typescript and execute it directly
- `npm start`

## 3. Lite Start (Used by containers)
This ones executes the project directly, without compiling.
- `npm run start_lite`

## 4. Compile Typescript
This one only compiles the typescript using the `tsconfig.json` file.
- `npm run tsc`

# What about the `.gitignore`

The `.gitignore` file is ready to ignore compiled or useless files, and prevent uploading different type of configs **(You always need to upload an example of your config)**
