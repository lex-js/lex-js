~function () {
  function addScript (src) {
    var script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    document.head.appendChild(script);
  }
  if (typeof Object.entries != 'function') {
    addScript('public/startPage/entries.js');
  }

  // Insert preloaded fonts & file.
  if (document.location.protocol === 'file:') {
    addScript('public/startPage/fonts.js');
    addScript('public/startPage/info.js');
  }

  // Insert polyfills
  if (typeof Promise === 'undefined') {
    addScript('public/js/promise.js');
  }

  if (typeof window.fetch === 'undefined') {
    addScript('public/js/fetch.js');
  }
}();
