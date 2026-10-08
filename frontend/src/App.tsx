import type { ReactNode } from 'react';
import { AppShell } from './components/AppShell';
import { LoadingState } from './components/LoadingState';
import { ProjectCenterPage } from './features/projects/ProjectCenterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { WeddingOperationsPage } from './features/operations/WeddingOperationsPage';
import { WarRoomPage } from './features/warroom/WarRoomPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ConflictCenterPage } from './features/conflicts/ConflictCenterPage';
import { BudgetPage } from './features/budget/BudgetPage';
import { FinancePage } from './features/finance/FinancePage';
import { TasksPage } from './features/tasks/TasksPage';
import { GuestsPage } from './features/guests/GuestsPage';
import { SeatingPage } from './features/seating/SeatingPage';
import { VendorsPage } from './features/vendors/VendorsPage';
import { TimelinePage } from './features/timeline/TimelinePage';
import { InvitationsPage } from './features/invitations/InvitationsPage';
import { AttachmentsPage } from './features/attachments/AttachmentsPage';
import { RisksPage } from './features/risks/RisksPage';
import { MaterialsPage } from './features/materials/MaterialsPage';
import { useHashRoute } from './hooks/useHashRoute';
import { useTheme } from './hooks/useTheme';
import { useWeddingData } from './state/WeddingDataProvider';
import type { RouteId } from './types/domain';

export default function App() {
  const [route, setRoute] = useHashRoute();
  const [theme, setTheme] = useTheme();
  const { loading } = useWeddingData();
  if (loading) return <LoadingState />;

  const pages: Record<RouteId, ReactNode> = {
    projects: <ProjectCenterPage />,
    dashboard: <DashboardPage />,
    operations: <WeddingOperationsPage />,
    warroom: <WarRoomPage />,
    settings: <SettingsPage />,
    conflicts: <ConflictCenterPage />,
    budget: <BudgetPage />,
    finance: <FinancePage />,
    tasks: <TasksPage />,
    guests: <GuestsPage />,
    seating: <SeatingPage />,
    vendors: <VendorsPage />,
    timeline: <TimelinePage />,
    invitations: <InvitationsPage />,
    attachments: <AttachmentsPage />,
    risks: <RisksPage />,
    materials: <MaterialsPage />
  };

  return <AppShell route={route} onRouteChange={setRoute} theme={theme} onThemeChange={setTheme}>
    {pages[route]}
  </AppShell>;
}
