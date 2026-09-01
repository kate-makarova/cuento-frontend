import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import {HomeComponent} from './home/home.component';
import {ViewforumComponent} from './viewforum/viewforum.component';
import {ViewtopicComponent} from './viewtopic/viewtopic.component';
import {DirectChatComponent} from './direct-chat/direct-chat.component';
import {AiChatComponent} from './ai-chat/ai-chat.component';
import {UserProfileComponent} from './user-profile/user-profile.component';
import {TransactionsComponent} from './transactions/transactions.component';
import {CharacterviewComponent} from './characterview/characterview.component';
import {CharacterListComponent} from './character-list/character-list.component';
import {EpisodeListComponent} from './episode-list/episode-list.component';
import {LoginComponent} from './login/login.component';
import {RegisterComponent} from './register/register.component';
import {AdminWrapperComponent} from './admin/admin-wrapper/admin-wrapper.component';
import { AbsenceListComponent } from './absence-list/absence-list.component';
import { AutoArchiveComponent } from './auto-archive/auto-archive.component';
import { ShopComponent } from './shop/shop.component';
import {TopicCreateComponent} from './topic-create/topic-create.component';
import {EpisodeCreateComponent} from './episode-create/episode-create.component';
import {CharacterCreateComponent} from './character-create/character-create.component';
import {PostTopComponent} from './post-top/post-top.component';
import {WantedCharacterCreateComponent} from './wanted-character-create/wanted-character-create.component';
import {WantedCharacterListComponent} from './wanted-character-list/wanted-character-list.component';
import {PreviewComponent} from './preview/preview.component';
import {CharacterProfileEditComponent} from './character-profile-edit/character-profile-edit.component';
import { UserListComponent } from './user-list/user-list.component';
import { SettingsComponent } from './settings/settings.component';
import { ActiveTopicsComponent } from './active-topics/active-topics.component';
import { MaskPageComponent } from './mask-page/mask-page.component';
import { RecoveryCodesComponent } from './recovery-codes/recovery-codes.component';
import { SettingsRestorationCodesComponent } from './settings-restoration-codes/settings-restoration-codes.component';
import { RestorePasswordComponent } from './restore-password/restore-password.component';
import { WipeOutMyUserComponent } from './wipe-out-my-user/wipe-out-my-user.component';
import { adminGuard } from './guards/admin.guard';
import { privateKeyGuard } from './guards/private-key.guard';
import { aiChatGuard } from './guards/ai-chat.guard';
import { CharacterFieldListComponent } from './character-field-list/character-field-list.component';
import { ActiveUsersComponent } from './active-users/active-users.component';
import { SearchComponent } from './search/search.component';
import { PostPageComponent } from './post-page/post-page.component';
import { LorePageComponent } from './lore-page/lore-page.component';
import { LoreNavigationEditComponent } from './lore-navigation-edit/lore-navigation-edit.component';
import { NotFoundComponent } from './error-pages/not-found/not-found.component';
import { ForbiddenComponent } from './error-pages/forbidden/forbidden.component';
import { ServerErrorComponent } from './error-pages/server-error/server-error.component';
import { MigrationListComponent } from './migration-list/migration-list.component';
import { CreateUserDataMigrationComponent } from './create-user-data-migration/create-user-data-migration.component';
import { UserDataMigrationComponent } from './user-data-migration/user-data-migration.component';
import { PuzzlesComponent } from './puzzles/puzzles.component';
import { PuzzleViewComponent } from './puzzle-view/puzzle-view.component';
import { PuzzleAchievementsComponent } from './puzzle-achievements/puzzle-achievements.component';


