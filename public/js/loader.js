(function () {
  function addScript(src) {
    var script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.setAttribute('async', false);
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

  if (document.location.protocol === 'file:') {
    addScript('public/startPage/fonts.js');
  }

  addScript('public/startPage/info.js');
  addScript('public/js/configOverride.js');
  addScript('public/js/bundle.min.js');
})();
