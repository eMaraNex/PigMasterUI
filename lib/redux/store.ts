import { configureStore } from "@reduxjs/toolkit";
import kitsReducer from "../reducers/kits/kitsSlice";

export const store = configureStore({
  reducer: {
    kits: kitsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
