const fs = require("fs");
const Readable = require("stream").Readable;
const path = require("path");
const glob = require("glob");
const pathIsInside = require("path-is-inside");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const externalCwd = process.pkg ? path.dirname(process.execPath) : __dirname;
const internalCwd = process.pkg
  ? path.dirname(process.pkg.entrypoint)
  : __dirname;

const Ajv = require('ajv');
const config = JSON.parse(fs.readFileSync(externalCwd + "/config-server.json"));
const ajv = new Ajv();
const schema = JSON.parse(fs.readFileSync(externalCwd + "/src/config-server-schema.json"));
const valid = ajv.validate(schema, config);
if (!valid) {
  console.log(ajv.errorsText(ajv.errors, { dataVar: "config-server.json" }));
  process.exit(1);
}
const listenPort = config.port;


function listDir(
  pathQuery = ".",
  allowedExtensions = [/\.txt$/i, /\.c$/i, /\.hs$/i]
) {
  let rootPath = path.join(externalCwd, "files", "content");
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

  let exactGlobResult = [];

  for (let entry of globResult) {
    let fullPath = path.join(basePath, entry);
    let entryStats = fs.lstatSync(fullPath);

    let isDir = entryStats.isDirectory();
    if (isDir) {
      exactGlobResult.push({
        name: entry,
        type: "directory",
        modified: entryStats.mtimeMs
      });
    } else {
      let extension = path.extname(fullPath);

      if (!allowedExtensions.some(regex => regex.test(extension))) {
        continue;
      }

      exactGlobResult.push({
        name: entry,
        type: "file",
        modified: entryStats.mtimeMs,
        size: entryStats.size
      });
    }
  }

  return exactGlobResult;
}

function getFile(pathQuery) {
  let rootPath = path.join(externalCwd, "files", "content");
  let basePath = path.join(rootPath, path.normalize(pathQuery));

  if (
    !fs.existsSync(basePath) ||
    !pathIsInside(basePath, rootPath) ||
    !fs.lstatSync(basePath).isFile()
  ) {
    let s = new Readable();
    s.push("No such file");
    s.push(null);

    return s;
  }

  return fs.createReadStream(basePath);
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
      return getFile(req.query.file).pipe(res);

    default:
      return res.status(400);
  }
});

api.use("/public", express.static(path.join(internalCwd, "public")));

api.listen(listenPort, () => {
  console.log(`Listening on http://localhost:${listenPort}/`);

  if (process.env.NODE_ENV === "production") {
    return;
  }
  require("opn")(`http://localhost:${listenPort}/`);
});
