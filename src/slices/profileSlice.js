import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null,
  loading: false,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload)); // Store user in localStorage
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    clearUser(state) {
      state.user = null;
      localStorage.removeItem("user"); // Remove user from localStorage on logout
    },
  },
});

export const { setUser, setLoading, clearUser } = profileSlice.actions;
export default profileSlice.reducer;
