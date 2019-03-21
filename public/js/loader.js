(function () {
  function addScript (src) {
    var script = document.createElement('script');
    script.src = src;
    script.setAttribute('async', false);
    script.type = 'text/javascript';
    document.head.appendChild(script);
  }

  // Insert polyfills
  if (typeof Object.entries === 'undefined') {
    addScript('public/js/entries.js');
  }

  if (typeof Promise === 'undefined') {
    addScript('public/js/promise.js');
  }

  if (typeof window.fetch === 'undefined') {
    addScript('public/js/fetch.js');
  }

  // Insert preloaded fonts & file.
  if (document.location.protocol === 'file:') {
    addScript('public/startPage/fonts.js');
    addScript('public/startPage/info.js');
  }

  addScript('public/js/configOverride.js');
  addScript('public/js/bundle.min.js');
})();
