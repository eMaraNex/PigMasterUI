import { configureStore } from "@reduxjs/toolkit";
import pigletsReducer from "../reducers/piglets/pigletsSlice";

export const store = configureStore({
  reducer: {
    piglets: pigletsReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
