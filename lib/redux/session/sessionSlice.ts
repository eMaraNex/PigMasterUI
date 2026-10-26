import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type SessionUser = {
  id?: string;
  email: string;
  name: string;
  farm_id?: string;
  role_id?: string | number;
  role_name?: string;
  email_verified?: boolean;
  avatar_url?: string;
  subscription_start?: string;
  subscription_end?: string;
  subscription_plan?: string;
  created_at?: string;
};

type SessionState = {
  status: "unknown" | "authenticated" | "anonymous";
  user: SessionUser | null;
};

const initialState: SessionState = { status: "unknown", user: null };

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<SessionUser>) {
      state.status = "authenticated";
      state.user = action.payload;
    },
    clearSession(state) {
      state.status = "anonymous";
      state.user = null;
    },
  },
});

export const { setSession, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
