import { test } from '@playwright/test';

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:4200';
const API_URL = 'http://localhost:8080';
const SCREENSHOT_DIR = 'docs/create-character';

const MOCK_BOARD = {
  name: 'Viper\'s Test', use_rating_system: 'y', site_max_rating: 'L3V3S3',
  total_post_number: 0, total_topic_number: 0, total_episode_post_number: 0,
  total_member_number: 0, posts_per_page: 15,
};

const MOCK_CHARACTER_TEMPLATE = [
  { machine_field_name: 'age', label: 'Age', order: 1, content_field_type: 'text', field_type: 'int', required: false },
  { machine_field_name: 'bio', label: 'Biography', order: 2, content_field_type: 'textarea', field_type: 'text', required: false },
];

const MOCK_FACTIONS = [
  { id: 1, name: 'House Harkonnen', parent_id: null, level: 0, description: '', icon: null, show_on_profile: true, faction_status: 0, children: [] },
  { id: 2, name: 'House Atreides', parent_id: null, level: 0, description: '', icon: null, show_on_profile: true, faction_status: 0, children: [] },
];

const MOCK_WANTED_CHARACTERS = [
  { id: 5, name: 'Piter de Vries (wanted)', is_claimed: false, user_id: null, claim_expiration_date: null },
];

test('create character sheet', async ({ page }) => {
  await page.route(`${API_URL}/board/info`, route => route.fulfill({ json: MOCK_BOARD }));
  await page.route(`${API_URL}/template/character/get`, route => route.fulfill({ json: MOCK_CHARACTER_TEMPLATE }));
  await page.route(`${API_URL}/template/wanted_character/get`, route => route.fulfill({ json: [] }));
  await page.route(`${API_URL}/wanted-character/tree-list`, route => route.fulfill({ json: MOCK_FACTIONS }));
  await page.route(`${API_URL}/wanted-character-autocomplete/**`, route => route.fulfill({ json: MOCK_WANTED_CHARACTERS }));
  await page.route(`${API_URL}/claim-autocomplete/**`, route => route.fulfill({ json: [] }));
  await page.route(`${API_URL}/character/create`, route =>
    route.fulfill({ json: { id: 99 } })
  );

  // --- Screenshot 1: empty form ---
  await page.goto(`${BASE_URL}/character-create?fid=10`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-empty-form.png`, fullPage: true });

  // --- Fill in name and avatar (switch to URL mode first — upload is default) ---
  await page.locator('input[name="req_name"]').fill('Piter de Vries');
  await page.locator('.mode-toggle button', { hasText: 'Use URL' }).click();
  await page.locator('app-image-field input[type="text"]').fill('https://upforme.ru/uploads/001b/ec/ce/566/483395.jpg');

  // --- Screenshot 2: basic fields filled ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-basic-fields.png`, fullPage: true });

  // --- Select claim type: wanted character ---
  await page.locator('input[name="claim_type"][value="wanted"]').click();
  await page.waitForTimeout(100);

  // --- Screenshot 3: claim section expanded ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-claim-section.png`, fullPage: true });

  // --- Search for the wanted character to claim ---
  await page.locator('input[name="claim_query"]').fill('Piter');
  await page.waitForTimeout(400);
  await page.locator('.suggestions-dropdown .suggestion-item').first().click();

  // --- Screenshot 4: claim selected, ready to submit ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-claim-selected.png`, fullPage: true });

  // --- Submit ---
  await page.locator('input[name="submit"]').click();
  await page.waitForURL(`**/viewforum/10`);

  // --- Screenshot 5: redirected to subforum ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/05-after-submit.png`, fullPage: true });
});
