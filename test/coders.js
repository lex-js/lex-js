const test = require('ava');
const puppeteer = require('puppeteer');

const { Uint8ArrayToString, stringToUint8Array, binArray2String,
        string2BinArray } = require('../src/coders.js');

const strings = [ '',
                  'a',
                  'abcdef',
                ];

test('conversion between bytearrays and strings', t => {
  strings.forEach(str => {
    t.is(Uint8ArrayToString(stringToUint8Array(str)), str, str);
  });
});

test('conversion between binary arrays and strings', t => {
  [ [0],
    [1],
    [0, 1],
    [1, 0],
    [0, 0, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1,
     0, 1, 0, 1, 1, 0],
    [1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0,
     1, 0, 1, 1, 0],
    [1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0,
     1, 1, 0, 1, 0, 1, 1, 0]
  ].forEach(binArr => {
    t.deepEqual(string2BinArray(binArray2String(binArr)), binArr);
  });

  strings.forEach(str => {
    t.is(binArray2String(string2BinArray(str)), str.length * 8 + ':' + str, str);
  });
});

test('headless chrome instantiation', async t => {
  try {
    const browser = await puppeteer.launch();
    await browser.close();

    t.pass();
  } catch {
    t.fail();
  }
});
