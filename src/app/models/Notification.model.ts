export interface Notification {
  id: number;
  type: string;
  label: string;
  detail: string;
  isRead: boolean;
  createdAt: string;
}