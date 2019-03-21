/* global require module fetch FileReader */
const localforage = require('localforage');

module.exports = class Files {
  constructor (app, localforage) {
    this.app = app;
  }

  isLSFileName (filename) {
    return filename.startsWith(this.app.config.ls_file_prefix);
  }

  LSFileNameToFileName (filename) {
    return filename.substr(this.app.config.ls_file_prefix.length);
  }

  getFileList () {
    return localforage.keys().then(value => {
      var filtered = [];
      for (var i in value) {
        var item = value[i];
        if (this.isLSFileName(item)) {
          filtered.push(this.LSFileNameToFileName(item));
        }
      }
      return filtered;
    });
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

  pushSelectedToLS (file) {
    const reader = new FileReader();

    reader.onload = (event) => {
      this.saveFile(
        file.name,
        this.app.coders.Uint8ArrayToString(event.target.result)
      );
    };

    reader.readAsArrayBuffer(file);
  }

  loadLocal (filename) {
    const { coders, state, ui } = this.app;
    return localforage.getItem(
      this.app.config.ls_file_prefix + filename
    ).then(contents => {
      this.loadFromSource(coders.stringToUint8Array(contents));
      ui.setWindowTitle(filename);
      state.file.name = filename;
      state.file.remote_name = "";
      this.postLoad();
    });
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

  // TODO: remove callback
  loadFromSource (source) {
    source = new Uint8Array(source);

    // Save file source or flush it.
    // Saving is useful for debugging.
    if (this.app.config.save_file_source) {
      this.app.state.file.source = source;
    } else {
      this.app.state.file.source = new Uint8Array();
    }

    this.app.state.file.lines = [new Uint8Array()];  // insert one empty line

    // TODO: refactor
    var lineBytes = [];
    for (var i = 0; i < source.byteLength; i++) {
      if (source[i] == 13) {
        this.app.state.file.lines.push(new Uint8Array(lineBytes));
        lineBytes = [];
        i++;
      } else {
        lineBytes.push(source[i]);
      }
    }

    this.app.state.file.lines.push(new Uint8Array(lineBytes));

    return this.app.state.file;
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