export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Home page',
    data: { pageId: 'pun-index' }
  },
  {
    path: 'login',
    component: LoginComponent,
    data: { pageId: 'pun-login' }
  },
  {
    path: 'restore-password',
    component: RestorePasswordComponent,
    title: 'Restore Password',
    data: { pageId: 'pun-restore-password' }
  },
  {
    path: 'wipe-out-my-user',
    component: WipeOutMyUserComponent,
    title: 'Delete My Account',
    data: { pageId: 'pun-wipe-out-my-user' }
  },
  {
    path: 'register',
    component: RegisterComponent,
    data: { pageId: 'pun-register' }
  },
  {
    path: 'recovery-codes',
    component: RecoveryCodesComponent,
    title: 'Recovery Codes',
    data: { pageId: 'pun-recovery-codes' }
  },
  {
    path: 'restoration-codes',
    component: SettingsRestorationCodesComponent,
    title: 'Recovery Codes Settings',
    data: { pageId: 'pun-restoration-codes' }
  },
  {
    path: 'direct-chat',
    component: DirectChatComponent,
    canActivate: [privateKeyGuard],
    data: { pageId: 'pun-direct-chat' }
  },
  {
    path: 'ai-chat',
    component: AiChatComponent,
    canActivate: [aiChatGuard],
    title: 'AI Chat',
    data: { pageId: 'pun-ai-chat' }
  },
  {
    path: 'settings',
    component: SettingsComponent,
    title: 'Settings',
    data: { pageId: 'pun-settings' }
  },
  {
    path: 'viewforum/:id',
    component: ViewforumComponent,
    title: 'View Forum',
    data: { pageId: 'pun-viewforum' }
  },
  {
    path: 'topic-create',
    component: TopicCreateComponent,
    title: 'Create Topic',
    data: { pageId: 'pun-create-topic' }
  },
  {
    path: 'lore-topic-create',
    component: TopicCreateComponent,
    title: 'Create Lore Topic',
    data: { pageId: 'pun-create-topic', createEndpoint: 'lore-topic/create' }
  },
  {
    path: 'episode-create',
    component: EpisodeCreateComponent,
    title: 'Create Episode',
    data: { pageId: 'pun-create-episode' }
  },
  {
    path: 'preview',
    component: PreviewComponent,
    title: 'Preview',
    data: { pageId: 'pun-preview' }
  },
  {
    path: 'character-create',
    component: CharacterCreateComponent,
    title: 'Create Character',
    data: { pageId: 'pun-create-character' }
  },
  {
    path: 'wanted-character-create',
    component: WantedCharacterCreateComponent,
    title: 'Create Wanted Character',
    data: { pageId: 'pun-create-wanted-character' }
  },
  {
    path: 'viewtopic/:id',
    component: ViewtopicComponent,
    data: { pageId: 'pun-viewtopic' }
  },
  {
    path: 'post-top/:id',
    component: PostTopComponent,
    title: 'Post Top',
    data: { pageId: 'pun-post-top' }
  },
  {
    path: 'profile/:id',
    component: UserProfileComponent,
    title: 'User Profile',
    data: { pageId: 'pun-profile' }
  },
  {
    path: 'profile/:user_id/transactions',
    component: TransactionsComponent,
    title: 'Transactions',
    data: { pageId: 'pun-transactions' }
  },
  {
    path: 'character/:id',
    component: CharacterviewComponent,
    title: 'Character',
    data: { pageId: 'pun-character' }
  },
  {
    path: 'character-list',
    component: CharacterListComponent,
    title: 'Character List',
    data: { pageId: 'pun-character-list' }
  },
  {
    path: 'character-field-list/:field',
    component: CharacterFieldListComponent,
    title: 'Character Field List',
    data: { pageId: 'pun-character-field-list' }
  },
  {
    path: 'user-list',
    component: UserListComponent,
    title: 'User List',
    data: { pageId: 'pun-user-list' }
  },
  {
    path: 'episode-list',
    component: EpisodeListComponent,
    title: 'Episode List',
    data: { pageId: 'pun-episode-list' }
  },
  {
    path: 'wanted-character-list',
    component: WantedCharacterListComponent,
    title: 'Wanted Characters',
    data: { pageId: 'pun-wanted-character-list' }
  },
  {
    path: 'active-topics',
    component: ActiveTopicsComponent,
    title: 'Active Topics',
    data: { pageId: 'pun-active-topics' }
  },
  {
    path: 'active-users',
    component: ActiveUsersComponent,
    title: 'Active Users',
    data: { pageId: 'pun-active-users' }
  },
  {
    path: 'absence-list',
    component: AbsenceListComponent,
    title: 'Absences',
    data: { pageId: 'pun-absence-list' }
  },
  {
    path: 'auto-archive',
    component: AutoArchiveComponent,
    title: 'Auto Archive',
    data: { pageId: 'pun-auto-archive' }
  },
  {
    path: 'shop',
    component: ShopComponent,
    title: 'Shop',
    data: { pageId: 'pun-shop' }
  },
  {
    path: 'character-profile-update/:id',
    component: CharacterProfileEditComponent,
    title: 'Update Character Profile',
    data: { pageId: 'pun-character-profile-update' }
  },
  {
    path: 'mask/:id',
    component: MaskPageComponent,
    title: 'Mask',
    data: { pageId: 'pun-mask' }
  },
  {
    path: 'admin',
    component: AdminWrapperComponent,
    canActivate: [adminGuard],
    data: { pageId: 'pun-admin' },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Admin - Dashboard'
      },
      {
        path: 'character-template',
        loadComponent: () => import('./admin/character-template-edit/character-template-edit.component').then(m => m.CharacterTemplateEditComponent),
        title: 'Admin - Character Template'
      },
      {
        path: 'episode-template',
        loadComponent: () => import('./admin/episode-template-edit/episode-template-edit.component').then(m => m.EpisodeTemplateEditComponent),
        title: 'Admin - Episode Template'
      },
      {
        path: 'character-profile-template',
        loadComponent: () => import('./admin/character-profile-template-edit/character-profile-template-edit.component').then(m => m.CharacterProfileTemplateEditComponent),
        title: 'Admin - Character Profile Template'
      },
      {
        path: 'settings',
        loadComponent: () => import('./admin/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent),
        title: 'Admin - Settings'
      },
      {
        path: 'factions',
        loadComponent: () => import('./admin/admin-factions/admin-factions.component').then(m => m.AdminFactionsComponent),
        title: 'Admin - Factions'
      },
      {
        path: 'faction-settings',
        loadComponent: () => import('./admin/admin-faction-settings/admin-faction-settings.component').then(m => m.AdminFactionSettingsComponent),
        title: 'Admin - Faction Settings'
      },
      {
        path: 'faction/:faction_id/free-format-date',
        loadComponent: () => import('./admin/admin-faction-free-format-date/admin-faction-free-format-date.component').then(m => m.AdminFactionFreeFormatDateComponent),
        title: 'Admin - Faction Date Fields'
      },
      {
        path: 'calendars',
        loadComponent: () => import('./admin/admin-calendar-list/admin-calendar-list.component').then(m => m.AdminCalendarListComponent),
        title: 'Admin - Calendars'
      },
      {
        path: 'calendar/:id',
        loadComponent: () => import('./admin/admin-calendar-edit/admin-calendar-edit.component').then(m => m.AdminCalendarEditComponent),
        title: 'Admin - Calendar'
      },
      {
        path: 'permissions',
        loadComponent: () => import('./admin/permission-matrix/permission-matrix.component').then(m => m.PermissionMatrixComponent),
        title: 'Admin - Permissions'
      },
      {
        path: 'character-claims',
        loadComponent: () => import('./admin/character-claims/character-claims.component').then(m => m.CharacterClaimsComponent),
        title: 'Admin - Character Claims'
      },
      {
        path: 'wanted-character-template',
        loadComponent: () => import('./admin/wanted-character-template-edit/wanted-character-template-edit.component').then(m => m.WantedCharacterTemplateEditComponent),
        title: 'Admin - Wanted Character Template'
      },
      {
        path: 'subforums',
        loadComponent: () => import('./admin/admin-subforums/admin-subforums.component').then(m => m.AdminSubforumsComponent),
        title: 'Admin - Subforums'
      },
      {
        path: 'topic-commander',
        loadComponent: () => import('./admin/topic-commander/topic-commander.component').then(m => m.TopicCommanderComponent),
        title: 'Admin - Topic Commander'
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent),
        title: 'Admin - Users'
      },
      {
        path: 'characters',
        loadComponent: () => import('./admin/admin-characters/admin-characters.component').then(m => m.AdminCharactersComponent),
        title: 'Admin - Characters'
      },
      {
        path: 'create-user',
        loadComponent: () => import('./admin/admin-create-user/admin-create-user.component').then(m => m.AdminCreateUserComponent),
        title: 'Admin - Create User'
      },
      {
        path: 'widget-panels',
        loadComponent: () => import('./admin/admin-widget-panels/admin-widget-panels.component').then(m => m.AdminWidgetPanelsComponent),
        title: 'Admin - Widget Panels'
      },
      {
        path: 'widget-panels/:key',
        loadComponent: () => import('./admin/admin-widget-panel-edit/admin-widget-panel-edit.component').then(m => m.AdminWidgetPanelEditComponent),
        title: 'Admin - Edit Widget Panel'
      },
      {
        path: 'widgets',
        loadComponent: () => import('./admin/admin-widgets/admin-widgets.component').then(m => m.AdminWidgetsComponent),
        title: 'Admin - Widgets'
      },
      {
        path: 'widget/new',
        loadComponent: () => import('./admin/admin-widget-edit/admin-widget-edit.component').then(m => m.AdminWidgetEditComponent),
        title: 'Admin - Create Widget'
      },
      {
        path: 'widget/:id',
        loadComponent: () => import('./admin/admin-widget-edit/admin-widget-edit.component').then(m => m.AdminWidgetEditComponent),
        title: 'Admin - Edit Widget'
      },
      {
        path: 'design',
        loadComponent: () => import('./admin/admin-design/admin-design.component').then(m => m.AdminDesignComponent),
        title: 'Admin - Design'
      },
      {
        path: 'frontend-templates',
        loadComponent: () => import('./admin/admin-frontend-templates/admin-frontend-templates.component').then(m => m.AdminFrontendTemplatesComponent),
        title: 'Admin - Custom Templates'
      },
      {
        path: 'frontend-templates/component',
        loadComponent: () => import('./admin/admin-component-template/admin-component-template.component').then(m => m.AdminComponentTemplateComponent),
        title: 'Admin - Component Template'
      },
      {
        path: 'frontend-templates/component-default',
        loadComponent: () => import('./admin/admin-component-template/admin-component-template.component').then(m => m.AdminComponentTemplateComponent),
        data: { readonly: true },
        title: 'Admin - Component Template (Default)'
      },
      {
        path: 'additional-navlinks',
        loadComponent: () => import('./admin/admin-additional-navlinks/admin-additional-navlinks.component').then(m => m.AdminAdditionalNavlinksComponent),
        title: 'Admin - Additional Navlinks'
      },
      {
        path: 'features',
        loadComponent: () => import('./admin/admin-features/admin-features.component').then(m => m.AdminFeaturesComponent),
        title: 'Admin - Features'
      },
      {
        path: 'features/currency',
        loadComponent: () => import('./admin/admin-currency/admin-currency.component').then(m => m.AdminCurrencyComponent),
        title: 'Admin - Currency'
      },
      {
        path: 'features/post_top',
        loadComponent: () => import('./admin/admin-post-top/admin-post-top.component').then(m => m.AdminPostTopComponent),
        title: 'Admin - Post Top'
      },
      {
        path: 'features/puzzles',
        loadComponent: () => import('./admin/admin-puzzles/admin-puzzles.component').then(m => m.AdminPuzzlesComponent),
        title: 'Admin - Puzzles'
      },
      {
        path: 'features/puzzle/:id',
        loadComponent: () => import('./admin/admin-puzzle-edit/admin-puzzle-edit.component').then(m => m.AdminPuzzleEditComponent),
        title: 'Admin - Edit Puzzle'
      },
      {
        path: 'backup',
        loadComponent: () => import('./admin/admin-backup/admin-backup.component').then(m => m.AdminBackupComponent),
        title: 'Admin - Backup',
        canActivate: [() => {
          const auth = inject(AuthService);
          const router = inject(Router);
          return auth.hasPermission('show_admin_backup') || router.createUrlTree(['/403']);
        }]
      },
      {
        path: 'reactions',
        loadComponent: () => import('./admin/admin-reactions/admin-reactions.component').then(m => m.AdminReactionsComponent),
        title: 'Admin - Reactions'
      },
      {
        path: 'smiles',
        loadComponent: () => import('./admin/admin-smiles/admin-smiles.component').then(m => m.AdminSmilesComponent),
        title: 'Admin - Smiles'
      },
      {
        path: 'search',
        loadComponent: () => import('./admin/admin-search/admin-search.component').then(m => m.AdminSearchComponent),
        title: 'Admin - Search'
      },
      {
        path: 'ai-index',
        loadComponent: () => import('./admin/admin-ai-index/admin-ai-index.component').then(m => m.AdminAiIndexComponent),
        title: 'Admin - AI Index'
      },
      {
        path: 'ai-index-settings',
        loadComponent: () => import('./admin/admin-ai-index-settings/admin-ai-index-settings.component').then(m => m.AdminAiIndexSettingsComponent),
        title: 'Admin - AI Index Settings'
      },
      {
        path: 'ai-agents',
        loadComponent: () => import('./admin/admin-ai-agents/admin-ai-agents.component').then(m => m.AdminAiAgentsComponent),
        title: 'Admin - AI Agents'
      },
      {
        path: 'ai-agents/:id',
        loadComponent: () => import('./admin/admin-ai-agent/admin-ai-agent.component').then(m => m.AdminAiAgentComponent),
        title: 'Admin - AI Agent'
      },
      {
        path: 'ai-agent-implementation/:id',
        loadComponent: () => import('./admin/admin-ai-agent-implementation-edit/admin-ai-agent-implementation-edit.component').then(m => m.AdminAiAgentImplementationEditComponent),
        title: 'Admin - AI Agent Implementation'
      },
      {
        path: 'design-drafts',
        loadComponent: () => import('./admin/admin-design-drafts/admin-design-drafts.component').then(m => m.AdminDesignDraftsComponent),
        title: 'Admin - Design Drafts'
      },
      {
        path: 'design-drafts/:id',
        loadComponent: () => import('./admin/admin-design-draft-edit/admin-design-draft-edit.component').then(m => m.AdminDesignDraftEditComponent),
        title: 'Admin - Edit Design Draft'
      },
      {
        path: 'external-apps',
        loadComponent: () => import('./admin/admin-external-apps/admin-external-apps.component').then(m => m.AdminExternalAppsComponent),
        title: 'Admin - External Apps'
      },
      {
        path: 'external-app/:id',
        loadComponent: () => import('./admin/admin-external-app-edit/admin-external-app-edit.component').then(m => m.AdminExternalAppEditComponent),
        title: 'Admin - External App'
      }
    ]
  },
  {
    path: 'puzzles',
    component: PuzzlesComponent,
    title: 'Puzzles',
    data: { pageId: 'pun-puzzles' }
  },
  {
    path: 'puzzle/:id',
    component: PuzzleViewComponent,
    title: 'Puzzle',
    data: { pageId: 'pun-puzzle' }
  },
  {
    path: 'user/:id/puzzle-achievements',
    component: PuzzleAchievementsComponent,
    title: 'Puzzle Achievements',
    data: { pageId: 'pun-puzzle-achievements' }
  },
  {
    path: 'migration-list',
    component: MigrationListComponent,
    title: 'User Data Migrations',
    data: { pageId: 'pun-migration-list' }
  },
  {
    path: 'migration-create',
    component: CreateUserDataMigrationComponent,
    title: 'Create Migration',
    data: { pageId: 'pun-migration-create' }
  },
  {
    path: 'migration/:id',
    component: UserDataMigrationComponent,
    title: 'User Data Migration',
    data: { pageId: 'pun-migration' }
  },
  {
    path: 'search',
    component: SearchComponent,
    title: 'Search'
  },
  {
    path: 'post-page/:id',
    component: PostPageComponent,
    data: { pageId: 'pun-post-page' }
  },
  {
    path: 'lore/:topicId/page/:postId',
    component: LorePageComponent,
    data: { pageId: 'pun-lore-page' }
  },
  {
    path: 'lore/:id/navigation-edit',
    component: LoreNavigationEditComponent,
    data: { pageId: 'pun-lore-navigation-edit' }
  },
  {
    path: '403',
    component: ForbiddenComponent,
    title: 'Forbidden',
    data: { pageId: 'pun-403' }
  },
  {
    path: '500',
    component: ServerErrorComponent,
    title: 'Server Error',
    data: { pageId: 'pun-500' }
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page Not Found',
    data: { pageId: 'pun-404' }
  }
];
