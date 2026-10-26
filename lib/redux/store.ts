import { configureStore, createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import pigletsReducer from "../reducers/piglets/pigletsSlice";
import preferencesReducer, { setCurrency, setSelectedFarmId, setSidebarCollapsed, setTableDensity, setTheme } from "./preferences/preferencesSlice";
import sessionReducer from "./session/sessionSlice";
import productionReducer, { setFarmProduction } from "./production/productionSlice";
import { api } from "./api";

const preferencesListener = createListenerMiddleware();
preferencesListener.startListening({
  matcher: isAnyOf(setTheme, setCurrency, setSelectedFarmId, setTableDensity, setSidebarCollapsed),
  effect: (_action, listenerApi) => {
    try {
      const { theme, currency, selectedFarmId, tableDensity, sidebarCollapsed } =
        (listenerApi.getState() as RootState).preferences;
      localStorage.setItem("pigmaster.preferences.v1", JSON.stringify({
        theme,
        currency,
        selectedFarmId,
        tableDensity,
        sidebarCollapsed,
      }));
    } catch (error) {
      console.warn("Could not persist preferences:", error);
    }
  },
});
preferencesListener.startListening({
  matcher: setFarmProduction.match,
  effect: (action, listenerApi) => {
    try {
      localStorage.setItem(
        `pig_farm_production_${action.payload.farmId}`,
        JSON.stringify(action.payload.records),
      );
    } catch (error) {
      console.warn("Could not persist production records:", error);
    }
  },
});

export const store = configureStore({
  reducer: {
    piglets: pigletsReducer,
    preferences: preferencesReducer,
    session: sessionReducer,
    production: productionReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).prepend(preferencesListener.middleware).concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
