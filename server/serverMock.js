const Server = require('./index.js');
const HttpStatus = require("http-status-codes");

module.exports = class ServerMock extends Server {
  constructor (config) {
    super(...arguments);
    this.port = config.port;
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
      return res.status(200).send(files.get(pathQuery));
    } else {
      return res.status(404).send(HttpStatus.getStatusText(404));
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
