import { Pen } from "./pens";
import { Pig } from "./pigs";

export interface HealthRecord {
  id: string;
  type: string;
  description: string;
  date: string;
  nextDue?: string;
  status: "completed" | "pending" | "overdue";
  veterinarian?: string;
  notes?: string;
}

export interface HealthTrackerProps {
  pigs: Pig[];
  pens: Pen[];
}
