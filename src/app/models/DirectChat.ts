export interface DirectChat {
  id: number;
  userName: string;
  lastMessage: string;
}

export interface DirectChatListItem {
  chat_id: number;
  user_id: number;
  username: string;
  unread_count: number;
}
