import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalSettingsService } from '../../services/global-settings.service';
import { Setting } from '../../models/Setting';
import { SaveButtonComponent } from '../save-button/save-button.component';

type SaveState = 'idle' | 'loading' | 'success' | 'error';

interface SettingGroup {
  legend: string;
  names: string[];
}

const GENERAL_SETTING_GROUPS: SettingGroup[] = [
  {
    legend: $localize`:@@adminSettings.groupGeneral:General`,
    names: ['site_name', 'domain', 'posts_per_page', 'visual_navlinks_after_header_panel', 'user_avatar_width', 'user_avatar_height'],
  },
  {
    legend: $localize`:@@adminSettings.groupGithub:GitHub`,
    names: ['github_owner', 'github_repo', 'github_branch', 'github_token'],
  },
  {
    legend: $localize`:@@adminSettings.groupAutoArchiving:Auto archiving`,
    names: ['auto_archiving_enabled', 'auto_archiving_days', 'auto_archiving_show_page_link'],
  },
  {
    legend: $localize`:@@adminSettings.groupAi:AI`,
    names: ['ai_name', 'ai_model', 'ai_api_key'],
  },
  {
    legend: $localize`:@@adminSettings.groupClaimsFactions:Claims and factions`,
    names: [
      'allow_guests_create_claims',
      'allow_users_create_claims',
      'allow_wanted_for_claims',
      'allow_guests_create_factions',
      'allow_users_create_factions',
      'allow_add_faction',
    ],
  },
];

const ALL_GENERAL_SETTING_NAMES = new Set(GENERAL_SETTING_GROUPS.flatMap(g => g.names));

const IMAGE_UPLOAD_SETTING_NAMES = new Set([
  'use_image_uploading',
  'image_hosting',
  'imgbb_api_key',
  'use_image_proxy',
  'proxy_cache_size',
]);

const SETTING_LABELS: Record<string, string> = {
  site_name: $localize`:@@adminSettings.site_name:Site name`,
  domain: $localize`:@@adminSettings.domain:Domain`,
  posts_per_page: $localize`:@@adminSettings.posts_per_page:Posts per page`,
  visual_navlinks_after_header_panel: $localize`:@@adminSettings.visual_navlinks_after_header_panel:Render navlinks after header panel`,
  user_avatar_width: $localize`:@@adminSettings.user_avatar_width:Avatar width`,
  user_avatar_height: $localize`:@@adminSettings.user_avatar_height:Avatar height`,

  github_owner: $localize`:@@adminSettings.github_owner:Owner`,
  github_repo: $localize`:@@adminSettings.github_repo:Repository`,
  github_branch: $localize`:@@adminSettings.github_branch:Branch`,
  github_token: $localize`:@@adminSettings.github_token:Token`,

  auto_archiving_enabled: $localize`:@@adminSettings.auto_archiving_enabled:Enabled`,
  auto_archiving_days: $localize`:@@adminSettings.auto_archiving_days:Days until archiving`,
  auto_archiving_show_page_link: $localize`:@@adminSettings.auto_archiving_show_page_link:Show page link`,

  ai_name: $localize`:@@adminSettings.ai_name:Name`,
  ai_model: $localize`:@@adminSettings.ai_model:Model`,
  ai_api_key: $localize`:@@adminSettings.ai_api_key:API key`,

  allow_guests_create_claims: $localize`:@@adminSettings.allow_guests_create_claims:Allow guests to create claims`,
  allow_users_create_claims: $localize`:@@adminSettings.allow_users_create_claims:Allow users to create claims`,
  allow_wanted_for_claims: $localize`:@@adminSettings.allow_wanted_for_claims:Allow wanted characters for claims`,
  allow_guests_create_factions: $localize`:@@adminSettings.allow_guests_create_factions:Allow guests to create factions`,
  allow_users_create_factions: $localize`:@@adminSettings.allow_users_create_factions:Allow users to create factions`,
  allow_add_faction: $localize`:@@adminSettings.allow_add_faction:Allow adding factions at character creation`,

  use_image_uploading: $localize`:@@adminSettings.use_image_uploading:Enable image uploading`,
  image_hosting: $localize`:@@adminSettings.image_hosting:Image hosting`,
  imgbb_api_key: $localize`:@@adminSettings.imgbb_api_key:ImgBB API key`,
  use_image_proxy: $localize`:@@adminSettings.use_image_proxy:Use image proxy`,
  proxy_cache_size: $localize`:@@adminSettings.proxy_cache_size:Proxy cache size (MB)`,
};

@Component({
  selector: 'app-admin-settings',
  imports: [CommonModule, FormsModule, SaveButtonComponent],
  standalone: true,
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css'
})
export class AdminSettingsComponent implements OnInit {
  private globalSettingsService = inject(GlobalSettingsService);

  settings = this.globalSettingsService.settings;
  settingLabels = SETTING_LABELS;

  groupSaveStates = GENERAL_SETTING_GROUPS.map(() => signal<SaveState>('idle'));
  imageUploadSaveState = signal<SaveState>('idle');

  get generalSettingGroups(): Array<{ legend: string; settings: Setting[]; saveState: ReturnType<typeof signal<SaveState>> }> {
    const all = this.settings();
    return GENERAL_SETTING_GROUPS
      .map((group, i) => ({
        legend: group.legend,
        saveState: this.groupSaveStates[i],
        settings: group.names
          .map(name => all.find(s => s.setting_name === name))
          .filter((s): s is Setting => s != null),
      }))
      .filter(g => g.settings.length > 0);
  }

  get imageUploadSettings(): Setting[] {
    const order = [...IMAGE_UPLOAD_SETTING_NAMES];
    return this.settings()
      .filter(s => IMAGE_UPLOAD_SETTING_NAMES.has(s.setting_name))
      .map(s => s.setting_name === 'image_hosting' ? { ...s, setting_value: 'imgbb' } : s)
      .sort((a, b) => order.indexOf(a.setting_name) - order.indexOf(b.setting_name));
  }

  ngOnInit() {
    this.globalSettingsService.loadSettings();
  }

  saveGroup(settings: Setting[], saveState: ReturnType<typeof signal<SaveState>>) {
    saveState.set('loading');
    this.globalSettingsService.updateSettings(settings).subscribe({
      next: () => this.flash(saveState, 'success'),
      error: (err) => {
        console.error('Failed to save settings', err);
        this.flash(saveState, 'error');
      }
    });
  }

  saveImageUpload() {
    this.imageUploadSaveState.set('loading');
    this.globalSettingsService.updateSettings(this.imageUploadSettings).subscribe({
      next: () => this.flash(this.imageUploadSaveState, 'success'),
      error: (err) => {
        console.error('Failed to save image upload settings', err);
        this.flash(this.imageUploadSaveState, 'error');
      }
    });
  }

  private flash(state: ReturnType<typeof signal<SaveState>>, value: 'success' | 'error') {
    state.set(value);
    setTimeout(() => state.set('idle'), 3000);
  }
}
