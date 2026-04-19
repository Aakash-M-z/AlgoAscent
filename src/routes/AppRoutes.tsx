import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Lazy load page wrappers
const OverviewPage = React.lazy(() => import('../features/overview/OverviewPage'));
const TasksPage = React.lazy(() => import('../features/tasks/TasksPage'));
const AnalyticsPage = React.lazy(() => import('../features/analytics/AnalyticsPage'));
const AIPage = React.lazy(() => import('../features/ai/AIPage'));
const RoadmapPage = React.lazy(() => import('../features/roadmap/RoadmapPage'));
const SubjectsPage = React.lazy(() => import('../features/subjects/SubjectsPage'));
const StatisticsPage = React.lazy(() => import('../features/statistics/StatisticsPage'));
const BadgesPage = React.lazy(() => import('../features/badges/BadgesPage'));
const XPPage = React.lazy(() => import('../features/xp/XPPage'));
const ResourcesPage = React.lazy(() => import('../features/resources/ResourcesPage'));
const ProfilePage = React.lazy(() => import('../features/profile/ProfilePage'));
const AdminPage = React.lazy(() => import('../features/admin/AdminPage'));
const MockInterviewPage = React.lazy(() => import('../features/interview/MockInterviewPage'));
const MockInterviewSession = React.lazy(() => import('../features/interview/MockInterviewSession'));
const MockInterviewResult = React.lazy(() => import('../features/interview/MockInterviewResult'));
const LandingPage = React.lazy(() => import('../features/landing/LandingPage'));

// Import actual components to render as children (since we want them rendered inside the lazy boundaries)
import TaskManager from '../components/TaskManager';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import DSARoadmap from '../components/DSARoadmap';
import ProgressStats from '../components/ProgressStats';
import BadgeSystem from '../components/BadgeSystem';
import XPSystem from '../components/XPSystem';
import SolutionResources from '../components/SolutionResources';
import UserProfile from '../components/UserProfile';
import Settings from '../components/Settings';
import RoleBasedRoute from '../components/RoleBasedRoute';

// Heavy components — lazy loaded to reduce initial bundle size
const AdminPanel = React.lazy(() => import('../components/AdminPanel'));
const CoreSubjects = React.lazy(() => import('../components/CoreSubjects'));

export interface AppRoutesProps {
  overviewTabNode: React.ReactNode;
  aiTabNode: React.ReactNode;
  activities: any[];
  handleAddActivity: (a: any) => Promise<boolean>;
}

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
};

// Enhanced skeleton loader for Suspense fallback
const PageLoader = () => (
  <div className="flex flex-col gap-8 animate-pulse p-2 md:p-6 opacity-60">
    <div className="flex items-center justify-between">
      <div className="h-10 bg-white/10 rounded-xl w-48 shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]"></div>
      <div className="h-10 bg-white/10 rounded-xl w-10"></div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-2 h-[400px] bg-white/5 border border-white/5 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
      <div className="h-[400px] bg-white/5 border border-white/5 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
    </div>

    <style>{`
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);

const AppRoutes: React.FC<AppRoutesProps> = ({ overviewTabNode, aiTabNode, activities, handleAddActivity }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* LANDING PAGE */}
        <Route path="/" element={
          <Suspense fallback={<PageLoader />}>
            <LandingPage />
          </Suspense>
        } />

        {/* DASHBOARD - MAIN */}
        <Route path="/dashboard" element={
          <Suspense fallback={<PageLoader />}>
            <OverviewPage>
              <PageTransition>{overviewTabNode}</PageTransition>
            </OverviewPage>
          </Suspense>
        } />
        <Route path="/dashboard/tasks" element={
          <Suspense fallback={<PageLoader />}>
            <TasksPage>
              <PageTransition><TaskManager /></PageTransition>
            </TasksPage>
          </Suspense>
        } />
        <Route path="/dashboard/analytics" element={
          <Suspense fallback={<PageLoader />}>
            <AnalyticsPage>
              <PageTransition><AnalyticsDashboard activities={activities} /></PageTransition>
            </AnalyticsPage>
          </Suspense>
        } />
        <Route path="/dashboard/ai" element={
          <Suspense fallback={<PageLoader />}>
            <AIPage>
              <PageTransition>{aiTabNode}</PageTransition>
            </AIPage>
          </Suspense>
        } />
        <Route path="/dashboard/interview" element={
          <Suspense fallback={<PageLoader />}>
            <PageTransition><MockInterviewPage /></PageTransition>
          </Suspense>
        } />
        <Route path="/dashboard/interview/start" element={
          <Suspense fallback={<PageLoader />}>
            <PageTransition><MockInterviewSession /></PageTransition>
          </Suspense>
        } />
        <Route path="/dashboard/interview/result" element={
          <Suspense fallback={<PageLoader />}>
            <PageTransition><MockInterviewResult /></PageTransition>
          </Suspense>
        } />

        {/* DASHBOARD - TOOLS */}
        <Route path="/dashboard/roadmap" element={
          <Suspense fallback={<PageLoader />}>
            <RoadmapPage>
              <PageTransition><DSARoadmap activities={activities} onAddActivity={handleAddActivity} /></PageTransition>
            </RoadmapPage>
          </Suspense>
        } />
        <Route path="/dashboard/subjects" element={
          <Suspense fallback={<PageLoader />}>
            <SubjectsPage>
              <PageTransition><CoreSubjects /></PageTransition>
            </SubjectsPage>
          </Suspense>
        } />
        <Route path="/dashboard/statistics" element={
          <Suspense fallback={<PageLoader />}>
            <StatisticsPage>
              <PageTransition><ProgressStats activities={activities} /></PageTransition>
            </StatisticsPage>
          </Suspense>
        } />
        <Route path="/dashboard/badges" element={
          <Suspense fallback={<PageLoader />}>
            <BadgesPage>
              <PageTransition><BadgeSystem activities={activities} /></PageTransition>
            </BadgesPage>
          </Suspense>
        } />
        <Route path="/dashboard/xp" element={
          <Suspense fallback={<PageLoader />}>
            <XPPage>
              <PageTransition><XPSystem activities={activities} /></PageTransition>
            </XPPage>
          </Suspense>
        } />
        <Route path="/dashboard/resources" element={
          <Suspense fallback={<PageLoader />}>
            <ResourcesPage>
              <PageTransition><SolutionResources /></PageTransition>
            </ResourcesPage>
          </Suspense>
        } />

        {/* DASHBOARD - ACCOUNT */}
        <Route path="/dashboard/profile" element={
          <Suspense fallback={<PageLoader />}>
            <ProfilePage>
              <PageTransition><UserProfile activities={activities} /></PageTransition>
            </ProfilePage>
          </Suspense>
        } />
        <Route path="/dashboard/settings" element={
          <Suspense fallback={<PageLoader />}>
            <PageTransition><Settings /></PageTransition>
          </Suspense>
        } />
        <Route path="/dashboard/admin" element={
          <Suspense fallback={<PageLoader />}>
            <AdminPage>
              <PageTransition>
                <RoleBasedRoute requiredRole="admin">
                  <AdminPanel />
                </RoleBasedRoute>
              </PageTransition>
            </AdminPage>
          </Suspense>
        } />
        <Route path="/dashboard/admin/:tab" element={
          <Suspense fallback={<PageLoader />}>
            <AdminPage>
              <PageTransition>
                <RoleBasedRoute requiredRole="admin">
                  <AdminPanel />
                </RoleBasedRoute>
              </PageTransition>
            </AdminPage>
          </Suspense>
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
