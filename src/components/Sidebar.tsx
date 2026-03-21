import { ViewType } from '../App';
import { Layers, Wrench, Edit3, Settings } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
}

export function Sidebar({ currentView, setCurrentView }: SidebarProps) {
  const navItems = [
    { id: 'profiles', label: 'Profiles', icon: Layers },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'editor', label: 'Editor', icon: Edit3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="w-64 flex-shrink-0 bg-black border-r border-neutral-900 flex flex-col pt-14 pb-4 px-3">
      <div className="mb-8 px-3">
        <h1 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">MCP Forge</h1>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={clsx(
                'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'
              )}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-neutral-500'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="mt-auto px-3">
        <div className="text-xs text-neutral-600 flex items-center justify-between">
          <span>v1.0.0</span>
          <span>Local Mode</span>
        </div>
      </div>
    </div>
  );
}
