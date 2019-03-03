const Mousetrap = require("mousetrap");

const Coders = require("./coders");
const defaultConfig = require("./config-default");
const ContentBrowser = require("./content-browser.js");
const Render = require("./render");
const Export = require("./export");
const Files = require("./files");
const FontControl = require("./font");
const UI = require("./ui");
const mkState = require("./state");
const LineNumbers = require("./line-numbers");
const MobileUI = require("./mobile-ui");
const Parser = require("./parser");
const Screen = require("./screen");
const SearchControl = require("./search");
const SelectionControl = require("./selection");
const TouchControl = require("./touch");
const URIHashControl = require("./uri-hash");

module.exports = class App {
  constructor() {
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
    app.touch = new TouchControl(app);
    app.URIHashControl = new URIHashControl(app);
  }

  log() {
    console.log.apply(console, arguments);
  }

  alert() {
    if (typeof alert === "function") {
      alert(...arguments);
    } else {
      console.log("alert: ", ...arguments);
    }
  }

  loadConfig() {
    return typeof window.userConfig === "object"
      ? Object.assign(defaultConfig, window.userConfig)
      : defaultConfig;
  }

  initMousetrap() {
    const {
      screen,
      contentBrowser,
      state,
      ui,
      lineNumbers,
      config,
      selection,
      render,
      search
    } = this;

    // Mousetrap bindings
    var bindings = {
      k: () => {
        screen.scrollY(1) || contentBrowser.navigate(-1);
      },
      л: () => {
        screen.scrollY(1) || contentBrowser.navigate(-1);
      },
      j: () => {
        screen.scrollY(-1) || contentBrowser.navigate(1);
      },
      о: () => {
        screen.scrollY(-1) || contentBrowser.navigate(1);
      },
      l: () => {
        screen.scrollX(-1);
      },
      д: () => {
        screen.scrollX(-1);
      },
      h: () => {
        screen.scrollX(1);
      },
      р: () => {
        screen.scrollX(1);
      },
      f: () => {
        screen.scrollY(-state.screen.h + 1) ||
          contentBrowser.navigate("bottom");
      },
      а: () => {
        screen.scrollY(-state.screen.h + 1) ||
          contentBrowser.navigate("bottom");
      },
      b: () => {
        screen.scrollY(state.screen.h - 1) || contentBrowser.navigate("top");
      },
      и: () => {
        screen.scrollY(state.screen.h - 1) || contentBrowser.navigate("top");
      },
      "alt+g": () => ui.showGotoLinePrompt(),
      v: () => lineNumbers.toggleLineNumbers(),
      м: () => lineNumbers.toggleLineNumbers(),
      esc: () => {
        state.screen.x = 0;
        selection.clear();
        contentBrowser.hide();
        render.update();
      },
      "alt+f3": () => search.activateSearchField(),

      ы: () => search.activateSearchField(),
      s: () => search.activateSearchField(),

      n: () => ui.duplicateWindow(),
      т: () => ui.duplicateWindow(),

      щ: () => document.getElementById("file-select").click(),
      o: () => document.getElementById("file-select").click(),

      d: () => this.export.toPNG(),
      в: () => this.export.toPNG(),

      с: () => contentBrowser.toggle(),
      c: () => contentBrowser.toggle(),
      up: event => {
        screen.scrollY(1) || contentBrowser.navigate(-1);
        event.preventDefault();
      },
      down: event => {
        screen.scrollY(-1) || contentBrowser.navigate(1);
        event.preventDefault();
      },
      left: () => {
        screen.scrollX(1);
      },
      right: () => {
        screen.scrollX(-1);
      },
      "ctrl+up": () => {
        screen.scrollY(1 * config.ctrl_scroll_k) ||
          contentBrowser.navigate("top");
      },
      "ctrl+down": () => {
        screen.scrollY(-1 * config.ctrl_scroll_k) ||
          contentBrowser.navigate("bottom");
      },
      "ctrl+left": () => {
        screen.scrollX(1 * config.ctrl_scroll_k);
      },
      "ctrl+right": () => {
        screen.scrollX(-1 * config.ctrl_scroll_k);
      },
      end: () => {
        screen.scrollEndY() || contentBrowser.navigate("bottom");
      },
      home: () => {
        screen.scrollHomeY() || contentBrowser.navigate("top");
      },
      pagedown: () => {
        screen.scrollY(-state.screen.h + 1);
      },
      pageup: () => {
        screen.scrollY(state.screen.h - 1);
      },
      enter: () => {
        if (state.content_list.active) {
          var el = document.querySelector(".content-list-active");
          if (el) {
            el.click();
          }
        }
      }
    };

    const fileSelect = document.getElementById("file-select");

    Object.entries(bindings).forEach(([key, func]) => {
      Mousetrap.bind(key, func);
      Mousetrap(fileSelect).bind(key, func);
    });

    var searchField = document.getElementById("search-field");
    Mousetrap(searchField).bind("esc", () => {
      search.clearSearchField();
      search.deactivateSearchField();
    });

    Mousetrap(searchField).bind("enter", () => search.searchNext());
    Mousetrap(searchField).bind("shift+enter", () => search.searchPrevious());
    Mousetrap(searchField).bind("backspace", () => {
      if (document.getElementById("search-field").value == "") {
        search.deactivateSearchField();
      }
    });
  }

  async init() {
    const {
      screen,
      state,
      files,
      render,
      config,
      FontControl,
      URIHashControl
    } = this;

    this.initMousetrap();
    screen.expandScreen();
    this.eventsInit();
    this.canvasInit();

    const isLocal = document.location.protocol === "file:";

    await Promise.all(
      config.fonts.map((fontFile, ix) => {
        return FontControl.loadFont(fontFile, ix);
      })
    );

    this.log("fonts loaded!");

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
      await files.loadRemote(config.greeting_file, "");
      await this.postInit();
    } else {
      if (typeof window.preloadedFile == "undefined") {
        throw new Error("No preloaded file found!");
      }
      files.loadFromSource(preloadedFile);
    }
  }

  async postInit() {
    this.screen.expandScreen();
    await this.ui.updateFileList();
    this.render.makeImageData();
    this.render.update();
    document.getElementById("preloader").style.display = "none";
  }

  eventsInit() {
    const {
      touch,
      search,
      config,
      state,
      URIHashControl,
      coders,
      files,
      ui,
      contentBrowser,
      lineNumbers
    } = this;

    const onMouseWheel = event => {
      let delta = 0;
      if (!event) event = window.event;
      if (event.wheelDelta) {
        delta = event.wheelDelta / 120;
      } else if (event.detail) {
        delta = -event.detail / 3;
      }
      if (delta) {
        this.screen.scrollY(delta);
      }
    };

    const canvas = document.getElementById("canvas");

    canvas.addEventListener("DOMMouseScroll", onMouseWheel, false);
    canvas.addEventListener(
      "touchstart",
      event => touch.handleStart(event),
      false
    );
    canvas.addEventListener(
      "touchmove",
      event => touch.handleMove(event),
      false
    );
    canvas.addEventListener("touchend", event => touch.handleEnd(event), false);
    window.onmousewheel = document.onmousewheel = onMouseWheel;
    window.addEventListener("resize", () => {
      this.screen.expandScreen();
      this.render.update();
    });
    window.addEventListener("hashchange", () =>
      URIHashControl.process(document.location.hash)
    );

    document
      .getElementById("search-field")
      .addEventListener("keyup", () => search.performSearch());

    document.getElementById("search-close").addEventListener("click", () => {
      search.clearSearchField();
      search.deactivateSearchField();
    });

    document.getElementById("file-list").addEventListener("change", evt => {
      evt.target.blur();
    });

    document.getElementById("file-select").addEventListener("change", evt => {
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
            files.loadFromSource(new Uint8Array(event.target.result));
            ui.setWindowTitle(file.name);
            document.activeElement.blur();
            state.file.name = file.name;
            state.file.remote_name = "";
            URIHashControl.update();
          }
        };

        reader.readAsArrayBuffer(file);
      });
    });

    const bindings = {
      "button-load": () => {
        var filename = document.getElementById("file-list").value;
        files.loadLocal(filename);
      },
      "button-delete": () => {
        var filename = document.getElementById("file-list").value;
        files.deleteFile(filename);
      },
      "button-line-numbers": () => {
        contentBrowser.hide();
        lineNumbers.toggleLineNumbers();
      },
      "button-goto-line": () => {
        contentBrowser.hide();
        ui.showGotoLinePrompt();
      },
      "button-search": () => {
        if (state.search.active) {
          search.deactivateSearchField();
        } else {
          contentBrowser.hide();
          search.activateSearchField();
        }
      },
      "button-content": () => contentBrowser.toggle(),
      "button-open-copy": () => ui.duplicateWindow()
    };

    Object.entries(bindings).forEach(([id, handler]) => {
      document.getElementById(id).addEventListener("click", handler);
    });
  }

  async mobileInit() {
    return new Promise((resolve, reject) => {
      // add mobile css
      var style = document.createElement("link");
      style.rel = "stylesheet";
      style.type = "text/css";
      style.href = this.config.mobile_style_url;
      style.onload = resolve;
      style.onerror = reject;
      document.head.appendChild(style);
    });
  }

  mobileEventsInit() {
    const { mobileUI, contentBrowser, state, ui, lineNumbers } = this;

    var actionDefs = {
      "mobile-menu-close": () => mobileUI.closeMenu(),
      "mobile-menu-open": () => mobileUI.openMenu(),
      "mobile-open-file": () => {
        document.getElementById("file-select").click();
        // Delay menu closing.
        //
        // File manager will pop up with some delay.
        // It's confusing/annoying when menu just disappears entirely
        // before file manager appears.
        //
        // TODO: add preloader animation here?
        setTimeout(() => mobileUI.closeMenu(), 1000);
      },
      "close-content-list-mobile": () => {
        contentBrowser.hide();
        if (state.is_mobile) {
          mobileUI.openMenu(false);
        }
      },
      "mobile-toggle-lines": () => {
        lineNumbers.toggleLineNumbers();
        mobileUI.closeMenu();
      },
      "mobile-list-content": () => {
        mobileUI.closeMenu();
        contentBrowser.show();
      },
      "mobile-goto-line": () => {
        ui.showGotoLinePrompt();
        mobileUI.closeMenu();
      }
    };

    Object.entries(actionDefs).forEach(([id, func]) => {
      document.getElementById(id).addEventListener("click", func);
    });
  }

  canvasInit() {
    const { state, render, config, selection } = this;

    var canvas = document.getElementById("canvas");
    canvas.addEventListener("mousedown", event => {
      var rect = canvas.getBoundingClientRect(),
        selStartRealX = event.pageX - rect.left,
        selStartRealY = event.pageY - rect.top;
      state.selection.x1 =
        state.screen.x + Math.round(selStartRealX / config.font_width);
      state.selection.y1 =
        state.screen.y + Math.round(selStartRealY / config.font_height);
      state.selection.started = true;
      state.selection.set = false;
      render.update();
      event.preventDefault();
    });

    const canvasMouseMove = event => {
      if (state.selection.started) {
        var canvas = document.getElementById("canvas"),
          rect = canvas.getBoundingClientRect(),
          selStartRealX = event.pageX - rect.left,
          selStartRealY = event.pageY - rect.top;
        state.selection.x2 =
          state.screen.x + Math.round(selStartRealX / config.font_width);
        state.selection.y2 =
          state.screen.y + Math.round(selStartRealY / config.font_height);
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

    canvas.addEventListener("mousemove", canvasMouseMove);
    canvas.addEventListener("mouseup", event => {
      canvasMouseMove(event);
      try {
        // catching 'Discontinuous selection is not supported' error in chromium
        var mime = "text/plain";
        var range = document.createRange();
        window.getSelection().addRange(range);
        state.selection.started = false;
      } catch (e) {
        console.log(e);
      }
    });

    document.addEventListener("copy", event => {
      var selectionText = selection.getSelectionText();
      if (selectionText !== null) {
        event.clipboardData.setData("text/plain", selectionText);
        event.preventDefault();
        window.getSelection().removeAllRanges();
        selection.clear();
      }
    });
  }
};
