export interface EarningsRecord {
  id?: string;
  type: "pig_sale" | "urine_sale" | "manure_sale" | "other";
  pig_id?: string;
  amount: number;
  currency: string;
  date: string;
  weight?: number;
  sale_type:
    | "whole"
    | "meat_only"
    | "skin_only"
    | "meat_and_skin"
    | "bulk"
    | "processed"
    | "other"
    | undefined;
  includes_urine?: boolean;
  includes_manure?: boolean;
  buyer_name?: string;
  notes?: string;
  created_at?: string;
  farm_id: string;
  pen_id?: string;
}

export interface ProductionRecord {
  id?: string;
  type: "urine" | "manure";
  quantity: number;
  unit: string;
  date: string;
  source?: string;
  notes?: string;
  created_at?: string;
}
