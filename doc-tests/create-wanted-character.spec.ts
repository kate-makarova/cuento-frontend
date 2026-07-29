import { test } from '@playwright/test';

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:4200';
const API_URL = 'http://localhost:8080';
const SCREENSHOT_DIR = 'docs/create-wanted-character';

const MOCK_BOARD = {
  name: 'Viper\'s Test', use_rating_system: 'y', site_max_rating: 'L3V3S3',
  total_post_number: 0, total_topic_number: 0, total_episode_post_number: 0,
  total_member_number: 0, posts_per_page: 15,
};

const MOCK_TEMPLATE = [
  { machine_field_name: 'species', label: 'Species', order: 1, content_field_type: 'text', field_type: 'text', required: false },
  { machine_field_name: 'description', label: 'Description', order: 2, content_field_type: 'textarea', field_type: 'text', required: false },
];

const MOCK_FACTIONS = [
  { id: 1, name: 'House Harkonnen', parent_id: null, level: 0, description: '', icon: null, show_on_profile: true, faction_status: 0, children: [] },
  { id: 2, name: 'House Atreides', parent_id: null, level: 0, description: '', icon: null, show_on_profile: true, faction_status: 0, children: [] },
];

const MOCK_CHARACTERS = [
  { id: 6, name: 'Feyd-Rautha Harkonnen', avatar: null },
];

test('create wanted character', async ({ page }) => {
  await page.route(`${API_URL}/board/info`, route => route.fulfill({ json: MOCK_BOARD }));
  await page.route(`${API_URL}/template/wanted_character/get`, route => route.fulfill({ json: MOCK_TEMPLATE }));
  await page.route(`${API_URL}/wanted-character/tree-list`, route => route.fulfill({ json: MOCK_FACTIONS }));
  await page.route(`${API_URL}/character-autocomplete/**`, route => {
    const term = route.request().url().split('character-autocomplete/')[1];
    route.fulfill({ json: term ? [...MOCK_CHARACTERS] : [] });
  });
  await page.route(`${API_URL}/wanted-character/create`, route =>
    route.fulfill({ json: { id: 42 } })
  );

  // --- Screenshot 1: empty form ---
  await page.goto(`${BASE_URL}/wanted-character-create?fid=10`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-empty-form.png`, fullPage: true });

  // --- Fill in character name ---
  await page.locator('input[name="req_name"]').fill('Vladimir Harkonnen');

  // --- Screenshot 2: name filled ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-name-filled.png`, fullPage: true });

  // --- Add a related character ---
  const relationInput = page.locator('fieldset').filter({ hasText: 'Related characters' }).locator('input[type="text"]').first();
  await relationInput.fill('Feyd');
  await page.waitForSelector('ul.autocomplete-list li', { state: 'visible' });
  await page.locator('ul.autocomplete-list li').first().click();

  // --- Screenshot 3: related character added ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-with-relation.png`, fullPage: true });

  // --- Submit ---
  await page.locator('input[name="submit"]').click();
  await page.waitForURL(`**/viewtopic/42`);

  // --- Screenshot 4: redirected to topic page ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-after-submit.png`, fullPage: true });
});
