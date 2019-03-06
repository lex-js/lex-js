// This test suite can be controlled using environment variables.
//
// Set PUPPETER_SERIAL to run the tests sequentially.
// Note that each of the tests run in parrallel occupy a port on your local
// machine, starting from port 1337, so it's a good idea to set this variable
// if some of the ports are already bound.
//
// Set PUPPETER_INSPECT to turn off headless mode (implies PUPPETER_SERIAL).
//
// Set PUPPETER_SLOWMO to a numeric value to insert a delay between chromium
// API calls.
//
// https://github.com/GoogleChrome/puppeteer/blob/v1.13.0/docs/api.md#puppeteerconnectoptions
const path = require('path');
const test = require('ava');
const puppeteer = require('puppeteer');
const isPortFree_ = require('is-port-free');
const isPortFree = port => isPortFree_(port).then(() => true).catch(() => false);
const ServerMock = require('../server/mock.js');
const defaultConfig = require('../src/config-default.js');

const serverRootDir = path.join(__dirname, '..');

// Read environment variables

// If PUPPETER_INSPECT is set, running the tests in parrallel is stupid.
const runSequentially = process.env.PUPPETER_INSPECT || process.env.PUPPETER_SERIAL;
const runHeadless = !process.env.PUPPETER_INSPECT;
const slowMo = Number(process.env.PUPPETER_SLOWMO) || null;

const config = {
  page_title: 'Lex.js',
  meta:
   { description: 'Lexicon viewer JS port',
     keywords: [ 'lex-js', 'lexicon' ],
     author: 'lex-js' },
  // Private port range is 49152-65535
  port: 49152,
  content_dir: './files',
  allowed_files: [ '**/*.txt', '**/*.c', '**/*.hs' ]
};

function runTest () {
  if (runSequentially) {
    return test.serial(...arguments);
  } else {
    return test(...arguments);
  }
}

const requestFreePort = (() => {
  let startingPort = config.port;
  // `bound` array is used to make impossible the situation where port was
  // acquired by another listener after async `isPortFree` call which returned
  // `true`, and before the returned port was actually bound by the function
  // which requested it.
  //
  // Another process on the same machine may start using the desired port during
  // that timeframe, though. It can't be helped.
  let bound = [];
  return async () => {
    // Copy number to prevent data race
    let currentPort = startingPort;
    for (;;) {
      const isFree = await isPortFree(currentPort);
      if (!bound.includes(currentPort) && isFree) {
        break;
      }
      currentPort++;
    }
    bound.push(currentPort);
    // No need to iterate through the same ports more than once.
    // The range is large, and we don't want this function to have O(n^2)
    // running time (where `n` is the total number of calls to it).
    startingPort = currentPort + 1;
    return currentPort;
  };
})();

const startServer = async (serverConfig) => {
  const port = await requestFreePort();
  const server = new ServerMock(
    Object.assign(config, { port }, serverConfig),
    serverRootDir,
    serverRootDir
  );
  await server.start();
  return server;
};

const mkOptions = options => {
  if (!runHeadless) {
    options.headless = false;
  }

  if (slowMo) {
    options.slowMo = slowMo;
  }

  return options;
};

// See also: "Bracket pattern".
//
// https://wiki.haskell.org/Bracket_pattern
const withPage = (continuation, puppeterOptions = {}, serverOptions = {}) => async t => {
  if (
    typeof continuation !== 'function' ||
    typeof puppeterOptions !== 'object' ||
    typeof serverOptions !== 'object'
  ) {
    throw "withPage: incorrect arguments";
  }

  const server = await startServer(serverOptions);
  const browser = await puppeteer.launch(mkOptions(puppeterOptions));
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.port}/`);

  await continuation(t, page, server);

  await server.stop();
  await browser.close();
  t.pass();
};

const assertURIHash = (t, server, page, hash) => {
  t.is(page.url(), `http://127.0.0.1:${server.port}/${hash ? '#' + hash : ''}`);
};

