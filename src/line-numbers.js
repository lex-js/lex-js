module.exports = class LineNumbers {
  constructor (app) {
    this.app = app;
  }

  removeLineNumbers () {
    const { config, state, screen, render, search } = this.app;

    for (var i = 0; i < state.file.lines.length; i++) {
      state.file.lines[i] = new Uint8Array(
        Array.prototype.slice
          .call(state.file.lines[i], state.numbers.width + 2)
      );
    }
    state.index.maxlen -= state.numbers.width + config.line_numbers_padding;
    state.numbers.set = false;
    state.numbers.width = 0;
    search.flush();
    screen.checkScrollPosition();
    render.update();
  }

  addLineNumbers () {
    const { config, state, screen, render, search, parser } = this.app;

    state.numbers.width = (state.file.lines.length + "").length + 1;
    state.numbers.set = true;

    for (var i = 0; i < state.file.lines.length; i++) {
      state.file.lines[i] = new Uint8Array(
        parser
          .getLineNumberBytes(i, state.numbers.width)
          .concat(Array.prototype.slice.call(state.file.lines[i]))
      );
    }

    state.index.maxlen += state.numbers.width + config.line_numbers_padding;
    screen.checkScrollPosition();
    search.flush();
    render.update();
  }

  toggleLineNumbers () {
    const { state } = this.app;

    if (state.numbers.set) {
      this.removeLineNumbers();
    } else {
      this.addLineNumbers();
    }
  }
};
