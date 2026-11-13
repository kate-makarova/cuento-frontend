export interface DesignDraftListItem {
  id: number;
  name: string;
  session_key: string;
  date_created: string;
  date_created_localized?: string;
  date_last_changed: string;
  date_last_changed_localized?: string;
}

export interface DesignDraft {
  id: number;
  name: string;
  session_key: string;
  date_created: string;
  date_created_localized?: string;
  date_last_changed: string;
  date_last_changed_localized?: string;
  main_css: string;
  custom_style_css: string;
}

export interface CreateDesignDraftRequest {
  name: string;
}

export interface UpdateDesignDraftRequest {
  name?: string;
  main_css?: string;
  custom_style_css?: string;
}
