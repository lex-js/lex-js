const path = require('path');
const Server = require('./');
const HttpStatus = require("http-status-codes");

class ServerMock extends Server {
  constructor () {
    super(...arguments);
    this.files = new Map();
    this.dirs = new Map();
    this.silent = true;
  }

  writeFile (pathQuery, response) {
    this.files.set(pathQuery, response);
  }

  deleteFile (pathQuery) {
    this.files.delete(pathQuery);
  }

  getFile (res, pathQuery) {
    const { files } = this;
    if (files.has(pathQuery)) {
      return res.send(200, files.get(pathQuery));
    } else {
      return res.send(404, HttpStatus.getStatusText(404));
    }
  }

  setDir (pathQuery, response) {
    this.dirs.set(pathQuery, response);
  }

  deleteDir (pathQuery) {
    this.dirs.delete(pathQuery);
  }

  listDir (pathQuery) {
    return this.dirs.get(pathQuery) || [];
  }
};

module.exports = ServerMock;
