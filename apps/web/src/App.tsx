import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Auth
import { LoginPage } from './pages/auth/LoginPage';

// Staff Experience
import { StaffHomePage } from './pages/staff/StaffHomePage';
import { MyEntriesPage } from './pages/staff/MyEntriesPage';
import { NewSalePage } from './pages/entries/NewSalePage';
import { NewPurchasePage } from './pages/entries/NewPurchasePage';
import { NewJobWorkPage } from './pages/entries/NewJobWorkPage';
import { NewVoucherPage } from './pages/entries/NewVoucherPage';

// Owner Management Experience
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { OwnerEntriesPage } from './pages/owner/OwnerEntriesPage';
import { PartyLedgerPage } from './pages/owner/PartyLedgerPage';
import { StockRegisterPage } from './pages/owner/StockRegisterPage';
import { CashBankBooksPage } from './pages/owner/CashBankBooksPage';
import { StaffManagementPage } from './pages/owner/StaffManagementPage';
import { ReminderSettingsPage } from './pages/owner/ReminderSettingsPage';
import { AuditLogPage } from './pages/owner/AuditLogPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Root index redirector based on role
const RoleHomeRedirect: React.FC = () => {
  const { role } = useAuth();
  if (role === 'OWNER') {
    // Owner can still access rapid entry if desired, but default dashboard is owner view
    return <OwnerDashboardPage />;
  }
  return <StaffHomePage />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected App Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Home */}
              <Route index element={<RoleHomeRedirect />} />

              {/* Staff Rapid Entry Screens */}
              <Route path="sales/new" element={<NewSalePage />} />
              <Route path="purchases/new" element={<NewPurchasePage />} />
              <Route path="job-work/new" element={<NewJobWorkPage />} />
              <Route path="vouchers/new" element={<NewVoucherPage />} />
              <Route path="staff/entries" element={<MyEntriesPage />} />

              {/* Owner Protected Management Screens */}
              <Route
                path="owner/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <OwnerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="owner/entries"
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <OwnerEntriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="owner/ledger"
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <PartyLedgerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="owner/stock"
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <StockRegisterPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="owner/books"
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <CashBankBooksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="owner/staff"
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <StaffManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="owner/reminders"
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <ReminderSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="owner/audit"
                element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
