module.exports = class URIHashControl {
  constructor (app) {
    this.app = app;
  }

  // Allows to change the hash only once per config.uri_hash_update_delay.
  // Delay is required since URL hash update is quite slow.
  set (newURLHash) {
    var updateFunction = () => {
      if (newURLHash) {
        if (history.replaceState) {
          history.replaceState(undefined, undefined, '#' + newURLHash);
        } else {
          location.hash = '#' + newURLHash;
        }
      } else {
        history.pushState('', document.title, window.location.pathname);
      }
      this.app.state.hash_timeout = null;
    };

    if (this.app.state.hash_timeout) {
      clearTimeout(this.app.state.hash_timeout);
      this.app.state.hash_timeout = setTimeout(
        updateFunction,
        this.app.config.uri_hash_update_delay
      );
    } else {
      updateFunction();
      this.app.state.hash_timeout = setTimeout(() => {
        this.app.state.hash_timeout = null;
      }, this.app.config.uri_hash_update_delay);
    }
  }

  update () {
    var newURLHash = '';
    if (!!this.app.state.file.remote_name) {
      newURLHash = 'remote:' + this.app.state.file.remote_name + ':' + this.app.scroll.y;
    } else {
      // We're in a local file
      if (!!this.app.state.file.name) {
        newURLHash = 'local:' + this.app.state.file.name + ':' + this.app.scroll.y;
      }
    }
    this.set(newURLHash);
  }

  async process (hash) {
    const parsedHash = this.parseHash(hash);

    if (parsedHash === null) {
      // restore URI hash
      this.set(this.getCurrent());
      return;
    }

    const { line, file, type } = parsedHash;
    const { scroll, state, config, ui, files } = this.app;

    if (scroll.y != line) {
      scroll.y = line;
    }

    // TODO: add ability to open local files by editing URI hash
    if (type == 'remote' && state.file.remote_name != file) {
      try {
        await files.loadRemote(
          config.content_real_path + '/' + file,
          file
        );

        var baseName = file.split(/[\\/]/).pop();
        ui.setWindowTitle(baseName);
        state.file.name = baseName;
        state.file.remote_name = file;
        state.content_list.path = file.substr(
          0,
          file.length - baseName.length - 1  // -1 to strip the last `/`
        );
        scroll.y = line;
      } catch (e) {
        this.app.alert("Couldn't load remote file!");
      }
    }
  }

  async load (parsed) {
    if (parsed.type == 'remote') {
      var baseName = parsed.file.split(/[\\/]/).pop();

      // Set state.content_list.path to be equal to the path of
      // the file being loaded
      var path = parsed.file.substr(
        0,
        parsed.file.length - baseName.length - 1
      );

      this.app.state.content_list.path = path;

      return await this.app.files.loadRemote(
        this.app.config.content_real_path + '/' + parsed.file,
        parsed.file
      ).then(() => {
        this.app.ui.setWindowTitle(baseName);
        this.app.state.file.name = baseName;
        this.app.scroll.y = parsed.line;
      }).catch(err => {
        this.app.alert("Couldn't load remote file!");
      });
    } else if (parsed.type == 'local') {
      return await this.app.files.loadLocal(parsed.file).then(() => {
        this.app.scroll.y = parsed.line;
        return this.update();
      });
    } else {
      const message = "UriHashControl.load: incorrect URI hash value!";
      this.app.alert(message);
      throw new Error(message);
    }
  }

  getCurrent () {
    var curHash = '';
    if (this.app.state.file.name) {
      curHash =
        (this.app.state.file.remote_name
          ? 'remote:' + this.app.state.file.remote_name
          : 'local:' + this.app.state.file.name) +
        ':' +
        this.app.scroll.y;
    }
    return curHash;
  }

  parseHash (hash) {
    const parts = decodeURIComponent(hash).substr(1).split(':');
    const type = parts.shift();
    const line = parseInt(parts.pop());

    if (!['remote', 'local'].includes(type) || isNaN(line)) {
      return null;
    }

    return { line, file: parts.join(':'), type };
  }
};
