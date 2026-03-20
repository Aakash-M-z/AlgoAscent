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

// Import actual components to render as children (since we want them rendered inside the lazy boundaries)
import TaskManager from '../components/TaskManager';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import DSARoadmap from '../components/DSARoadmap';
import CoreSubjects from '../components/CoreSubjects';
import ProgressStats from '../components/ProgressStats';
import BadgeSystem from '../components/BadgeSystem';
import XPSystem from '../components/XPSystem';
import SolutionResources from '../components/SolutionResources';
import UserProfile from '../components/UserProfile';
import AdminPanel from '../components/AdminPanel';
import RoleBasedRoute from '../components/RoleBasedRoute';

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

// Skeleton loader for Suspense fallback
const PageLoader = () => (
  <div className="flex flex-col gap-6 animate-pulse p-4">
    <div className="h-12 bg-white/5 rounded-lg w-1/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-32 bg-white/5 rounded-xl"></div>
      <div className="h-32 bg-white/5 rounded-xl"></div>
      <div className="h-32 bg-white/5 rounded-xl"></div>
    </div>
    <div className="h-64 bg-white/5 rounded-xl w-full"></div>
  </div>
);

const AppRoutes: React.FC<AppRoutesProps> = ({ overviewTabNode, aiTabNode, activities, handleAddActivity }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* MAIN */}
        <Route path="/" element={
          <Suspense fallback={<PageLoader />}>
            <OverviewPage>
              <PageTransition>{overviewTabNode}</PageTransition>
            </OverviewPage>
          </Suspense>
        } />
        <Route path="/tasks" element={
          <Suspense fallback={<PageLoader />}>
            <TasksPage>
              <PageTransition><TaskManager /></PageTransition>
            </TasksPage>
          </Suspense>
        } />
        <Route path="/analytics" element={
          <Suspense fallback={<PageLoader />}>
            <AnalyticsPage>
              <PageTransition><AnalyticsDashboard activities={activities} /></PageTransition>
            </AnalyticsPage>
          </Suspense>
        } />
        <Route path="/ai" element={
          <Suspense fallback={<PageLoader />}>
            <AIPage>
              <PageTransition>{aiTabNode}</PageTransition>
            </AIPage>
          </Suspense>
        } />
        <Route path="/interview" element={
          <Suspense fallback={<PageLoader />}>
            <PageTransition><MockInterviewPage /></PageTransition>
          </Suspense>
        } />
        <Route path="/interview/start" element={
          <Suspense fallback={<PageLoader />}>
            <PageTransition><MockInterviewSession /></PageTransition>
          </Suspense>
        } />
        <Route path="/interview/result" element={
          <Suspense fallback={<PageLoader />}>
            <PageTransition><MockInterviewResult /></PageTransition>
          </Suspense>
        } />

        {/* TOOLS */}
        <Route path="/roadmap" element={
          <Suspense fallback={<PageLoader />}>
            <RoadmapPage>
              <PageTransition><DSARoadmap activities={activities} onAddActivity={handleAddActivity} /></PageTransition>
            </RoadmapPage>
          </Suspense>
        } />
        <Route path="/subjects" element={
          <Suspense fallback={<PageLoader />}>
            <SubjectsPage>
              <PageTransition><CoreSubjects /></PageTransition>
            </SubjectsPage>
          </Suspense>
        } />
        <Route path="/statistics" element={
          <Suspense fallback={<PageLoader />}>
            <StatisticsPage>
              <PageTransition><ProgressStats activities={activities} /></PageTransition>
            </StatisticsPage>
          </Suspense>
        } />
        <Route path="/badges" element={
          <Suspense fallback={<PageLoader />}>
            <BadgesPage>
              <PageTransition><BadgeSystem activities={activities} /></PageTransition>
            </BadgesPage>
          </Suspense>
        } />
        <Route path="/xp" element={
          <Suspense fallback={<PageLoader />}>
            <XPPage>
              <PageTransition><XPSystem activities={activities} /></PageTransition>
            </XPPage>
          </Suspense>
        } />
        <Route path="/resources" element={
          <Suspense fallback={<PageLoader />}>
            <ResourcesPage>
              <PageTransition><SolutionResources /></PageTransition>
            </ResourcesPage>
          </Suspense>
        } />

        {/* ACCOUNT */}
        <Route path="/profile" element={
          <Suspense fallback={<PageLoader />}>
            <ProfilePage>
              <PageTransition><UserProfile activities={activities} /></PageTransition>
            </ProfilePage>
          </Suspense>
        } />
        <Route path="/admin" element={
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
