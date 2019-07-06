(function () {
  window.fetch = function (url, options) {
    options = options || {};

    return new Promise(function (resolve, reject) {
      var request = new XMLHttpRequest();
      request.open(options.method || "get", url, true);

      var optHeaders = Object.entries(options.headers || {});
      for (var i = 0; i < optHeaders.length; i++) {
        request.setRequestHeader(optHeaders[i][0], optHeaders[i][1]);
      }

      request.withCredentials = options.credentials == "include";

      request.onload = function () {
        resolve(response());
      };

      request.onerror = reject;
      request.send(options.body || null);

      function response() {
        var _keys = [],
          all = [],
          headers = {},
          header;

        request
          .getAllResponseHeaders()
          .replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm, function (match, key, value) {
            _keys.push((key = key.toLowerCase()));

            all.push([key, value]);
            header = headers[key];
            headers[key] = header
              ? "".concat(header, ",").concat(value)
              : value;
          });

        return {
          ok: ((request.status / 100) | 0) == 2,
          status: request.status,
          statusText: request.statusText,
          url: request.responseURL,
          clone() {
            return response();
          },
          text() {
            return Promise.resolve(request.responseText);
          },
          json() {
            return Promise.resolve(JSON.parse(request.responseText));
          },
          blob() {
            return Promise.resolve(new Blob([request.response]));
          },
          arrayBuffer() {
            function blobToArrayBuffer(blob) {
              var fileReader = new FileReader();

              return new Promise(function (resolve, reject) {
                fileReader.onload = resolve;
                fileReader.onerror = reject;
                fileReader.readAsArrayBuffer(blob);
              });
            }

            return blobToArrayBuffer(new Blob([request.response]));
          },
          headers: {
            keys: function keys() {
              return _keys;
            },
            entries: function entries() {
              return all;
            },
            get: function get(n) {
              return headers[n.toLowerCase()];
            },
            has: function has(n) {
              return headers.hasOwnProperty(n.toLowerCase());
            }
          }
        };
      }
    });
  };
})();
