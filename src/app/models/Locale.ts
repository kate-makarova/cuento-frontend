export interface Locale {
  id: number;
  human_name: string;
  code: string;
  front_end_file_name: string;
  back_end_file_name: string;
  is_installed: boolean;
  file_size_fe?: number;
  file_size_be?: number;
  installed_file_size_fe?: number;
}
