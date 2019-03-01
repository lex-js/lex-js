module.exports = class Screen {
  constructor (app) {
    this.app = app;
  }

  getViewportSize () {
    return {
      w: window.innerWidth ||
        document.documentElement.clientWidth  ||
        document.body.clientWidth,
      h: window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight
    };
  }

  expandScreen () {
    const { state, config, render } = this.app;

    // увеличить размер canvas при изменении размера окна
    var viewport = this.getViewportSize(),
        canvas = document.getElementById("canvas"),
        h_shift = state.is_mobile ? 14 : 64;

    state.screen.h = Math.ceil((viewport.h - h_shift) / config.font_height);
    state.screen.w = Math.ceil(viewport.w / config.font_width);
    canvas.height = Math.ceil(viewport.h - h_shift);
    canvas.width = Math.ceil(viewport.w);
    render.resetState();
  }

  setScrollY (y) {
    const { state, config, screen, render, URIHashControl } = this.app;
    state.screen.y = y;
    screen.checkScrollPosition();
    render.update();
    URIHashControl.update();
  }

  checkScrollPosition () {
    const { state, config } = this.app;

    if (state.screen.x > state.index.maxlen - state.screen.w + config.max_x_scroll) {
      state.screen.x = state.index.maxlen - state.screen.w + config.max_x_scroll;
    }

    if (state.screen.h > state.file.lines.length) {
      // файл не влезает в экран
      if (state.screen.y > state.file.lines.length - state.screen.h) {
        state.screen.y = state.file.lines.length - state.screen.h;
      }
    }

    var maxshift =
      state.screen.h - Math.floor(state.screen.h * config.max_overscroll);

    if (state.screen.y > state.file.lines.length - maxshift) {
      state.screen.y = state.file.lines.length - maxshift;
    }

    if (state.screen.y < 0) {
      state.screen.y = 0;
    }

    if (state.screen.x < 0) {
      state.screen.x = 0;
    }
  }

  scrollHomeY () {
    const { state, render, URIHashControl } = this.app;
    if (state.content_list.active) return;

    state.screen.y = 0;
    render.update();
    URIHashControl.update();

    return 1;
  }

  scrollEndY () {
    const { state, render, URIHashControl, screen } = this.app;
    if (state.content_list.active) return;

    state.screen.y = state.file.lines.length - state.screen.h;
    screen.checkScrollPosition();
    render.update();
    URIHashControl.update();

    return 1;
  }

  scrollX (x) {
    const { state, render, screen } = this.app;
    if (state.content_list.active) return;

    x = Math.round(x);
    state.screen.x -= x;
    screen.checkScrollPosition();
    render.update();
    return 1;
  }

  scrollY (y) {
    const { state, render, URIHashControl, screen } = this.app;
    if (state.content_list.active) return;

    y = Math.round(y);
    state.screen.y -= y;
    screen.checkScrollPosition();
    render.update();
    URIHashControl.update();
    return 1;
  }
};
