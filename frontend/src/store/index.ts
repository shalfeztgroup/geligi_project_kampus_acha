import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import integrationSlice from './slices/integrationSlice';
import webhookSlice from './slices/webhookSlice';
import dashboardSlice from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    integration: integrationSlice,
    webhook: webhookSlice,
    dashboard: dashboardSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