runTest("Local file selection", withPage(async (t, page, server) => {
  // Wait until preloader is hidden.
  await page.waitForSelector('#preloader', { hidden: true });
  assertURIHash(t, server, page, '');

  // At the beginning, there are no files.
  const cntFiles0 = await page.$eval(
    '#file-list',
    fileList => fileList.childNodes.length
  );
  t.is(cntFiles0, 0);

  // But after selecting a file,
  const fileSelect = await page.$('#file-select');
  await fileSelect.uploadFile('./src/app.js');

  // #file-list becomes visible
  await page.waitForSelector('#file-list', { visible: true });
  await page.waitForSelector('#button-load', { visible: true });
  await page.waitForSelector('#button-delete', { visible: true });

  // and gets a new child node
  const getFiles = () => page.$eval(
    '#file-list',
    fileList => [].map.call(fileList.childNodes, el => el.textContent)
  );

  // with appropriate name.
  t.deepEqual(await getFiles(), [ 'app.js' ]);

  // Now the new file can be deleted.
  (await page.$('#button-delete')).click();

  // #file-list becomes hidden
  await page.waitForSelector('#file-list', { hidden: true });
  await page.waitForSelector('#button-load', { hidden: true });
  await page.waitForSelector('#button-delete', { hidden: true });

  assertURIHash(t, server, page, 'local:app.js:0');

  await fileSelect.uploadFile('./src/ui.js', './src/scroll.js');

  // #file-list becomes visible
  await page.waitForSelector('#file-list', { visible: true });
  await page.waitForSelector('#button-load', { visible: true });
  await page.waitForSelector('#button-delete', { visible: true });

  // files are sorted alphabetically.
  t.deepEqual(await getFiles(), [ 'scroll.js', 'ui.js' ]);

  // the first file is selected.
  t.is(await page.$eval('#file-list', el => el[el.selectedIndex].textContent), 'scroll.js');
}));

runTest("Keyboard navigation", withPage(async (t, page, server) => {
  // Wait until preloader is hidden.
  await page.waitForSelector('#preloader', { hidden: true });

  const fileSelect = await page.$('#file-select');
  await fileSelect.uploadFile('./public/startPage/info.txt');

  // Wait until file is loaded
  await page.waitForSelector('#file-list', { visible: true });
  const scrollContainer = await page.$('#canvas-scroll-container');

  const getScrollTop = () =>
        scrollContainer.getProperty('scrollTop').then(value => value.jsonValue());

  const getScrollLeft = () =>
        scrollContainer.getProperty('scrollLeft').then(value => value.jsonValue());

  assertURIHash(t, server, page, 'local:info.txt:0');

  await page.keyboard.press('ArrowDown');
  t.is(13, await getScrollTop());
  await page.waitForFunction("document.location.hash == '#local:info.txt:1'");

  await page.keyboard.press('ArrowUp');
  t.is(0, await getScrollTop());
  await page.waitForFunction("document.location.hash == '#local:info.txt:0'");

  await page.keyboard.press('PageDown');
  t.is(91, await getScrollTop());
  await page.waitForFunction("document.location.hash == '#local:info.txt:7'");

  await page.keyboard.press('Home');
  t.is(0, await getScrollTop());
  await page.waitForFunction("document.location.hash == '#local:info.txt:0'");

  await page.keyboard.press('End');
  t.is(282, await getScrollTop());
  await page.waitForFunction("document.location.hash == '#local:info.txt:22'");

  await page.keyboard.press('Home');
  t.is(0, await getScrollTop());
  await page.waitForFunction("document.location.hash == '#local:info.txt:0'");

  await page.keyboard.press('ArrowRight');
  t.is(8, await getScrollLeft());

  await page.keyboard.press('ArrowRight');
  t.is(16, await getScrollLeft());
  t.is(0, await getScrollTop());

  await page.keyboard.press('ArrowLeft');
  t.is(8, await getScrollLeft());
  t.is(0, await getScrollTop());
}, {
  // Viewport size is important for this test
  defaultViewport : {
    width: 300,
    height: 200
  }
}));

runTest(
  "Update screenshot",
  withPage(
    async (t, page, server) => {
      await page.waitForSelector('#preloader', { hidden: true });
      await page.screenshot({path: 'preview.png'});
    },
    { defaultViewport: { width: 500, height: 480 }}
  )
);
