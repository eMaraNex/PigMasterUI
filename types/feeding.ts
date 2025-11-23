import { Hutch } from "./hutches";
import { Pig } from "./pigs";

export interface FeedingSchedule {
  dailyAmount: string;
  feedType: string;
  times: string[];
  lastFed: string;
  specialDiet?: string;
}

export interface FeedingScheduleProps {
  pigs: Pig[]
  hutches: Hutch[];
}
