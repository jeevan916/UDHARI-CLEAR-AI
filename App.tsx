import React, { Suspense, lazy } from 'react';
import { useAppStore } from './hooks/useAppStore';

// Extracted Components
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AiLoadingOverlay } from './components/AiLoadingOverlay';
import { LedgerEntryModal } from './components/LedgerEntryModal';
import { EditProfileModal } from './components/EditProfileModal';
import { Loader2 } from 'lucide-react';

// Lazy Loaded Views
const DashboardView = lazy(() => import('./views/DashboardView').then(module => ({ default: module.DashboardView })));
const CustomerListView = lazy(() => import('./views/CustomerListView').then(module => ({ default: module.CustomerListView })));
const CustomerDetailView = lazy(() => import('./views/CustomerDetailView').then(module => ({ default: module.CustomerDetailView })));
const WhatsAppConfigView = lazy(() => import('./views/WhatsAppConfigView').then(module => ({ default: module.WhatsAppConfigView })));
const WhatsAppChatView = lazy(() => import('./views/WhatsAppChatView').then(module => ({ default: module.WhatsAppChatView })));
const WhatsAppLogsView = lazy(() => import('./views/WhatsAppLogsView').then(module => ({ default: module.WhatsAppLogsView })));
const TransactionsView = lazy(() => import('./views/TransactionsView').then(module => ({ default: module.TransactionsView })));
const GradesView = lazy(() => import('./views/GradesView').then(module => ({ default: module.GradesView })));
const IntegrationsView = lazy(() => import('./views/IntegrationsView').then(module => ({ default: module.IntegrationsView })));
const TemplateArchitectView = lazy(() => import('./views/TemplateArchitectView').then(module => ({ default: module.TemplateArchitectView })));
const AuditLogView = lazy(() => import('./views/AuditLogView').then(module => ({ default: module.AuditLogView })));
const CallLogsView = lazy(() => import('./views/CallLogsView').then(module => ({ default: module.CallLogsView })));
const BrainView = lazy(() => import('./views/BrainView').then(module => ({ default: module.BrainView })));
const CortexArchitectView = lazy(() => import('./views/CortexArchitectView').then(module => ({ default: module.CortexArchitectView })));
const SystemVaultView = lazy(() => import('./views/SystemVaultView').then(module => ({ default: module.SystemVaultView })));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full w-full p-20 opacity-50">
    <Loader2 size={40} className="animate-spin text-blue-600"/>
  </div>
);

