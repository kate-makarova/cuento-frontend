import { test } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:4200';
const API_URL = 'http://localhost:8080';
const SCREENSHOT_DIR = 'docs/user-migration';

const migrationJson = readFileSync(join(__dirname, '../tests/data/migration.json'), 'utf-8');

const MOCK_MIGRATION_PENDING = {
  id: 1,
  date_created: '2026-07-28T10:00:00Z',
  user_id: 1,
  status: 0,
  original_topic_id: '57',
  original_topic_title: '[27.06.10199] You did what now?',
  new_topic_id: null,
  original_post_count: 9,
  parsed_post_count: null,
  forum_domain: 'dune.rusff.me',
  data_extraction_urls: [
    'http://dune.rusff.me/api/posts?topic=57&page=1',
  ],
};

const MOCK_MIGRATION_PROCESSED = {
  ...MOCK_MIGRATION_PENDING,
  status: 1,
  parsed_post_count: 9,
  user_character_map: {
    '9': { original_user_id: '9', original_user_name: 'Piter de Vries', character_id: null, character_name: null, user_id: null },
    '6': { original_user_id: '6', original_user_name: 'Feyd-Rautha Harkonnen', character_id: null, character_name: null, user_id: null },
  },
};

const MOCK_PROCESSING_RESULT = {
  found_posts: 9,
  skipped_duplicates: 0,
  all_parsed: true,
  found_users: [
    { original_user_id: '9', original_user_name: 'Piter de Vries', character_id: null, character_name: null, user_id: null },
    { original_user_id: '6', original_user_name: 'Feyd-Rautha Harkonnen', character_id: null, character_name: null, user_id: null },
  ],
};

test('user migration flow', async ({ page }) => {
  // Mock create migration
  await page.route(`${API_URL}/user-data-migration/create-processing`, route =>
    route.fulfill({ json: MOCK_MIGRATION_PENDING })
  );

  // First GET (initial page load if needed) → pending; subsequent GETs (after processing) → processed
  let migrationGetCount = 0;
  await page.route(`${API_URL}/user-data-migration/processing/1`, route => {
    migrationGetCount++;
    route.fulfill({ json: migrationGetCount > 1 ? MOCK_MIGRATION_PROCESSED : MOCK_MIGRATION_PENDING });
  });

  // Mock process endpoint
  await page.route(`${API_URL}/user-data-migration/process-mybb-topic`, route =>
    route.fulfill({ json: MOCK_PROCESSING_RESULT })
  );

  // --- Block 1: Create migration form ---
  await page.goto(`${BASE_URL}/migration-create`);
  await page.waitForLoadState('networkidle');

  await page.locator('#forumDomain').fill('dune.rusff.me');
  await page.locator('#topicId').fill('57');
  await page.locator('#postCount').fill('9');

  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-create-form.png`, fullPage: true });

  // Submit — navigates to /migration/1
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/migration/1');
  await page.waitForLoadState('networkidle');

  // --- Block 2: Migration stats + extraction links ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-migration-stats.png`, fullPage: true });

  // --- Block 3: Process data ---
  await page.locator('textarea.json-textarea').fill(migrationJson);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-process-data.png`, fullPage: true });

  await page.locator('section.processing-block button.button').click();
  await page.waitForLoadState('networkidle');

  // --- Block 4: Processing result + user mapping ---
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-after-processing.png`, fullPage: true });
});
