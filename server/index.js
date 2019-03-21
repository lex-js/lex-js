const path = require("path");
const HttpStatus = require("http-status-codes");
const pathIsInside = require("path-is-inside");
const glob = require("glob");
const fs = require("fs");
const anymatch = require("anymatch");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");

module.exports = class Server {
  constructor (config, internalCwd, externalCwd) {
    if (arguments.length != 3) {
      throw "Incorrect number of arguments for Server constructor!";
    }

    this.instance = null;
    this.silent = false;

    this.config = config;
    this.internalCwd = internalCwd;
    this.externalCwd = externalCwd;
  }

  /*
  --- fn getFile() ---
  @does: Validates file in ($config.content_dir + $pathQuery) and attaches it to the given response object.
  @accepts: {
    res: Object [expressjs response object]
    pathQuery: String [Path to file, @required]
  }
  @returns: Object [expressjs response object]
  */

  getFile(res, pathQuery) {
    const { externalCwd, config } = this;
    let rootPath = path.join(externalCwd, config.content_dir);
    let filePath = path.join(rootPath, path.normalize(pathQuery));

    if (
      fs.existsSync(filePath) &&
      pathIsInside(filePath, rootPath) &&
      fs.statSync(filePath).isFile()
    ) {
      if (anymatch(config.allowed_files, filePath)) {
        return res.sendFile(filePath);
      }
      return res.status(403).send(HttpStatus.getStatusText(403));
    }
    return res.status(404).send(HttpStatus.getStatusText(404));
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

  listDir(pathQuery = ".") {
    const { externalCwd, config } = this;

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

  start() {
    const { config, internalCwd } = this;
    const api = this.api = express();
    api.use(compression());
    api.use(helmet());

    api.get("/", (req, res) => {
      return res.sendFile(path.join(internalCwd, "index.html"));
    });

    api.get("/api", (req, res) => {
      switch (req.query.action) {
        case "listdir":
          return res.json(this.listDir(req.query.dir));

        case "getfile":
          return this.getFile(res, req.query.file);

        default:
          return res.send(400, HttpStatus.getStatusText(400));
      }
    });

    api.use("/public", express.static(path.join(internalCwd, "public")));

    return new Promise((resolve, reject) => {
      this.instance = api.listen(config.port, resolve);
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      return this.instance.close(
        maybeErr =>
          typeof maybeErr !== 'undefined'
            ? reject(maybeErr)
            : resolve()
      );
    });
  }
};
