import { test } from '@playwright/test';

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:4200';
const API_URL = 'http://localhost:8080';
const SCREENSHOT_DIR = 'docs/create-episode';

const MOCK_BOARD = {
  name: 'Viper\'s Test', use_rating_system: 'y', site_max_rating: 'L3V3S3',
  total_post_number: 0, total_topic_number: 0, total_episode_post_number: 0,
  total_member_number: 0, posts_per_page: 15,
};

const MOCK_TEMPLATE = [
  { machine_field_name: 'location', label: 'Location', order: 1, content_field_type: 'text', field_type: 'text', required: false },
  { machine_field_name: 'description', label: 'Short description', order: 2, content_field_type: 'textarea', field_type: 'text', required: false },
];

const MOCK_WARNINGS = [
  { id: 1, name: 'Dark themes', rating_language: 0, rating_violence: 1, rating_sex: 0 },
  { id: 2, name: 'Gore', rating_language: 0, rating_violence: 3, rating_sex: 0 },
];

const MOCK_CHARACTERS = [
  { id: 6, name: 'Feyd-Rautha Harkonnen', avatar: null },
  { id: 9, name: 'Piter de Vries', avatar: null },
];

test('create episode', async ({ page }) => {
  await page.route(`${API_URL}/board/info`, route => route.fulfill({ json: MOCK_BOARD }));
  await page.route(`${API_URL}/template/episode/get`, route => route.fulfill({ json: MOCK_TEMPLATE }));
  await page.route(`${API_URL}/standard-warnings`, route => route.fulfill({ json: MOCK_WARNINGS }));
  await page.route(`${API_URL}/subforum/list-short`, route => route.fulfill({ json: [] }));
  // Always return a fresh array so Angular's signal equality check always detects a change
  await page.route(`${API_URL}/character-autocomplete/**`, route => {
    const term = route.request().url().split('character-autocomplete/')[1];
    route.fulfill({ json: term ? [...MOCK_CHARACTERS] : [] });
  });
  await page.route(`${API_URL}/episode/create`, route =>
    route.fulfill({ json: { id: 101, name: '[27.06.10199] You did what now?' } })
  );

  // --- Screenshot 1: empty form ---
  await page.goto(`${BASE_URL}/episode-create?fid=4`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-empty-form.png`, fullPage: true });

  // --- Fill in subject ---
  await page.locator('input[name="req_subject"]').fill('[27.06.10199] You did what now?');

  // --- Add characters via autocomplete (scope to Characters fieldset to avoid
  //     collision with the Masks section which uses the same CSS class) ---
  const charSection = page.locator('.inputfield').filter({ hasText: 'Characters' });
  const charInput = charSection.locator('input[placeholder="Search characters..."]').first();
  await charInput.fill('Feyd');
  await page.waitForSelector('ul.autocomplete-list li', { state: 'visible' });
  await page.locator('ul.autocomplete-list li').first().click();

  await page.locator('button.button', { hasText: 'Add character' }).click();
  const charInput2 = charSection.locator('input[placeholder="Search characters..."]').nth(1);
  await charInput2.fill('Piter');
  await page.waitForSelector('ul.autocomplete-list li', { state: 'visible' });
  await page.locator('ul.autocomplete-list li').first().click();

  // --- Screenshot 2: form filled with subject and characters ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-filled-form.png`, fullPage: true });

  // --- Set rating (select by visible label, not value, because Angular uses [ngValue]) ---
  await page.locator('select[name="rating_language"]').selectOption({ label: 'L1' });
  await page.locator('select[name="rating_violence"]').selectOption({ label: 'V2' });

  // --- Add a content warning ---
  await page.locator('select[name="warning_select"]').selectOption({ label: 'Dark themes' });
  await page.locator('button.button', { hasText: /^Add$/ }).click();

  // --- Screenshot 3: rating and warning filled ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-rating-and-warnings.png`, fullPage: true });

  // --- Submit ---
  await page.locator('input[name="submit"]').click();
  await page.waitForURL(`**/viewforum/4`);

  // --- Screenshot 4: redirected back to subforum ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-after-submit.png`, fullPage: true });
});
