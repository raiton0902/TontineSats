import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { AppProvider } from './store/AppStore'
import { AppShell } from './components/AppShell'
import { ActivityPage } from './pages/Activity'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { Entry } from './pages/Entry'
import { Join } from './pages/Join'
import { Landing } from './pages/Landing'
import { LegalPage } from './pages/Legal'
import { Passport } from './pages/Passport'
import { ReceiptPage } from './pages/Receipt'
import { SettingsPage } from './pages/Settings'

function AuthRoute() {
  const [params] = useSearchParams()
  return params.get('mode') ? <Auth /> : <Entry />
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/legal/:doc" element={<LegalPage />} />
          <Route path="/join/:code" element={<Join />} />
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="passport" element={<Passport />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="receipt/:round" element={<ReceiptPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
