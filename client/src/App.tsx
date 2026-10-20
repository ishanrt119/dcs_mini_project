import React, { useState, useEffect } from 'react';
import { Sidebar, NavView } from './components/Sidebar';
import { Header } from './components/Header';
import { Api } from './api';

// Views
import { OverviewView } from './views/OverviewView';
import { LiveTrainView } from './views/LiveTrainView';
import { TrainDetailsView } from './views/TrainDetailsView';
import { CoachPlatformView } from './views/CoachPlatformView';
import { NetworkMapView } from './views/NetworkMapView';
import { JourneyPlannerView } from './views/JourneyPlannerView';
import { TrainsBetweenView } from './views/TrainsBetweenView';
import { StationExplorerView } from './views/StationExplorerView';
import { LiveDeparturesView } from './views/LiveDeparturesView';
import { ReservationView } from './views/ReservationView';
import { DelayAnalyticsView } from './views/DelayAnalyticsView';
import { DirectoriesView } from './views/DirectoriesView';
import { SuburbanFreightView } from './views/SuburbanFreightView';
import { DisruptionSimView } from './views/DisruptionSimView';
import { DistributedMonitorView } from './views/DistributedMonitorView';
import { QuotaDashboardView } from './views/QuotaDashboardView';
import { ApiRegistryView } from './views/ApiRegistryView';

export function App() {
  const [currentView, setCurrentView] = useState<NavView>('overview');
  const [selectedTrain, setSelectedTrain] = useState<string>('12951');
  const [clusterStatus, setClusterStatus] = useState<'HEALTHY' | 'DEGRADED' | 'CRITICAL'>('HEALTHY');
  const [quotaRemaining, setQuotaRemaining] = useState<number>(80);
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [liveApiEnabled, setLiveApiEnabled] = useState<boolean>(false);

  // Reservation query transfer state
  const [resInit, setResInit] = useState<{ train?: string; from?: string; to?: string }>({});

  useEffect(() => {
    refreshSystemStatus();
    const interval = setInterval(refreshSystemStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  const refreshSystemStatus = async () => {
    try {
      const [hResp, qResp] = await Promise.all([
        Api.getClusterHealth(),
        Api.getQuota()
      ]);

      if (hResp.success && hResp.data) {
        setClusterStatus(hResp.data.clusterStatus as any);
      }
      if (qResp.success && qResp.data) {
        setQuotaRemaining(qResp.data.remainingBudget);
        setDemoMode(qResp.data.demoMode);
        setLiveApiEnabled(qResp.data.liveCallsEnabled);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigateWithTrain = (view: NavView, trainNum?: string) => {
    if (trainNum) setSelectedTrain(trainNum);
    setCurrentView(view);
  };

  const handleCheckAvailabilityFromPlanner = (trainNumber: string, from: string, to: string) => {
    setSelectedTrain(trainNumber);
    setResInit({ train: trainNumber, from, to });
    setCurrentView('seat-availability');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070d19] text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        clusterHealth={clusterStatus}
        quotaRemaining={quotaRemaining}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          onSearchTrain={trainNum => handleNavigateWithTrain('live-train', trainNum)}
          demoMode={demoMode}
          liveApiEnabled={liveApiEnabled}
          onModeChanged={refreshSystemStatus}
        />

        <main className="flex-1 overflow-y-auto bg-[#070d19]">
          {currentView === 'overview' && (
            <OverviewView onNavigate={handleNavigateWithTrain} />
          )}

          {currentView === 'live-train' && (
            <LiveTrainView initialTrainNumber={selectedTrain} />
          )}

          {currentView === 'train-details' && (
            <TrainDetailsView initialTrainNumber={selectedTrain} />
          )}

          {currentView === 'coach-platform' && (
            <CoachPlatformView initialTrainNumber={selectedTrain} />
          )}

          {currentView === 'network-map' && (
            <NetworkMapView onSelectTrain={t => handleNavigateWithTrain('live-train', t)} />
          )}

          {currentView === 'journey-planner' && (
            <JourneyPlannerView
              onSelectTrain={t => handleNavigateWithTrain('live-train', t)}
              onCheckAvailability={handleCheckAvailabilityFromPlanner}
            />
          )}

          {currentView === 'trains-between' && (
            <TrainsBetweenView onSelectTrain={t => handleNavigateWithTrain('live-train', t)} />
          )}

          {currentView === 'station-explorer' && (
            <StationExplorerView onSelectTrain={t => handleNavigateWithTrain('live-train', t)} />
          )}

          {currentView === 'live-departures' && (
            <LiveDeparturesView onSelectTrain={t => handleNavigateWithTrain('live-train', t)} />
          )}

          {currentView === 'seat-availability' && (
            <ReservationView
              initialTab="availability"
              initialTrainNumber={resInit.train || selectedTrain}
              initialFrom={resInit.from || 'MMCT'}
              initialTo={resInit.to || 'NDLS'}
            />
          )}

          {currentView === 'fare-calculator' && (
            <ReservationView
              initialTab="fare"
              initialTrainNumber={selectedTrain}
            />
          )}

          {currentView === 'pnr-status' && (
            <ReservationView initialTab="pnr" />
          )}

          {currentView === 'confirmation-prediction' && (
            <ReservationView
              initialTab="prediction"
              initialTrainNumber={selectedTrain}
            />
          )}

          {currentView === 'cancellation-refund' && (
            <ReservationView initialTab="refund" />
          )}

          {currentView === 'delay-analytics' && (
            <DelayAnalyticsView initialTrainNumber={selectedTrain} />
          )}

          {currentView === 'directories' && <DirectoriesView />}

          {currentView === 'suburban-freight' && <SuburbanFreightView />}

          {currentView === 'disruption-sim' && <DisruptionSimView />}

          {currentView === 'distributed-monitor' && <DistributedMonitorView />}

          {currentView === 'quota-dashboard' && <QuotaDashboardView />}

          {currentView === 'api-registry' && <ApiRegistryView />}
        </main>
      </div>
    </div>
  );
}

export default App;
