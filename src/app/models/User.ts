export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  roles: Role[];
}
export interface Role {
  id: number;
  name: string;
}

export interface UserProfile {
  user_id: number;
  user_name: string;
  avatar: string;
}
