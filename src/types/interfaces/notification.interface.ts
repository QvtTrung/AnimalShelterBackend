export interface DirectusNotification {
  id?: string;
  status?: string;
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
  user_id: string;
  title: string;
  message: string;
  type: 'adoption' | 'rescue' | 'report' | 'system';
  related_id?: string;
  is_read: boolean;
  read_at?: string;
}
