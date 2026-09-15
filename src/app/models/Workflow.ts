export interface Workflow {
  id: number;
  event_name: string;
  subforum_ids: string;
  handler_function: string;
  config: Record<string, unknown>;
}
