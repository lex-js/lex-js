/*
--- Modules ---
*/

const fs = require("fs");
const path = require("path");
const HttpStatus = require("http-status-codes");
const ajv = new (require("ajv"))();
const glob = require("glob");
const pathIsInside = require("path-is-inside");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const anymatch = require("anymatch");

/*
--- Constants ---
*/

const externalCwd = process.pkg ? path.dirname(process.execPath) : __dirname;
const internalCwd = process.pkg
  ? path.dirname(process.pkg.entrypoint)
  : __dirname;
const configPath = path.join(internalCwd, "config-server.json");
const schemaPath = path.join(internalCwd, "config-server-schema.json");
const config = require(configPath);
const schema = require(schemaPath);

/*
--- Config validation ---
*/

let isValid = ajv.validate(schema, config);
if (!isValid) {
  console.log(ajv.errorsText(ajv.errors, { dataVar: "config-server.json" }));
  process.exit(1);
}

/*
--- fn listDir() ---
@does: Returns listing of ($config.content_dir + $pathQuery)
@accepts: {
  pathQuery: String [Path to dir, @default -> "."] 
}
@returns: Array<Object> {
  name: String [name of file or dir],
  modified: Number [date of last file modification in milliseconds],
  type: "file" | "directory" [entry type],
  size [if file]: Number [size of file]
}
*/

function listDir(pathQuery = ".") {
  let rootPath = path.join(externalCwd, config.content_dir);
  let basePath = path.join(rootPath, path.normalize(pathQuery));

  if (!pathIsInside(basePath, rootPath)) {
    basePath = rootPath;
  }

  let globResult;

  try {
    globResult = glob.sync("*", { cwd: basePath });
  } catch (e) {
    globResult = [];
  }

  return globResult.reduce((acc, name) => {
    const fullPath = path.join(basePath, name);
    const stats = fs.statSync(fullPath);
    const modified = stats.mtimeMs;

    if (stats.isDirectory()) {
      acc.push({
        name,
        modified,
        type: "directory"
      });
    } else {
      if (anymatch(config.allowed_files, fullPath)) {
        acc.push({
          name,
          modified,
          type: "file",
          size: stats.size
        });
      }
    }

    return acc;
  }, []);
}

/*
--- fn getFile() ---
@does: Validates file in ($config.content_dir + $pathQuery) and returns it, if valid
@accepts: {
  pathQuery: String [Path to file, @required]
}
@returns: Object {
  status: Number [HTTP code],
  file: String | Null
}
*/

function getFile(pathQuery) {
  let rootPath = path.join(externalCwd, config.content_dir);
  let basePath = path.join(rootPath, path.normalize(pathQuery));

  if (
    !fs.existsSync(basePath) ||
    !pathIsInside(basePath, rootPath) ||
    !fs.statSync(basePath).isFile()
  ) {
    return {
      status: 404,
      file: null
    };
  }

  if (!anymatch(config.allowed_files, basePath)) {
    return {
      status: 403,
      file: null
    };
  }

  return {
    status: 200,
    file: basePath
  };
}

const api = express();
api.use(compression());
api.use(helmet());

api.get("/", (req, res) => {
  return res.sendFile(path.join(internalCwd, "index.html"));
});

api.get("/api", (req, res) => {
  switch (req.query.action) {
    case "listdir":
      return res.json(listDir(req.query.dir));

    case "getfile":
      let fileObj = getFile(req.query.file);
      return fileObj.file
        ? res.sendFile(fileObj.file)
        : res.send(fileObj.status, HttpStatus.getStatusText(fileObj.status));

    default:
      return res.send(400, HttpStatus.getStatusText(400));
  }
});

api.use("/public", express.static(path.join(internalCwd, "public")));

api.listen(config.port, () => {
  console.log(`Listening on http://localhost:${config.port}/`);

  if (process.env.NODE_ENV === "production") {
    return;
  }

  require("opn")(`http://localhost:${config.port}/`);
});
