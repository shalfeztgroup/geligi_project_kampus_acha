import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dashboardAPI } from '../../services/api';

interface DashboardState {
  overview: any;
  syncLogs: any[];
  webhookLogs: any[];
  activity: any[];
  metrics: any;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  overview: null,
  syncLogs: [],
  webhookLogs: [],
  activity: [],
  metrics: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchOverview = createAsyncThunk(
  'dashboard/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getOverview();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch overview');
    }
  }
);

export const fetchSyncLogs = createAsyncThunk(
  'dashboard/fetchSyncLogs',
  async (params?: any, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getSyncLogs(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch sync logs');
    }
  }
);

export const fetchWebhookLogs = createAsyncThunk(
  'dashboard/fetchWebhookLogs',
  async (params?: any, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getWebhookLogs(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch webhook logs');
    }
  }
);

export const fetchActivity = createAsyncThunk(
  'dashboard/fetchActivity',
  async (params?: any, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getActivity(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch activity');
    }
  }
);

export const fetchMetrics = createAsyncThunk(
  'dashboard/fetchMetrics',
  async (params?: any, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getMetrics(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch metrics');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch overview
      .addCase(fetchOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
        state.error = null;
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch sync logs
      .addCase(fetchSyncLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSyncLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.syncLogs = action.payload.data || action.payload;
        state.error = null;
      })
      .addCase(fetchSyncLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch webhook logs
      .addCase(fetchWebhookLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebhookLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.webhookLogs = action.payload.data || action.payload;
        state.error = null;
      })
      .addCase(fetchWebhookLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch activity
      .addCase(fetchActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.activity = action.payload;
        state.error = null;
      })
      .addCase(fetchActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch metrics
      .addCase(fetchMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
        state.error = null;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
