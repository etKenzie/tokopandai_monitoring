'use client';

import SettingsManager from '@/app/components/admin/SettingsManager';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import PageContainer from '@/app/components/container/PageContainer';

const AdminSettingsPage = () => {
  return (
    <PageContainer title="Admin Settings" description="Manage application settings and configurations">
      <SettingsManager />
    </PageContainer>
  );
};

export default function ProtectedAdminSettingsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <AdminSettingsPage />
    </ProtectedRoute>
  );
}
