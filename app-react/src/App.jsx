import { Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { PwaInstallPrompt } from './components/shared/PwaInstallPrompt'
import { HomePage } from './pages/HomePage'
import { ProgrammePage } from './pages/ProgrammePage'
import { PlanPage } from './pages/PlanPage'
import { RoomsPage } from './pages/RoomsPage'
import { PhotosPage } from './pages/PhotosPage'
import { QuizPage } from './pages/QuizPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { InfosPage } from './pages/InfosPage'
import { WhatsAppPage } from './pages/WhatsAppPage'
import { AdminPage } from './pages/AdminPage'
import { AlbumPage } from './pages/AlbumPage'
import { SharePhotoPage } from './pages/SharePhotoPage'

function RoutedErrorBoundary({ children }) {
  const { pathname } = useLocation()
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
}

export default function App() {
  return (
    <AppShell>
      <RoutedErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/programme" element={<ProgrammePage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/chambres" element={<RoomsPage />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/infos" element={<InfosPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/album" element={<AlbumPage />} />
          <Route path="/partager" element={<SharePhotoPage />} />
        </Routes>
      </RoutedErrorBoundary>
      <PwaInstallPrompt />
    </AppShell>
  )
}
