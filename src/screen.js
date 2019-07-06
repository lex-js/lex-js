/* global module */

module.exports = class Screen {
  constructor(app) {
    this.app = app;
    this.h = 0;
    this.w = 0;
  }

  getViewportSize() {
    return {
      w: window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth,
      h: window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight
    };
  }

  update() {
    const { state, config, render } = this.app;
    const viewport = this.getViewportSize();
    const canvas = document.getElementById("canvas");

    const hShift = state.is_mobile ? (
      document.getElementById('block-bottom').getBoundingClientRect().height
    ) : (
        document.getElementById('block-top').getBoundingClientRect().height +
        document.getElementById('block-bottom').getBoundingClientRect().height
      );

    this.h = Math.ceil((viewport.h - hShift) / config.font_height);
    this.w = Math.ceil(viewport.w / config.font_width);
    const realHeight = Math.ceil(viewport.h - hShift);
    canvas.height = realHeight;
    canvas.width = Math.ceil(viewport.w);
    document.getElementById('canvas-container').style.height = realHeight + 'px';
    document.getElementById('canvas-scroll-container').style.height = realHeight + 'px';
    render.resetState();
  }
};
