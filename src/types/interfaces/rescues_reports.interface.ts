export interface RescueReport {
  id: number;
  rescues_id?: string;  // reference to rescues collection
  reports_id?: string;  // reference to reports collection
  status?: string;
  note?: string;
}