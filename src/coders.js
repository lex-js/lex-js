const { charToByteCP866, byteToCharCP866 } = require('./cp866.js');

/** Encoders & decoders.

 */
module.exports = {
  Uint8ArrayToString: function (ui8arr) {
    return Array.prototype.map
      .call(ui8arr, b => byteToCharCP866[b])
      .join('');
  },

  stringToUint8Array: function (string) {
    return new Uint8Array(string.split("").map(c => charToByteCP866[c]));
  },

  Uint8Array2BinArray: function (uarr) {
    const result = [];
    uarr.forEach(byte => {
      let ix = 128;
      while (ix !== 0) {
        result.push(byte & ix);
        ix = ix >> 1;
      }
    });
    return result;
  },

  binArray2String: function (arr) {
    let byteSize = 8, // size of one byte in bits
        result = '',
        arrlen = arr.length;

    while (arr.length % byteSize) {
      arr.push(0);
    }

    for (let i = 0; i < arr.length; ) {
      let b = '';
      while (b.length < byteSize) {
        if (typeof arr[i] == 'undefined') {
          break;
        }
        b += arr[i];
        i++;
      }

      let c = parseInt(b, 2);
      result += String.fromCharCode(c);
    }

    return arrlen + ':' + result;
  },

  string2BinArray: function (string) {
    let byteLength = 8,
        arrlen = string.substr(0, string.indexOf(':')) * 1,
        result = [],
        charCode,
        bits;

    string = string.substr(string.indexOf(':') + 1);

    string.split("").forEach(char => {
      charCode = char.charCodeAt(0);

      bits = charCode
        .toString(2)
        .split("")
        .map(x => Number(x));

      // prepend with zeros
      new Array(byteLength - bits.length).fill(0)
        .forEach(bit => result.push(bit));

      bits.forEach(bit => result.push(bit));
    });

    return result;
  }
};
