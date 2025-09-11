import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { webhookAPI } from '../../services/api';

interface Webhook {
  id: string;
  platform: string;
  eventType: string;
  processed: boolean;
  processedAt?: string;
  createdAt: string;
  integration?: {
    name: string;
    type: string;
  };
}

interface WebhookState {
  webhooks: Webhook[];
  loading: boolean;
  error: string | null;
  stats: any;
}

const initialState: WebhookState = {
  webhooks: [],
  loading: false,
  error: null,
  stats: null,
};

// Async thunks
export const fetchWebhooks = createAsyncThunk(
  'webhook/fetchWebhooks',
  async (params?: any, { rejectWithValue }) => {
    try {
      const response = await webhookAPI.getWebhooks(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch webhooks');
    }
  }
);

export const fetchWebhookStats = createAsyncThunk(
  'webhook/fetchWebhookStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await webhookAPI.getWebhookStats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch webhook stats');
    }
  }
);

export const retryFailedWebhooks = createAsyncThunk(
  'webhook/retryFailedWebhooks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await webhookAPI.retryFailedWebhooks();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to retry webhooks');
    }
  }
);

export const deleteOldWebhooks = createAsyncThunk(
  'webhook/deleteOldWebhooks',
  async (daysOld: number, { rejectWithValue }) => {
    try {
      const response = await webhookAPI.deleteOldWebhooks(daysOld);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete old webhooks');
    }
  }
);

const webhookSlice = createSlice({
  name: 'webhook',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch webhooks
      .addCase(fetchWebhooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebhooks.fulfilled, (state, action) => {
        state.loading = false;
        state.webhooks = action.payload;
        state.error = null;
      })
      .addCase(fetchWebhooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch webhook stats
      .addCase(fetchWebhookStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebhookStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchWebhookStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Retry failed webhooks
      .addCase(retryFailedWebhooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(retryFailedWebhooks.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(retryFailedWebhooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete old webhooks
      .addCase(deleteOldWebhooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOldWebhooks.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteOldWebhooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = webhookSlice.actions;
export default webhookSlice.reducer;
