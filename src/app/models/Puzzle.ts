export interface Puzzle {
  id: number;
  title: string;
  iframe_code: string;
  date_created: string;
  is_public: boolean;
  is_active: boolean;
}

export interface PuzzleAchievement {
  id: number;
  puzzle_id: number;
  user_id: number;
  date: string;
  screenshot_url: string;
}
