"use client";

import { useState } from "react";

type Tab = {
  id: string;
  label: string;
};

type TabsProps = {
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
};

export function Tabs({ tabs, defaultTab, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");

  return (
    <div>
      <div className="mb-7 flex justify-center">
        <div className="inline-flex rounded-2xl border border-zinc-200 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all
                ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {children(activeTab)}
    </div>
  );
}
