import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../auth/LoginPage';
import { RegisterPage } from '../auth/RegisterPage';
import { RequireAuth } from '../auth/RequireAuth';
import { AgentDetailPage } from '../features/agents/AgentDetailPage';
import { AgentsPage } from '../features/agents/AgentsPage';
import { ApprovalsPage } from '../features/approvals/ApprovalsPage';
import { ExecutionsPage } from '../features/executions/ExecutionsPage';
import { HomePage } from '../features/home/HomePage';
import { ProjectDetailPage } from '../features/projects/ProjectDetailPage';
import { ProjectsPage } from '../features/projects/ProjectsPage';
import { SquadsPage } from '../features/squads/SquadsPage';
import { AppLayout } from '../layout/AppLayout';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="agents/:agentId" element={<AgentDetailPage />} />
          <Route path="executions" element={<ExecutionsPage />} />
          <Route path="squads" element={<SquadsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
