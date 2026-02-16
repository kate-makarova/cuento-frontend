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
