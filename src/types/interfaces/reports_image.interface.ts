export interface ReportImage {
  id: string;
  sort?: number;
  user_created?: string;  // reference to directus_users collection
  date_created?: string;
  image_url?: string;
  report_id?: string;  // reference to reports collection
}