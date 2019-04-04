/* global require module preloadedFile setTimeout FileReader */
const Mousetrap = require('mousetrap');

const Coders = require('./coders');
const defaultConfig = require('./config-default');
const ContentBrowser = require('./content-browser.js');
const Render = require('./render');
const Export = require('./export');
const Files = require('./files');
const FontControl = require('./font');
const UI = require('./ui');
const mkState = require('./state');
const LineNumbers = require('./line-numbers');
const MobileUI = require('./mobile-ui');

const Parser = require('./parser');
const Screen = require('./screen');
const SearchControl = require('./search');
const SelectionControl = require('./selection');
const URIHashControl = require('./uri-hash');
const Scroll = require('./scroll');

module.exports = class App {
  constructor () {
    const app = this;
    app.coders = Coders;
    app.config = this.loadConfig();
    mkState(app);
    app.contentBrowser = new ContentBrowser(app);
    app.render = new Render(app);
    app.export = new Export(app);
    app.files = new Files(app);
    app.FontControl = new FontControl(app);
    app.ui = new UI(app);
    app.lineNumbers = new LineNumbers(app);
    app.mobileUI = new MobileUI(app);
    app.parser = new Parser(app);
    app.screen = new Screen(app);
    app.search = new SearchControl(app);
    app.selection = new SelectionControl(app);
    app.URIHashControl = new URIHashControl(app);
    app.scroll = new Scroll(app);
  }

  log () {
    console.log.apply(console, arguments);
  }

  alert () {
    if (typeof alert === 'function') {
      alert(...arguments);
    } else {
      console.log('alert: ', ...arguments);
    }
  }

  loadConfig () {
    return (
      (typeof window.userConfig === 'object') ?
        Object.assign(defaultConfig, window.userConfig) :
        defaultConfig
    );
  }

  initMousetrap () {
    const { screen, contentBrowser, state, ui, lineNumbers,
            config, selection, render, search, scroll } = this;

    const moveY = value => () => {
      if (contentBrowser.active) {
          contentBrowser.navigate(value);
        } else {
          scroll.moveY(value);
        }
    };

    const moveX = value => () => {
      if (!contentBrowser.active) {
        scroll.moveX(value);
      }
    };

    const pagedown = () => {
      if (!contentBrowser.active) {
        scroll.moveY(screen.h - 1);
      }
    };

    const pageup = () => {
      if (!contentBrowser.active) {
        scroll.moveY(1 - screen.h);
      }
    };

    var bindings = {
      k: moveY(-1),
      л: moveY(-1),

      j: moveY(1),
      о: moveY(1),

      l: moveX(1),
      д: moveX(1),

      h: moveX(-1),
      р: moveX(-1),

      f: pagedown,
      а: pagedown,
      b: pageup,
      и: pageup,

      'alt+g': () => ui.showGotoLinePrompt(),
      v: () => lineNumbers.toggle(),
      м: () => lineNumbers.toggle(),
      esc: () => {
        selection.clear();
        contentBrowser.hide();
      },
      'alt+f3': () => search.activateSearchField(),

      ы: () => search.activateSearchField(),
      s: () => search.activateSearchField(),

      n: () => ui.duplicateWindow(),
      т: () => ui.duplicateWindow(),

      щ: () => document.getElementById('file-select').click(),
      o: () => document.getElementById('file-select').click(),

      d: () => this.export.toPNG(),
      в: () => this.export.toPNG(),

      с: () => contentBrowser.toggle(),
      c: () => contentBrowser.toggle(),

      up: moveY(-1),
      down: moveY(1),
      left: moveX(-1),
      right: moveX(1),
      'ctrl+up': moveY(- config.ctrl_scroll_k),
      'ctrl+down': moveY(config.ctrl_scroll_k),
      'ctrl+left': moveX(-1 * config.ctrl_scroll_k),
      'ctrl+right': moveX(1 * config.ctrl_scroll_k),

      end: () => {
        if (contentBrowser.active) {
          contentBrowser.navigate('bottom');
        } else {
          scroll.toEnd();
        }
      },
      home: () => {
        if (contentBrowser.active) {
          contentBrowser.navigate('top');
        } else {
          scroll.toBeginning();
        }
      },

      pagedown: pagedown,
      pageup: pageup,

      enter: () => {
        if (contentBrowser.active) {
          var el = document.querySelector('.content-list-active');
          if (el) {
            el.click();
          }
        }
      }
    };

    Object.entries(bindings).forEach(([key, func]) => {
      Mousetrap.bind(key, func);
    });

    var searchField = document.getElementById('search-field');
    Mousetrap(searchField).bind('esc', () => {
      search.close();
      render.update();
    });

    Mousetrap(searchField).bind('enter', () => search.searchNext());
    Mousetrap(searchField).bind('shift+enter', () => search.searchPrevious());
    Mousetrap(searchField).bind('backspace', () => {
      if (document.getElementById('search-field').value == '') {
        search.deactivateSearchField();
        render.update();
      }
    });
  }

  async init () {
    const { screen, state, files, render, config, FontControl,
            URIHashControl } = this;

    this.initMousetrap();
    screen.update();
    this.eventsInit();
    this.canvasInit();

    const isLocal = document.location.protocol === 'file:';

    await Promise.all(config.fonts.map((fontFile, ix) => {
      return FontControl.loadFont(fontFile, ix);
    }));

    this.log('fonts loaded!');

    render.makeImageData();

    if (this.state.is_mobile) {
      await this.mobileInit();
      this.mobileEventsInit();
    }

    const parsedHash = URIHashControl.parseHash(document.location.hash);

    if (parsedHash !== null) {
      try {
        await URIHashControl.load(parsedHash);
        return await this.postInit();
      } catch (e) {
        this.alert("Local file not found!");
      }
    }

    if (config.load_greeting_file_from_source && !isLocal) {
      try {
        await files.loadRemote(config.greeting_file, '');
      } catch (e) {
        this.alert("Greeting file not found!");
      }
    } else {
      if (typeof window.preloadedFile == 'undefined') {
        throw new Error("No preloaded file found!");
      }
      files.loadFromSource(preloadedFile);
    }
    await this.postInit();
  }

  async postInit () {
    this.screen.update();
    await this.ui.updateFileList();
    this.render.makeImageData();
    this.render.update();
    document.getElementById('preloader').style.display = 'none';
  }

  eventsInit () {
    const { search, config, state, URIHashControl, render,
            coders, files, ui, contentBrowser, lineNumbers } = this;

    const canvas = document.getElementById('canvas');

    window.addEventListener('resize', () => {
      this.screen.update();
      this.render.update();
      this.scroll.update();
    });
    window.addEventListener('hashchange', () => URIHashControl.process(document.location.hash));

    document
      .getElementById('search-field')
      .addEventListener('keyup', () => search.performSearch());

    document
      .getElementById('search-close')
      .addEventListener('click', () => {
        search.clearSearchField();
        search.deactivateSearchField();
        render.update();
      });

    document
      .getElementById('file-list')
      .addEventListener('change', evt => {
        evt.target.blur();
      });

    document
      .getElementById('file-select')
      .addEventListener('change', evt => {
        let fileList = evt.target.files;
        const lastname = fileList[fileList.length - 1].name;

        if (!config.save_to_ls) {
          fileList = [fileList[fileList.length - 1]];
        }

        Array.prototype.forEach.call(fileList, file => {
          var reader = new FileReader();
          reader.onload = async event => {
            if (config.save_to_ls) {
              var fileContent = coders.Uint8ArrayToString(
                new Uint8Array(event.target.result)
              );
              await files.saveFile(file.name, fileContent);
            }

            if (file.name == lastname) {
              files.loadFromSource(
                new Uint8Array(event.target.result)
              );
              ui.setWindowTitle(file.name);
              document.activeElement.blur();
              state.file.name = file.name;
              state.file.remote_name = '';
              this.files.postLoad();
            }
          };

          reader.readAsArrayBuffer(file);
        });
      });

    const bindings = {
      'button-load': () => {
        var filename = document.getElementById('file-list').value;
        files.loadLocal(filename);
      },
      'button-delete': () => {
        var filename = document.getElementById('file-list').value;
        files.deleteFile(filename);
      },
      'button-line-numbers': () => {
        contentBrowser.hide();
        lineNumbers.toggle();
      },
      'button-goto-line': () => {
        contentBrowser.hide();
        ui.showGotoLinePrompt();
      },
      'button-search': () => {
        if (state.search.active) {
          search.deactivateSearchField();
          render.update();
        } else {
          contentBrowser.hide();
          search.activateSearchField();
        }
      },
      'button-content': () => contentBrowser.toggle(),
      'button-open-copy': () => ui.duplicateWindow()
    };

    Object.entries(bindings).forEach(([id, handler]) => {
      document.getElementById(id).addEventListener('click', handler);
    });
  }

  async mobileInit () {
    return new Promise((resolve, reject) => {
      // add mobile css
      var style = document.createElement('link');
      style.rel = 'stylesheet';
      style.type = 'text/css';
      style.href = this.config.mobile_style_url;
      style.onload = resolve;
      style.onerror = reject;
      document.head.appendChild(style);
    });
  }

  mobileEventsInit () {
    const { mobileUI, contentBrowser, state, ui, lineNumbers } = this;

    var actionDefs = {
      'mobile-menu-close': () => mobileUI.closeMenu(),
      'mobile-menu-open': () => mobileUI.openMenu(),
      'mobile-open-file': () => {
        document.getElementById('file-select').click();
        // Delay menu closing.
        //
        // File manager will pop up with some delay.
        // It's confusing/annoying when menu just disappears entirely
        // before file manager appears.
        //
        // TODO: add preloader animation here?
        setTimeout(() => mobileUI.closeMenu(), 1000);
      },
      'close-content-list-mobile': () => {
        contentBrowser.hide();
        if (state.is_mobile) {
          mobileUI.openMenu(false);
        }
      },
      'mobile-toggle-lines': () => {
        lineNumbers.toggle();
        mobileUI.closeMenu();
      },
      'mobile-list-content': () => {
        mobileUI.closeMenu();
        contentBrowser.show();
      },
      'mobile-goto-line': () => {
        ui.showGotoLinePrompt();
        mobileUI.closeMenu();
      }
    };

    Object.entries(actionDefs).forEach(([id, func]) => {
      document.getElementById(id).addEventListener('click', func);
    });
  }

  canvasInit () {
    const { state, scroll, render, config, selection, mobileUI } = this;

    const canvas = document.getElementById('canvas');

    canvas.addEventListener('click', (event) => {
      if (state.is_mobile) {
        mobileUI.toggleMenuButton();
      }
    });

    canvas.addEventListener('mousedown', (event) => {
      var rect = canvas.getBoundingClientRect(),
        selStartRealX = event.pageX - rect.left,
        selStartRealY = event.pageY - rect.top;
      state.selection.x1 =
        scroll.x + Math.round(selStartRealX / config.font_width);
      state.selection.y1 =
        scroll.y + Math.round(selStartRealY / config.font_height);
      state.selection.started = true;
      state.selection.set = false;
      render.update();
      event.preventDefault();
    });

    const canvasMouseMove = event => {
      if (state.selection.started) {
        var canvas = document.getElementById('canvas'),
          rect = canvas.getBoundingClientRect(),
          selStartRealX = event.pageX - rect.left,
          selStartRealY = event.pageY - rect.top;
        state.selection.x2 =
          scroll.x + Math.round(selStartRealX / config.font_width);
        state.selection.y2 =
          scroll.y + Math.round(selStartRealY / config.font_height);
        if (
          state.selection.x2 != state.selection.x1 &&
          state.selection.y1 != state.selection.y2
        ) {
          state.selection.set = true;
        } else {
          state.selection.set = false;
        }
        render.update();
      }
    };

    canvas.addEventListener('mousemove', canvasMouseMove);
    canvas.addEventListener('mouseup', event => {
      canvasMouseMove(event);
      try {
        // catching 'Discontinuous selection is not supported' error in chromium
        var mime = 'text/plain';
        var range = document.createRange();
        window.getSelection().addRange(range);
        state.selection.started = false;
      } catch (e) {
        console.log(e);
      }
    });

    document.addEventListener('copy', event => {
      var selectionText = selection.getSelectionText();
      if (selectionText !== null) {
        event.clipboardData.setData('text/plain', selectionText);
        event.preventDefault();
        window.getSelection().removeAllRanges();
        selection.clear();
        render.update();
      }
    });
  }
};
