import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ProductionRecord } from "@/types";

type ProductionState = {
  byFarm: Record<string, ProductionRecord[]>;
};

const loadInitialProduction = (): ProductionState => {
  if (typeof window === "undefined") return { byFarm: {} };
  const byFarm: Record<string, ProductionRecord[]> = {};
  for (const key of Object.keys(localStorage)) {
    const prefix = "pig_farm_production_";
    if (!key.startsWith(prefix)) continue;
    try {
      const records: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
      if (Array.isArray(records)) byFarm[key.slice(prefix.length)] = records;
    } catch (error) {
      console.warn(`Could not restore production records for ${key}:`, error);
    }
  }
  return { byFarm };
};

const initialState = loadInitialProduction();

const productionSlice = createSlice({
  name: "production",
  initialState,
  reducers: {
    setFarmProduction(
      state,
      action: PayloadAction<{ farmId: string; records: ProductionRecord[] }>,
    ) {
      state.byFarm[action.payload.farmId] = action.payload.records;
    },
    clearProduction(state) {
      state.byFarm = {};
    },
  },
});

export const { setFarmProduction, clearProduction } = productionSlice.actions;
export default productionSlice.reducer;
