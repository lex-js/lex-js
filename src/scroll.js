module.exports = class Scroll {
  constructor (app) {
    this.app = app;
    this.container = document.getElementById('canvas-scroll-container');
    this.container.addEventListener('scroll', () => this.fromScrollBar());
  }

  get x () {
    return (
      Math.floor(this.container.scrollLeft / this.app.config.font_width)
    );
  }

  set x (value) {
    const { screen, state, config, scroll } = this.app;
    const { index } = state;

    const maxXScroll = index.maxlen - screen.w;

    if (value > maxXScroll) {
      value = maxXScroll;
    }

    if (value < 0) {
      this.x = 0;
    }

    this.container.scrollLeft = Math.floor(value * config.font_width);
  }

  get y () {
    return (
      Math.floor(this.container.scrollTop / this.app.config.font_height)
    );
  }

  set y (value) {
    const { screen, state, config, scroll } = this.app;
    const { file } = state;
    const fileHeight = file.lines.length;

    if (value < 0) {
      value = 0;
    } else if (screen.h > fileHeight) {
      const maxYScroll = fileHeight - screen.h;

      if (value > maxYScroll) {
        value = maxYScroll;
      }
    }

    this.container.scrollTop = Math.floor(value * config.font_height);
  }

  fromScrollBar () {
    const dx = this.container.scrollLeft;
    const dy = this.container.scrollTop;
    const { config, screen, render, URIHashControl } = this.app;

    document.getElementById('canvas-container').style.transform = (
      'translate(' + dx + 'px, ' + dy + 'px)'
    );

    render.update();
    URIHashControl.update();
  }

  toBeginning () {
    this.y = 0;
    this.update();
  }

  toEnd () {
    this.y = this.app.state.file.lines.length - this.app.screen.h;
    this.update();
  }

  moveY (value) {
    this.y += value;
    this.update();
  }

  moveX (value) {
    this.x += value;
    this.update();
  }

  update () {
    const { state, config } = this.app;
    const height = state.file.lines.length;
    const width = state.index.maxlen;
    document.getElementById('canvas-large-container').style.height = (
      height * config.font_height + 'px'
    );
    document.getElementById('canvas-large-container').style.width = (
      width * config.font_width + 'px'
    );
  }
}
