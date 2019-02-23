const fs = require("fs");
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
const listenPort = Number(process.env.PORT) || 1337;

function listDir(
  pathQuery = ".",
  allowedExtensions = [/\.txt$/i, /\.c$/i, /\.hs$/i]
) {
  let rootPath = path.join(externalCwd, "files", "content");
  let basePath = path.join(rootPath, path.normalize(pathQuery));

  if (!pathIsInside(basePath, rootPath)) {
    basePath = rootPath;
  }

  let globResult = glob.sync("*", { cwd: basePath });
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

const api = express();
api.use(compression());
api.use(helmet());

api.get("/", (req, res) => {
  return res.sendFile(path.join(internalCwd, "index.html"));
});

api.get("/listContentDir", (req, res) => {
  let pathQuery = req.query.path;
  return res.json(listDir(pathQuery));
});

api.use("/public", express.static(path.join(internalCwd, "public")));
api.use("/files", express.static(path.join(externalCwd, "files")));

api.listen(listenPort, () => {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  require("opn")(`http://localhost:${listenPort}/`).then(() => process.exit(0));
});
