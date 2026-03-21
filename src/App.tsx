import { useState } from 'react';
import { useProfiles } from './hooks/useProfiles';
import { Sidebar } from './components/Sidebar';
import { ProfilesView } from './views/ProfilesView';
import { EditorView } from './views/EditorView';
import { ToolsView } from './views/ToolsView';
import { SettingsView } from './views/SettingsView';

export type ViewType = 'profiles' | 'tools' | 'editor' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('profiles');
  const profileState = useProfiles();

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans antialiased selection:bg-neutral-800">
      {/* macOS Title Bar Simulation */}
      <div className="absolute top-0 left-0 right-0 h-10 flex items-center px-4 z-50 pointer-events-none">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-neutral-700 border border-neutral-600"></div>
          <div className="w-3 h-3 rounded-full bg-neutral-700 border border-neutral-600"></div>
          <div className="w-3 h-3 rounded-full bg-neutral-700 border border-neutral-600"></div>
        </div>
      </div>

      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="flex-1 flex flex-col pt-10 border-l border-neutral-900 relative">
        {currentView === 'profiles' && <ProfilesView {...profileState} onEdit={(id) => { profileState.setActiveProfileId(id); setCurrentView('editor'); }} />}
        {currentView === 'tools' && <ToolsView {...profileState} />}
        {currentView === 'editor' && <EditorView {...profileState} />}
        {currentView === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}
