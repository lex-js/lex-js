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
const ServerMock = require('../server/mock.js');

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
  port: 1337,
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
  let port = config.port;
  return () => {
    // If we are running the tests sequentially, same port can be used.
    if (runSequentially) {
      return port;
    } else {
      return port++;
    }
  };
})();

const startServer = async (serverConfig) => {
  const server = new ServerMock(
    Object.assign(config, { port: requestFreePort() }, serverConfig),
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

runTest('Local file selection', withPage(async (t, page, server) => {
  // Wait until preloader is hidden.
  await page.waitForSelector('#preloader', { hidden: true });

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

  await fileSelect.uploadFile('./src/ui.js', './src/scroll.js');

  // #file-list becomes visible
  await page.waitForSelector('#file-list', { visible: true });
  await page.waitForSelector('#button-load', { visible: true });
  await page.waitForSelector('#button-delete', { visible: true });

  // files are sorted alphabetically.
  t.deepEqual(await getFiles(), [ 'scroll.js', 'ui.js' ]);
}));

runTest(
  'Update screenshot',
  withPage(
    async (t, page, server) => {
      await page.waitForSelector('#preloader', { hidden: true });
      await page.screenshot({path: 'preview.png'});
    },
    { defaultViewport: { width: 500, height: 480 }}
  )
);
