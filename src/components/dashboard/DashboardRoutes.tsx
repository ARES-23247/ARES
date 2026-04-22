import { Suspense, lazy } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, MessageSquare, Utensils, BarChart3, Gem, Target, Trophy, MapPin } from "lucide-react";
import { DashboardSession, DashboardPermissions } from "../../hooks/useDashboardSession";

// ── Lazy-loaded Tab Components ───────────────────────────────────────
const BlogEditor = lazy(() => import("@/components/BlogEditor"));
const EventEditor = lazy(() => import("@/components/EventEditor"));
const ContentManager = lazy(() => import("@/components/ContentManager"));
const AssetManager = lazy(() => import("@/components/AssetManager"));
const DocsEditor = lazy(() => import("@/components/DocsEditor"));
const IntegrationsManager = lazy(() => import("@/components/IntegrationsManager"));
const ProfileEditor = lazy(() => import("@/components/ProfileEditor"));
const AdminUsers = lazy(() => import("@/components/AdminUsers"));
const DietarySummary = lazy(() => import("@/components/DietarySummary"));
const AnalyticsDashboard = lazy(() => import("@/components/AnalyticsDashboard"));
const SponsorEditor = lazy(() => import("@/components/SponsorEditor"));
const OutreachTracker = lazy(() => import("@/components/OutreachTracker"));
const AwardEditor = lazy(() => import("@/components/AwardEditor"));
const MemberImpactOverview = lazy(() => import("@/components/MemberImpactOverview"));
const BadgeManager = lazy(() => import("@/components/BadgeManager"));
const LocationsManager = lazy(() => import("@/components/LocationsManager"));
const AdminInquiries = lazy(() => import("@/components/AdminInquiries"));
const DashboardHome = lazy(() => import("@/components/DashboardHome"));
const CommandCenter = lazy(() => import("@/components/CommandCenter"));
const SponsorTokensManager = lazy(() => import("@/components/SponsorTokensManager"));

// ── Suspense Spinner ─────────────────────────────────────────────────
function TabLoader() {
  return (
    <div className="flex justify-center flex-col gap-4 items-center py-32">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <RefreshCw size={32} className="text-ares-cyan/70" />
      </motion.div>
      <p className="text-sm font-bold text-marble/60 animate-pulse uppercase tracking-widest">Loading Module...</p>
    </div>
  );
}

