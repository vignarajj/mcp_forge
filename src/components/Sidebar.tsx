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
    <div className="w-60 flex-shrink-0 bg-black border-r border-neutral-900 flex flex-col pt-12 pb-6 px-3">
      {/* Brand */}
      <div className="mb-6 px-3 flex items-center space-x-2">
        <div className="w-5 h-5 rounded bg-white flex items-center justify-center flex-shrink-0">
          <div className="w-2.5 h-2.5 bg-black rounded-sm" />
        </div>
        <h1 className="text-xs font-bold tracking-widest text-neutral-300 uppercase">MCP Forge</h1>
      </div>

      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={clsx(
                'group w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200'
              )}
            >
              <Icon
                size={16}
                className={clsx(
                  'transition-transform duration-150 group-hover:scale-110',
                  isActive ? 'text-white' : 'text-neutral-600 group-hover:text-neutral-300'
                )}
              />
              <span className="tracking-tight">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-70" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
