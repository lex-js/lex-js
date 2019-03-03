/** Attach runtime state of the app to the app object. */
module.exports = app => {
  app.state = {
    is_mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      (navigator || {}).userAgent || ""
    ),
    fonts: app.config.fonts.map(() => {
      bitmaps: {
      }
    }),
    file: {
      name: "",
      // Remote file path of currently opened file (empty if file is local)
      // Used at URIHashControl
      remote_name: "",
      lines: [[]]
    },
    index: {
      lines: []
    },
    search: {
      active: false,
      regexp: false,
      mode: app.config.search_mode,
      string: "",
      results: [],
      activeResult: 0
    },
    selection: {
      set: false,
      start: false,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0
    },
    screen: {
      x: 0,
      y: 0,
      w: 140,
      h: 10
    },
    numbers: {
      set: app.config.show_line_numbers,
      width: 0
    },
    content_list: {
      path: "",
      active: false
    },
    hash_timeout: null,
    top_bar_shown: true
  };
};
