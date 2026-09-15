export const EVENT_OPTIONS = [
  { value: 'topic_full', label: 'Topic Full' },
  { value: 'TopicStatusChanged', label: 'Topic Status Changed' },
] as const;

export const HANDLER_OPTIONS = [
  { value: 'MoveTopic', label: 'Move Topic' },
] as const;

export const TOPIC_STATUS_OPTIONS = [
  { value: 0, label: 'Active' },
  { value: 1, label: 'Inactive' },
] as const;
