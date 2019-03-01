module.exports = class TouchControl {
  constructor (app) {
    this.app = app;
    this.ongoingTouches = [];
    this.scrollBuffer = {
      x: 0,
      y: 0
    };
  }

  handleStart (event) {
    event.preventDefault();
    var touches = event.changedTouches;
    for (var i = 0; i < touches.length; i++) {
      this.ongoingTouches.push(this.copyTouch(touches[i]));
    }
  }

  handleMove (event) {
    const { state, config, mobileUI, screen } = this.app;

    event.preventDefault();
    var touches = event.changedTouches;
    for (var i = 0; i < touches.length; i++) {
      var idx = this.ongoingTouchIndexById(touches[i].identifier),
        deltaX = touches[i].pageX - this.ongoingTouches[idx].pageX,
        deltaY = touches[i].pageY - this.ongoingTouches[idx].pageY;
      this.scrollBuffer.x += deltaX;
      this.scrollBuffer.y += deltaY;
      if (idx >= 0) {
        this.ongoingTouches.splice(
          idx,
          1,
          this.copyTouch(touches[i])
        );
      } else {
        // log("can't figure out which touch to continue");
      }

      /* show and hide "open menu" button */
      if (
        this.scrollBuffer.y > config.show_top_bar_delta ||
        state.screen.y === 0
      ) {
        mobileUI.showMenu();
      }
      if (
        this.scrollBuffer.y * -1 > config.hide_top_bar_delta &&
        state.screen.y !== 0
      ) {
        mobileUI.hideMenu();
      }

      if (Math.abs(this.scrollBuffer.y) > config.touch_y_min) {
        screen.scrollY(
          (this.scrollBuffer.y * config.touch_y_speed) /
            config.touch_y_min
        );
        this.scrollBuffer.y = 0;
      }
      if (Math.abs(this.scrollBuffer.x) > config.touch_x_min) {
        screen.scrollX(
          (this.scrollBuffer.x * config.touch_x_speed) /
            config.touch_x_min
        );
        this.scrollBuffer.x = 0;
      }
    }
  }

  handleEnd (event) {
    event.preventDefault();
    var touches = event.changedTouches;
    for (var i = 0; i < touches.length; i++) {
      var idx = this.ongoingTouchIndexById(touches[i].identifier);
      if (idx >= 0) {
        this.ongoingTouches.splice(idx, 1);
      } else {
        log("can't figure out which touch to end");
      }
    }
  }

  ongoingTouchIndexById (idToFind) {
    for (var i = 0; i < this.ongoingTouches.length; i++) {
      var id = this.ongoingTouches[i].identifier;
      if (id == idToFind) {
        return i;
      }
    }
    return -1;
  }

  copyTouch (touch) {
    return {
      identifier: touch.identifier,
      pageX: touch.pageX,
      pageY: touch.pageY
    };
  }
};
