import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import DashboardPage from '@/pages/Dashboard'
import AssetsPage from '@/pages/Assets'
import AssetDetailPage from '@/pages/AssetDetail'
import ComparePage from '@/pages/Compare'
import RiskPage from '@/pages/Risk'
import AlertsPage from '@/pages/Alerts'
import ResearchPage from '@/pages/Research'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/assets/:id" element={<AssetDetailPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/risk" element={<RiskPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/research" element={<ResearchPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
