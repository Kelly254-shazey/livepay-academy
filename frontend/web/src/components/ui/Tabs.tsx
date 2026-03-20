interface TabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    disabled?: boolean;
  }>;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

import { useState } from 'react';

export function Tabs({
  tabs,
  defaultTab,
  onChange,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className="w-full">
      <div className="border-b border-stroke flex gap-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              px-4 py-3 border-b-2 font-medium text-sm
              whitespace-nowrap transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                activeTab === tab.id
                  ? 'text-accent border-b-accent'
                  : 'text-muted border-b-transparent hover:text-text'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
