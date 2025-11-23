import { Pig } from "./pigs";
import { Row } from "./rows";

export interface Hutch {
  id: string;
  name: string;
  row_id: string;
  farm_id: string;
  level: string;
  position: number;
  size: string;
  material: string;
  features: string[];
  is_occupied: boolean;
  last_cleaned: string | null;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  row_name: string;
}

export interface HutchLayoutProps {
  hutches: Hutch[];
  pigs: Pig[];
  rows: Row[];
  onPigSelect: (pig: Pig) => void;
  onRowAdded?: () => void;
  handleAddRow: () => void;
}