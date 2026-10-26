import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserPreferences = {
  theme: "light" | "dark";
  currency: string;
  selectedFarmId: string | null;
  tableDensity: "comfortable" | "compact";
  sidebarCollapsed: boolean;
};

const defaultPreferences: UserPreferences = {
  theme: "light",
  currency: "KES",
  selectedFarmId: null,
  tableDensity: "comfortable",
  sidebarCollapsed: false,
};

const readInitialPreferences = (): UserPreferences => {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const persisted = localStorage.getItem("pigmaster.preferences.v1");
    if (persisted) {
      const value = JSON.parse(persisted) as Partial<UserPreferences>;
      return {
        ...defaultPreferences,
        theme: value.theme === "dark" ? "dark" : "light",
        currency: typeof value.currency === "string" ? value.currency : "KES",
        selectedFarmId: typeof value.selectedFarmId === "string" ? value.selectedFarmId : null,
        tableDensity: value.tableDensity === "compact" ? "compact" : "comfortable",
        sidebarCollapsed: value.sidebarCollapsed === true,
      };
    }
    const legacyTheme = localStorage.getItem("pig_farm_theme");
    const legacyCurrency = localStorage.getItem("pig_farm_currency");
    return {
      ...defaultPreferences,
      theme: legacyTheme === "dark" ? "dark" : "light",
      currency: legacyCurrency || "KES",
    };
  } catch (error) {
    console.warn("Could not read saved preferences:", error);
    return defaultPreferences;
  }
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState: readInitialPreferences(),
  reducers: {
    setTheme(state, action: PayloadAction<UserPreferences["theme"]>) {
      state.theme = action.payload;
    },
    setCurrency(state, action: PayloadAction<string>) {
      state.currency = action.payload;
    },
    setSelectedFarmId(state, action: PayloadAction<string | null>) {
      state.selectedFarmId = action.payload;
    },
    setTableDensity(state, action: PayloadAction<UserPreferences["tableDensity"]>) {
      state.tableDensity = action.payload;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const {
  setTheme,
  setCurrency,
  setSelectedFarmId,
  setTableDensity,
  setSidebarCollapsed,
} = preferencesSlice.actions;

export default preferencesSlice.reducer;
