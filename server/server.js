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
    this.config = config;
    this.internalCwd = internalCwd;
    this.externalCwd = externalCwd;
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
  getFile (pathQuery) {
    const { externalCwd, config } = this;
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
  listDir (pathQuery = ".") {
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

  start () {
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
        let fileObj = this.getFile(req.query.file);
        return fileObj.file
          ? res.sendFile(fileObj.file)
          : res.send(fileObj.status, HttpStatus.getStatusText(fileObj.status));

      default:
        return res.send(400, HttpStatus.getStatusText(400));
      }
    });

    api.use("/public", express.static(path.join(internalCwd, "public")));

    this.server = api.listen(config.port, () => {
      console.log(`Listening on http://localhost:${config.port}/`);

      if (process.env.NODE_ENV === "production") {
        return;
      }

      require("opn")(`http://localhost:${config.port}/`);
    });
  }

  stop () {
    this.server.close();
  }
};
