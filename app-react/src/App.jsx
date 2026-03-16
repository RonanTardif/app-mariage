import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { ProgrammePage } from './pages/ProgrammePage'
import { PlanPage } from './pages/PlanPage'
import { RoomsPage } from './pages/RoomsPage'
import { PhotosPage } from './pages/PhotosPage'
import { QuizPage } from './pages/QuizPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { InfosPage } from './pages/InfosPage'
import { WhatsAppPage } from './pages/WhatsAppPage'

export default function App() {
  return (
    <AppShell>
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
      </Routes>
    </AppShell>
  )
}
