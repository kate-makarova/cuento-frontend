export interface AiModel {
  id: number;
  name: string;
  size: number;
  api_address: string;
  api_key: string;
  machine_name: string;
  is_active: boolean;
  protocol_type: number;
  model_type: number;
}

export interface AiModelCreateRequest {
  name: string;
  size: number;
  api_address: string;
  api_key: string;
  machine_name: string;
  is_active: boolean;
  protocol_type: number;
  model_type: number;
}

export interface AiModelUpdateRequest {
  name?: string;
  size?: number;
  api_address?: string;
  api_key?: string;
  machine_name?: string;
  is_active?: boolean;
  protocol_type?: number;
  model_type?: number;
}
