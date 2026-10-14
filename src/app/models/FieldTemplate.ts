export interface FieldTemplate {
  field_type: string,
  human_field_name: string,
  machine_field_name: string,
  content_field_type: string,
  order: number,
  width?: number,
  height?: number,
  options?: Record<string, string>
}

export interface Block {
  id: string;
  label: string;
  fields: string[];
}

export interface BlockSettingToggle {
  machine_name: string;
  label: string;
  children: string[];
  control_type: 'manual';
}

export interface TemplateConfig {
  fields: FieldTemplate[];
  blocks: Block[];
  block_settings: BlockSettingToggle[];
}

