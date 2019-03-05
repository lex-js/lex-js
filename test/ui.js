const test = require('ava');
const puppeteer = require('puppeteer');
const config = require('../config-server.json');

test('Update screenshot', async t => {
  const browser = await puppeteer.launch({ defaultViewport: { width: 500, height: 480 }});
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${config.port}/`);
  await page.waitForSelector('#preloader', { hidden: true });
  await page.screenshot({path: 'preview.png'});
  await browser.close();
  t.pass();
});

test('Local file selection', async t => {
  try {
    const options = {
      defaultViewport: {
        width: 1024,
        height: 768
      },
    };

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

    await browser.close();

    t.pass();
  } catch (e) {
    t.fail(e);
  }
});
