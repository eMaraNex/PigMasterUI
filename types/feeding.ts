import { Pen } from "./pens";
import { Pig } from "./pigs";

export interface FeedingSchedule {
  dailyAmount: string;
  feedType: string;
  times: string[];
  lastFed: string;
  specialDiet?: string;
}

export interface FeedingScheduleProps {
  pigs: Pig[];
  pens: Pen[];
}
