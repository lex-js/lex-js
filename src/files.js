/* global require module fetch FileReader */
const localforage = require('localforage');

module.exports = class Files {
  constructor (app, localforage) {
    this.app = app;
  }

  getFileList () {
    const prefix = this.app.config.ls_file_prefix;
    return localforage.keys().then(keys => keys.filter(
      key => key.startsWith(prefix)
    ).map(
      key => key.substr(prefix.length)
    ));
  }

  async saveFile (filename, source) {
    const value = await localforage.setItem(
      this.app.config.ls_file_prefix + filename,
      source
    );
    await this.app.ui.updateFileList();
  }

  async deleteFile (filename) {
    await localforage.removeItem(
      this.app.config.ls_file_prefix + filename
    );
    await this.app.ui.updateFileList();
  }

  async loadLocal (filename) {
    const { coders, state, ui } = this.app;
    const contents = await localforage.getItem(
      this.app.config.ls_file_prefix + filename
    );

    this.loadFromSource(coders.stringToUint8Array(contents));
    ui.setWindowTitle(filename);
    state.file.name = filename;
    state.file.remote_name = "";
    this.postLoad();
  }

  async loadRemote(url, remoteName) {
    const response = await fetch(url);
    if (response.status === 200) {
      const buffer = await response.arrayBuffer();

      this.loadFromSource(buffer);
      this.app.state.file.remote_name = remoteName;
      this.postLoad();
    } else if (response.status === 400) {
      throw "No access to remote file!";
    } else if (response.status === 404) {
      throw "Remote file not found!";
    } else {
      throw `Couldn't load remote file (${response.status})`;
    }
  }

  loadFromSource (source) {
    source = new Uint8Array(source);

    this.app.state.file.lines = [new Uint8Array()];  // insert an empty line

    let lineBytes = [];

    for (let i = 0; i < source.byteLength; i++) {
      if (source[i] == 13) {
        this.app.state.file.lines.push(new Uint8Array(lineBytes));
        lineBytes = [];
        i++;
      } else {
        lineBytes.push(source[i]);
      }
    }

    this.app.state.file.lines.push(new Uint8Array(lineBytes));
    return this.app.state.file.lines;
  }

  postLoad () {
    const { search, scroll, state, lineNumbers, selection,
            URIHashControl, render, screen } = this.app;

    search.rebuildIndex();
    search.close();
    scroll.y = 0;
    scroll.x = 0;

    if (state.numbers.set) {
      lineNumbers.add();
    }

    URIHashControl.update();
    selection.clear();
    scroll.update();
    screen.update();
    render.update();
  }
};