export default function DashboardRoutes({
  session,
  permissions,
}: {
  session: DashboardSession | null;
  permissions: DashboardPermissions;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const { isAdmin, canSeeInquiries, canSeeLogistics } = permissions;

  return (
    <div className="flex-1 w-full bg-obsidian border border-white/5 ares-cut-lg shadow-2xl relative overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full h-full p-4 sm:p-6 md:p-10 overflow-y-auto"
        >
          <Suspense fallback={<TabLoader />}>
            <Routes>
              <Route index element={<DashboardHome />} />
              <Route path="profile" element={<ProfileEditor />} />
              <Route path="blog/:editSlug?" element={<BlogEditor userRole={session?.user?.role} />} />
              <Route path="event/:editId?" element={<EventEditor userRole={session?.user?.role} />} />
              <Route path="docs/:editSlug?" element={<DocsEditor userRole={session?.user?.role} />} />
              <Route path="manage_blog" element={<ContentManager mode="blog" onEditPost={(slug) => navigate(`/dashboard/blog/${slug}`)} />} />
              <Route path="manage_event" element={<ContentManager mode="event" onEditEvent={(id) => navigate(`/dashboard/event/${id}`)} />} />
              <Route path="manage_docs" element={<ContentManager mode="docs" onEditDoc={(slug) => navigate(`/dashboard/docs/${slug}`)} />} />
              <Route path="assets" element={<AssetManager />} />
              <Route path="integrations" element={isAdmin ? <IntegrationsManager /> : <div className="text-center py-20">Access Denied</div>} />
              <Route path="users" element={isAdmin ? <AdminUsers /> : <div className="text-center py-20">Access Denied</div>} />
              <Route
                path="inquiries"
                element={
                  canSeeInquiries ? (
                    <>
                      <div className="mb-6 pb-6 border-b border-white/5">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                          <MessageSquare className="text-ares-gold" /> Team Inquiries
                        </h2>
                        <p className="text-marble/60 text-sm mt-1">Review student, mentor, and sponsor applications.</p>
                      </div>
                      <AdminInquiries />
                    </>
                  ) : (
                    <div className="text-center py-20">Access Denied</div>
                  )
                }
              />
              <Route path="impact_roster" element={isAdmin ? <MemberImpactOverview /> : <div className="text-center py-20">Access Denied</div>} />
              <Route
                path="badges"
                element={
                  isAdmin ? (
                    <>
                      <div className="mb-6 pb-6 border-b border-white/5">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">Badge Management</h2>
                        <p className="text-zinc-500 text-sm mt-1">Define platform-wide awards and distribute them to members.</p>
                      </div>
                      <BadgeManager />
                    </>
                  ) : (
                    <div className="text-center py-20">Access Denied</div>
                  )
                }
              />
              <Route
                path="logistics"
                element={
                  canSeeLogistics ? (
                    <>
                      <div className="mb-6 pb-6 border-b border-white/5">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                          <Utensils className="text-ares-gold" /> Team Logistics Summary
                        </h2>
                        <p className="text-marble/60 text-sm mt-1">Aggregated dietary data for event planning and team management.</p>
                      </div>
                      <DietarySummary />
                    </>
                  ) : (
                    <div className="text-center py-20">Access Denied</div>
                  )
                }
              />
              <Route
                path="analytics"
                element={
                  <>
                    <div className="mb-6 pb-6 border-b border-white/5">
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <BarChart3 className="text-ares-cyan" /> Community Engagement
                      </h2>
                      <p className="text-zinc-500 text-sm mt-1">Real-time data on documentation and blog utility.</p>
                    </div>
                    <AnalyticsDashboard />
                  </>
                }
              />
              <Route
                path="sponsors"
                element={
                  <>
                    <div className="mb-6 pb-6 border-b border-white/5">
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Gem className="text-ares-cyan" /> Sponsor Recognition
                      </h2>
                      <p className="text-zinc-500 text-sm mt-1">Manage and showcase our funding partners.</p>
                    </div>
                    <SponsorEditor />
                  </>
                }
              />
              <Route
                path="sponsor_tokens"
                element={
                  isAdmin ? (
                    <>
                      <div className="mb-6 pb-6 border-b border-white/5">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                          <Gem className="text-ares-cyan" /> Sponsor ROI Tokens
                        </h2>
                        <p className="text-zinc-500 text-sm mt-1">Generate secure magic links for sponsors to view their impact report.</p>
                      </div>
                      <SponsorTokensManager />
                    </>
                  ) : (
                    <div className="text-center py-20">Access Denied</div>
                  )
                }
              />
              <Route
                path="outreach"
                element={
                  <>
                    <div className="mb-6 pb-6 border-b border-white/5">
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Target className="text-ares-cyan" /> Community Impact Tracker
                      </h2>
                      <p className="text-zinc-500 text-sm mt-1">Log outreach events and student service hours.</p>
                    </div>
                    <OutreachTracker />
                  </>
                }
              />
              <Route
                path="legacy"
                element={
                  <>
                    <div className="mb-6 pb-6 border-b border-white/5">
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Trophy className="text-ares-gold" /> Team Legacy Archive
                      </h2>
                      <p className="text-zinc-500 text-sm mt-1">Manage seasonal achievements and awards.</p>
                    </div>
                    <AwardEditor />
                  </>
                }
              />
              <Route
                path="locations"
                element={
                  <>
                    <div className="mb-6 pb-6 border-b border-white/5">
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <MapPin className="text-ares-gold" /> Team Locations
                      </h2>
                      <p className="text-marble/60 text-sm mt-1">Manage physical meeting points, shops, and outreach sites.</p>
                    </div>
                    <LocationsManager />
                  </>
                }
              />
              <Route path="command_center" element={isAdmin ? <CommandCenter /> : <div className="text-center py-20">Access Denied</div>} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
