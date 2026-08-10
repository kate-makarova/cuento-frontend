# Notification System

Notifications reach the user through two channels: **WebSocket push** (real-time, while the session is open) and **REST polling** (on page load and tab focus). Both channels funnel into the same Angular signals in `NotificationService`, which drives the badge counter in the header and the toast popup.

---

## Architecture overview

```
Backend
  │
  ├── WebSocket /ws?token=…  ──→  NotificationService.handleNotification()
  │                                    └─→ signals (mentionNotificationsSignal, etc.)
  │                                    └─→ notification$ subject  ──→  ToastComponent
  │                                    └─→ sound$ subject         ──→  ToastComponent (audio)
  │
  └── GET notifications/unread  ──→  NotificationService.loadUnreadNotifications()
                                          └─→ same signals
```

`NotificationService` is `providedIn: 'root'` — a singleton shared across the entire app.

---

## Notification types

Defined in `NotificationData.type` (`src/app/models/event.ts`):

| Type | Description | Signal |
|---|---|---|
| `system` | Admin/system message | `systemNotifications` |
| `game` | New post in a game topic the user participates in | `gameNotifications` |
| `mention` | Another user mentioned this user in a post | `mentionNotifications` |
| `direct_message` | New DM from the notification system (not a chat message) | `directMessageNotifications` |
| `reaction` | Another user reacted to this user's post | `reactionNotifications` |
| `auto_archiving` | Character approaching auto-archive deadline | `autoArchivingNotifications` |
| `account_update` | Currency earned or other account event | `accountUpdateNotifications` |

Each type has its own private `signal<NotificationData[]>([])` in `NotificationService`, exposed as a readonly signal via `.asReadonly()`.

### `NotificationData` shape

```ts
{
  id: number;
  user_id: number;
  type: '…';          // one of the types above
  title: string;
  message: string;
  date_created: string;  // ISO 8601
  is_read: boolean;
  // Type-specific payloads — only 'data' is populated in the /unread API response;
  // 'mention', 'game', 'direct_message' are legacy fields that may appear in WebSocket events
  mention: NotificationMention | null;
  game: NotificationGame | null;
  direct_message: NotificationDirectMessage | null;
  data: NotificationMention | NotificationGame | NotificationDirectMessage
      | NotificationAccountUpdate | NotificationReaction | NotificationAutoArchiving | null;
}
```

**Important:** the `/unread` REST response only populates `data`, not the top-level `mention`/`game`/`direct_message` fields. Code that reads type-specific payload must use `n.mention ?? n.data` (or `n.game ?? n.data`, etc.) to handle both shapes.

---

## Loading on page load / tab focus

`NotificationsComponent.ngOnInit()` calls `notificationService.loadUnreadNotifications()`.

`AppComponent` also calls `loadUnreadNotifications()` on the browser `visibilitychange` event whenever the tab becomes visible again and the user is authenticated.

`loadUnreadNotifications()` GETs `notifications/unread`, then sets each signal from the response:

```ts
this.mentionNotificationsSignal.set(response.mention || []);
this.accountUpdateNotificationsSignal.set(response.account_update || []);
// … all other types
this.rebuildTriggers(response);   // rebuilds auto-dismiss trigger maps
```

---

## Real-time delivery (WebSocket)

`NotificationService` maintains a WebSocket connection to `/ws?token=<access_token>`. The connection is established by calling `notificationService.connect(token)` (done in `AppComponent` after login).

Incoming events are parsed in `handleNotification()`. When `event.type === 'notification'`:

1. Checks `notification_settings` on `currentUser()` for the notification type. If `disable_all` is true, the event is **silently dropped**.
2. Calls `addTrigger(notificationData)` — registers the notification in the auto-dismiss trigger maps.
3. Prepends the notification to the appropriate signal.
4. If `disable_sound` is false → emits on `sound$` → `ToastComponent` plays `/notification.mp3`.
5. If `disable_toast` is false → emits on `notification$` → `ToastComponent` shows the toast popup. If the browser tab is hidden, the toast is queued in `pendingToasts` and flushed the next time the tab becomes visible.

---

## Toast popup (`ToastComponent`)

Subscribes to `notification$` and `sound$` from `NotificationService`.

