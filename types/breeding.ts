import { Hutch } from "./hutches";
import { Pig } from "./pigs";

export interface BreedingRecord {
  id: string;
  farm_id: string;
  sow_id: string;
  boar_id: string;
  sow_name: string;
  boar_name: string;
  mating_date: string;
  is_pregnant: boolean;
  expected_birth_date?: string;
  notes?: string;
  actualBirthDate?: string;
  numberOfKits?: number;
}

export interface BreedingManagerProps {
  pigs: Pig[];
  onPigsUpdate: (updatedPigs: Pig[]) => void;
  hutches: Hutch[];
}

export interface CompatibilityResult {
  compatible: boolean;
  reason: string;
}