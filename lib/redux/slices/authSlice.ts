/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { setCookie, deleteCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import apiService from "@/lib/api/core";
import { fetchAuth } from "@/lib/api/services/fetchAuth";
import { getAuthCookieConfig } from "@/utils/cookieConfig";
import { findMockAccount } from "@/lib/mock/mockUsers";
import { createMockToken } from "@/lib/mock/mockJwt";
import type { User, DecodedToken } from "@/types/models";
import type { RootState, AppDispatch } from "../store";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Role hệ thống là cố định trên tài khoản (PRD 3.2) — không phải mảng như các app khác
export const decodeToken = (token: string): User | null => {
  try {
    return jwtDecode<any>(token) as User;
  } catch {
    return null;
  }
};

export const decodeTokenWithExpiry = (token: string): DecodedToken | null => {
  try {
    return jwtDecode<any>(token) as DecodedToken;
  } catch {
    return null;
  }
};

export const setupAutoRefresh = (token: string, dispatch: AppDispatch) => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const decoded = decodeTokenWithExpiry(token);
  if (!decoded?.exp) return;

  const refreshTime = decoded.exp * 1000 - Date.now() - 2 * 60 * 1000;

  if (refreshTime <= 0) {
    dispatch(refreshTokenAsync());
    return;
  }

  refreshTimer = setTimeout(() => dispatch(refreshTokenAsync()), refreshTime);
};

export const clearAutoRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

export const loginAsync = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // TODO: xoá nhánh mock này khi backend đăng nhập thật sẵn sàng.
      const mockUser = findMockAccount(credentials.email, credentials.password);
      if (mockUser) {
        const accessToken = createMockToken(mockUser);
        const refreshToken = `mock-refresh-${mockUser.id}`;

        setCookie("authToken", accessToken, getAuthCookieConfig());

        return { token: accessToken, refreshToken, user: mockUser };
      }

      const response = await fetchAuth.login(credentials);

      if (response.isSuccess && response.data.accessToken) {
        const { accessToken, refreshToken } = response.data;
        const user = decodeToken(accessToken);

        setCookie("authToken", accessToken, getAuthCookieConfig());

        return { token: accessToken, refreshToken, user };
      }

      return rejectWithValue(response.message || "Đăng nhập thất bại");
    } catch (error: any) {
      return rejectWithValue(error.message || "Đăng nhập thất bại");
    }
  }
);

export const logoutAsync = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await apiService.post("/api/v1/auth/logout");
    deleteCookie("authToken", { path: "/" });
    clearAutoRefresh();
    return true;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const refreshTokenAsync = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState() as RootState;
      const { refreshToken } = state.auth;
      if (!refreshToken) return rejectWithValue("No refresh token");

      const response = await apiService.post<{
        isSuccess: boolean;
        data: { accessToken: string; refreshToken: string };
      }>("/api/v1/auth/refresh-token", { refreshToken });

      if (response.data.isSuccess && response.data.data.accessToken) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        const user = decodeToken(accessToken);

        setCookie("authToken", accessToken, getAuthCookieConfig());
        setupAutoRefresh(accessToken, dispatch as AppDispatch);

        return { token: accessToken, refreshToken: newRefreshToken, user };
      }

      return rejectWithValue("Refresh failed");
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokenWithRefresh: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      const user = decodeToken(action.payload.accessToken);
      if (user) {
        state.user = user;
        state.isAuthenticated = true;
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      deleteCookie("authToken", { path: "/" });
      clearAutoRefresh();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken ?? null;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    });

    builder
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setTokenWithRefresh, logout, clearError } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthToken = (state: RootState) => state.auth.token;

export default authSlice.reducer;
