
import React from 'react';
import { useAppStore } from './hooks/useAppStore';

// Extracted Components
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AiLoadingOverlay } from './components/AiLoadingOverlay';
import { LedgerEntryModal } from './components/LedgerEntryModal';
import { EditProfileModal } from './components/EditProfileModal';

// Extracted Views
import { DashboardView } from './views/DashboardView';
import { CustomerListView } from './views/CustomerListView';
import { CustomerDetailView } from './views/CustomerDetailView';
import { WhatsAppConfigView } from './views/WhatsAppConfigView';
import { WhatsAppChatView } from './views/WhatsAppChatView';
import { WhatsAppLogsView } from './views/WhatsAppLogsView';
import { TransactionsView } from './views/TransactionsView';
import { GradesView } from './views/GradesView';
import { IntegrationsView } from './views/IntegrationsView';
import { TemplateArchitectView } from './views/TemplateArchitectView';
import { AuditLogView } from './views/AuditLogView';
import { CallLogsView } from './views/CallLogsView';
import { BrainView } from './views/BrainView';
import { CortexArchitectView } from './views/CortexArchitectView';

const App: React.FC = () => {
  const { state, actions } = useAppStore();

  if (!state.user) {
    return <LoginScreen onLogin={actions.setUser} />;
  }

  // Determine if we should show the global header. 
  // We hide it for 'view-customer' because that view has its own dedicated sticky header.
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

        {/* 
           Main Scroll Area: 
           - pb-32 adds padding at bottom for mobile reachability 
           - custom-scrollbar for aesthetics
        */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden ${showGlobalHeader ? 'p-4 md:p-8 lg:p-10' : 'p-0'} pb-32 md:pb-10 custom-scrollbar`}>
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
              onAddEntry={(defaults) => { 
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
