import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { UsersPage } from './pages/UsersPage.jsx';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/users" replace />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/users" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
