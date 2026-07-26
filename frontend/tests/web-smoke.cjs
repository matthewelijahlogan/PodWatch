const { chromium } = require('playwright');

const EDGE_PATH = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = process.env.PODWATCH_WEB_URL || 'http://127.0.0.1:5055';

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EDGE_PATH });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.locator('.channel-card').first().waitFor();
    assert(await page.locator('.channel-card').count() === 6, 'Guide did not render six channels');

    await page.getByRole('button', { name: 'Discover' }).click();
    await page.locator('.podcast-card').first().waitFor();
    assert((await page.locator('.podcast-card').count()) >= 20, 'Discover did not render podcasts');

    await page.getByRole('button', { name: 'Categories' }).click();
    await page.locator('.category-card').first().waitFor();
    assert((await page.locator('.category-card').count()) >= 7, 'Categories did not render');

    await page.getByRole('button', { name: /Comedy Open guide/ }).click();
    await page.locator('.channel-card').first().waitFor();
    assert(new URL(page.url()).hash === '#guide', 'Category did not navigate to guide');

    await page.getByRole('button', { name: 'Editor’s Picks' }).click();
    await page.locator('.podcast-card').first().waitFor();
    assert((await page.locator('.podcast-card').count()) >= 1, 'Editor picks did not render');

    await page.getByRole('button', { name: 'About' }).click();
    assert(await page.locator('.about-card').count() === 3, 'About cards did not render');

    await page.getByRole('button', { name: 'Guide' }).click();
    await page.locator('.episode-button').first().waitFor();
    await page.locator('.episode-button').first().click();
    await page.locator('#playerDialog[open]').waitFor();
    const playerSource = await page.locator('#playerFrame').getAttribute('src');
    assert(playerSource && playerSource.includes('youtube'), 'Player did not receive a YouTube embed');

    await page.getByRole('button', { name: 'Close player' }).click();
    assert(!(await page.locator('#playerDialog').getAttribute('open')), 'Player did not close');

    await page.locator('#searchInput').fill('no-match-on-purpose');
    await page.getByText('No guide matches').waitFor();
    await page.locator('#searchInput').fill('');
    await page.locator('.channel-card').first().waitFor();

    await page.getByRole('button', { name: 'Refresh guide' }).click();
    await page.locator('.channel-card').first().waitFor();

    assert(errors.length === 0, `Browser errors detected: ${errors.join(' | ')}`);
    console.log('WEB_SMOKE_OK');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
