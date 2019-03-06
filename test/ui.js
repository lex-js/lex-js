const path = require('path');
const test = require('ava');
const puppeteer = require('puppeteer');
const ServerMock = require('../server/mock.js');


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

const serverRootDir = path.join(__dirname, '..');

const startServerMock = async (mockConfig) => {
  const serverMock = new ServerMock(
    Object.assign(config, mockConfig),
    serverRootDir,
    serverRootDir
  );
  await serverMock.start();
  return serverMock;
};

const mkOptions = options => {

  if (process.env.PUPPETER_INSPECT) {
    options.headless = false;
  }

  if (process.env.PUPPETER_SLOWMO) {
    options.slowMo = Number(process.env.PUPPETER_SLOWMO);
  }

  return options;
};

test.serial('Local file selection', async t => {
  try {
    const options = mkOptions({
      defaultViewport: {
        width: 1024,
        height: 768
      }
    });

    const serverMock = await startServerMock();

    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${config.port}/`);
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

    await serverMock.stop();

    await browser.close();

    t.pass();
  } catch (e) {
    t.fail(e);
  }
});

test.serial('Update screenshot', async t => {
  const serverMock = await startServerMock();
  const browser = await puppeteer.launch({ defaultViewport: { width: 500, height: 480 }});
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${config.port}/`);
  await page.waitForSelector('#preloader', { hidden: true });
  await page.screenshot({path: 'preview.png'});
  await browser.close();
  await serverMock.stop();
  t.pass();
});