const App: React.FC = () => {
  const { state, actions } = useAppStore();

  if (!state.user) {
    return <LoginScreen onLogin={actions.setUser} />;
  }

  const showGlobalHeader = state.activeView !== 'view-customer';

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      <Sidebar 
        activeView={state.activeView} 
        setActiveView={actions.setActiveView} 
        expandedMenus={state.expandedMenus} 
        setExpandedMenus={actions.setExpandedMenus} 
        isAdmin={state.isAdmin}
        onLogout={() => actions.setUser(null)}
        isMobileOpen={state.isMobileMenuOpen}
        onCloseMobile={() => actions.setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full relative w-full min-w-0 transition-all duration-300">
        {showGlobalHeader && (
          <Header 
            activeView={state.activeView} 
            user={state.user} 
            isAdmin={state.isAdmin} 
            onMenuToggle={() => actions.setIsMobileMenuOpen(true)}
          />
        )}

        <div className={`flex-1 overflow-y-auto overflow-x-hidden ${showGlobalHeader ? 'p-4 md:p-8 lg:p-10' : 'p-0'} pb-32 md:pb-10 custom-scrollbar`}>
          <Suspense fallback={<LoadingSpinner />}>
            {state.activeView === 'dashboard' && (
              <DashboardView 
                customers={state.customers} 
                isAdmin={state.isAdmin} 
                systemLogs={state.systemLogs}
                gradeRules={state.gradeRules} 
                callLogs={state.callLogs}
              />
            )}

            {state.activeView === 'brain' && (
              <BrainView 
                customers={state.customers} 
                gradeRules={state.gradeRules} 
                callLogs={state.callLogs}
                isAdmin={state.isAdmin}
              />
            )}

            {state.activeView === 'customers' && (
              <CustomerListView 
                customers={state.filteredCustomers}
                searchTerm={state.searchTerm}
                setSearchTerm={actions.setSearchTerm}
                filterGrade={state.filterGrade}
                setFilterGrade={actions.setFilterGrade}
                onView={actions.navigateToCustomer}
                templates={state.templates} 
                gradeRules={state.gradeRules}
                callLogs={state.callLogs}
                onAddCustomer={actions.addCustomer}
              />
            )}

            {state.activeView === 'view-customer' && state.activeCustomer && state.behavior && (
              <CustomerDetailView 
                customer={state.activeCustomer}
                behavior={state.behavior}
                aiStrategy={state.aiStrategy}
                isAdmin={state.isAdmin}
                callLogs={state.callLogs}
                whatsappLogs={state.whatsappLogs}
                onBack={actions.resetCustomerView}
                onAi={actions.handleAiInquiry}
                onAddEntry={(defaults: any) => { 
                   actions.setEditingTransaction(null); 
                   if (defaults) actions.setEntryDefaults(defaults);
                   actions.setIsEntryModalOpen(true); 
                }}
                onEditProfile={() => actions.setIsEditModalOpen(true)}
                onDeleteTransaction={actions.handleDeleteTransaction}
                onEditTransaction={actions.openEditModal}
                onEnrich={actions.enrichCustomerData}
                onUpdateDeepvue={actions.updateCustomerDeepvueData}
                onSetPrimaryContact={actions.setPrimaryContact}
              />
            )}

            {state.activeView === 'whatsapp-config' && (
              <WhatsAppConfigView isAdmin={state.isAdmin} />
            )}

            {state.activeView === 'whatsapp-chat' && (
              <WhatsAppChatView customers={state.customers} isAdmin={state.isAdmin} templates={state.templates} />
            )}

            {state.activeView === 'whatsapp-logs' && (
              <WhatsAppLogsView logs={state.whatsappLogs} customers={state.customers} />
            )}

            {state.activeView === 'transactions' && (
              <TransactionsView customers={state.customers} isAdmin={state.isAdmin} />
            )}
            
            {state.activeView === 'payment-logs' && (
               <AuditLogView systemLogs={state.systemLogs} isAdmin={state.isAdmin} />
            )}

            {state.activeView === 'grades' && (
              <GradesView 
                isAdmin={state.isAdmin} 
                gradeRules={state.gradeRules}
                setGradeRules={actions.setGradeRules}
                customers={state.customers}
                callLogs={state.callLogs}
                templates={state.templates}
              />
            )}

            {state.activeView === 'integrations' && (
              <IntegrationsView 
                integrations={state.integrations}
                onUpdateConfig={actions.updateIntegrationConfig}
                isAdmin={state.isAdmin}
              />
            )}

            {state.activeView === 'system-vault' && (
              <SystemVaultView 
                dbStatus={state.dbStatus}
                dbStructure={state.dbStructure}
                systemLogs={state.systemLogs}
              />
            )}

            {state.activeView === 'template-architect' && (
              <TemplateArchitectView templates={state.templates} onUpdateTemplates={actions.setTemplates} />
            )}

            {state.activeView === 'call-logs' && (
              <CallLogsView 
                logs={state.callLogs} 
                customers={state.customers}
                onAddLog={actions.handleAddCallLog}
              />
            )}

            {state.activeView === 'cortex-architect' && (
              <CortexArchitectView />
            )}
          </Suspense>
        </div>
      </main>

      <LedgerEntryModal 
        isOpen={state.isEntryModalOpen} 
        onClose={() => { actions.setIsEntryModalOpen(false); actions.setEditingTransaction(null); actions.setEntryDefaults(null); }} 
        onCommit={actions.handleCommitEntry}
        initialData={state.editingTransaction}
        defaults={state.entryDefaults}
      />

      {state.activeCustomer && (
        <EditProfileModal 
          isOpen={state.isEditModalOpen}
          customer={state.activeCustomer}
          onClose={() => actions.setIsEditModalOpen(false)}
          onSave={actions.handleUpdateProfile}
        />
      )}

      {state.isAiLoading && <AiLoadingOverlay isAdmin={state.isAdmin} />}
    </div>
  );
};

export default App;