- Each toast auto-dismisses after **10 seconds**.
- **Auto-dismiss behaviour by toast type:**
  - `account_update`: calling `autoRemove()` also calls `notificationService.dismissNotification()` — the badge is removed when the toast expires.
  - All other types: auto-removal only hides the toast UI. The badge in the header **persists** until the user explicitly dismisses the notification.
- If the user manually closes a toast (×), `notificationService.dismissNotification()` is always called regardless of type.

---

## Badge panel (`NotificationsComponent`)

Rendered in the header. Shows one badge chip per notification type that has unread items. Clicking a chip opens a modal listing the notifications for that type.

The `isTypeDisabled(type)` method reads `currentUser().notification_settings` (the array stored in the user object from the login/settings-save response). If a type has `disable_all: true`, its badge is hidden even if the signal has items — this reflects a user preference to opt out of that notification category entirely.

Notification settings are managed in `SettingsComponent`, which GETs `notifications/settings` and POSTs `notifications/settings/update`. Saving updates `authService.currentUser().notification_settings` so `isTypeDisabled` reflects the new preference immediately.

### DM badge

`dmNotifications` is a separate computed signal derived from `DirectChatService.chatList()` (chats with `unread_count > 0`). It is not backed by a `NotificationData` signal and is never affected by `dismissNotification`.

---

## Dismissing a notification

`notificationService.dismissNotification(notification)`:

1. Calls `removeTrigger(notification)` — removes from auto-dismiss maps.
2. POSTs to `notifications/dismiss/{id}`.
3. **Only on success** — removes the notification from its signal (`signal.update(list => list.filter(…))`).
4. On error — logs to console; signal is unchanged (badge persists).

Bulk dismissal ("Dismiss all" in the modal) iterates the current signal and calls `dismissNotification` for each item.

---

## Auto-dismiss triggers

Certain navigation events automatically dismiss notifications without user interaction, to avoid stale badges when the user has clearly seen the relevant content.

| Trigger | Method | When called |
|---|---|---|
| Game topic viewed (posts load) | `checkTopicId(topicId)` | `TopicService` after posts load |
| Mention notification for topic viewed | `checkMentionsByTopicId(topicId)` | `TopicService` after posts load |
| Specific post(s) loaded | `checkPostIds(postIds[])` | `TopicService` after posts load; also on individual new-post arrival |
| Direct chat opened | `checkChatId(chatId)` | `DirectChatService.loadDirectChat()` |

All four methods short-circuit immediately if their corresponding signal is empty.

`checkMentionsByTopicId` and `checkPostIds` use different granularity:
- `checkMentionsByTopicId` — dismisses any mention whose `data.topic_id` matches, regardless of which page of the topic was loaded.
- `checkPostIds` — uses the `mentionPostTriggers` map (built from `data.post_id` during `rebuildTriggers`) to dismiss only if the specific mentioned post appears in the loaded page.

Both are called on every topic post load, so a mention is dismissed as soon as the user views the topic (or the page containing the post).

---

## Notification settings

Stored per user in the database. The frontend reads them in two places:

1. **`currentUser().notification_settings`** (from the login response or after an explicit settings save) — used by `NotificationService.handleNotification()` to gate real-time delivery, and by `NotificationsComponent.isTypeDisabled()` to gate badge display.
2. **`notifications/settings` API** — loaded by `SettingsComponent` to populate the settings page UI.

`UserNotificationSetting` shape:
```ts
{
  notification_type: string;  // matches NotificationData.type
  disable_all: boolean;       // hides badge AND blocks real-time delivery
  disable_toast: boolean;     // suppresses toast popup only
  disable_sound: boolean;     // suppresses notification sound only
}
```

---

## WebSocket reconnection

On disconnect, `NotificationService` schedules a reconnect with exponential backoff (base 1 s, max 30 s, up to 10 attempts). If the access token is expired at reconnect time, `authService.refreshToken()` is called first. The last received `msg_id` is sent as a query parameter on reconnect so the backend can replay any missed messages.

Duplicate messages are deduplicated via a `seenMsgIds` set.

---

## Programmatic toast

Any part of the app can show a synthetic system toast without a backend notification:

```ts
notificationService.showToast('Title', 'Message body');
```

This emits directly on `notification$`. It does not create a `NotificationData` record in the backend.
