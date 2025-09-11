import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { integrationAPI } from '../../services/api';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: string;
  config: any;
  mapping?: any;
  createdAt: string;
  updatedAt: string;
  syncLogs?: any[];
}

interface IntegrationState {
  integrations: Integration[];
  selectedIntegration: Integration | null;
  loading: boolean;
  error: string | null;
  stats: any;
}

const initialState: IntegrationState = {
  integrations: [],
  selectedIntegration: null,
  loading: false,
  error: null,
  stats: null,
};

// Async thunks
export const fetchIntegrations = createAsyncThunk(
  'integration/fetchIntegrations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await integrationAPI.getIntegrations();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch integrations');
    }
  }
);

export const fetchIntegration = createAsyncThunk(
  'integration/fetchIntegration',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await integrationAPI.getIntegration(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch integration');
    }
  }
);

export const createIntegration = createAsyncThunk(
  'integration/createIntegration',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await integrationAPI.createIntegration(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create integration');
    }
  }
);

export const updateIntegration = createAsyncThunk(
  'integration/updateIntegration',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await integrationAPI.updateIntegration(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update integration');
    }
  }
);

export const deleteIntegration = createAsyncThunk(
  'integration/deleteIntegration',
  async (id: string, { rejectWithValue }) => {
    try {
      await integrationAPI.deleteIntegration(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete integration');
    }
  }
);

export const testIntegration = createAsyncThunk(
  'integration/testIntegration',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await integrationAPI.testIntegration(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to test integration');
    }
  }
);

export const syncIntegration = createAsyncThunk(
  'integration/syncIntegration',
  async ({ id, direction }: { id: string; direction?: string }, { rejectWithValue }) => {
    try {
      const response = await integrationAPI.syncIntegration(id, direction);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to sync integration');
    }
  }
);

export const fetchIntegrationStats = createAsyncThunk(
  'integration/fetchIntegrationStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await integrationAPI.getIntegrationStats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch integration stats');
    }
  }
);

const integrationSlice = createSlice({
  name: 'integration',
  initialState,
  reducers: {
    setSelectedIntegration: (state, action: PayloadAction<Integration | null>) => {
      state.selectedIntegration = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch integrations
      .addCase(fetchIntegrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIntegrations.fulfilled, (state, action) => {
        state.loading = false;
        state.integrations = action.payload;
        state.error = null;
      })
      .addCase(fetchIntegrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch single integration
      .addCase(fetchIntegration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIntegration.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedIntegration = action.payload;
        state.error = null;
      })
      .addCase(fetchIntegration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create integration
      .addCase(createIntegration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createIntegration.fulfilled, (state, action) => {
        state.loading = false;
        state.integrations.push(action.payload);
        state.error = null;
      })
      .addCase(createIntegration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update integration
      .addCase(updateIntegration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateIntegration.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.integrations.findIndex(integration => integration.id === action.payload.id);
        if (index !== -1) {
          state.integrations[index] = action.payload;
        }
        if (state.selectedIntegration?.id === action.payload.id) {
          state.selectedIntegration = action.payload;
        }
        state.error = null;
      })
      .addCase(updateIntegration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete integration
      .addCase(deleteIntegration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteIntegration.fulfilled, (state, action) => {
        state.loading = false;
        state.integrations = state.integrations.filter(integration => integration.id !== action.payload);
        if (state.selectedIntegration?.id === action.payload) {
          state.selectedIntegration = null;
        }
        state.error = null;
      })
      .addCase(deleteIntegration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Test integration
      .addCase(testIntegration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(testIntegration.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(testIntegration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Sync integration
      .addCase(syncIntegration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncIntegration.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(syncIntegration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch integration stats
      .addCase(fetchIntegrationStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIntegrationStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchIntegrationStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedIntegration, clearError } = integrationSlice.actions;
export default integrationSlice.reducer;
