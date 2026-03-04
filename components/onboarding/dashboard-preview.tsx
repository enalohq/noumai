"use client";

import { SovereignDashboard } from "@/components/sovereign-dashboard";

export function DashboardPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Scaled dashboard snapshot */}
      <div
        className="pointer-events-none origin-top-left"
        style={{
          transform: "scale(0.58)",
          width: "172%",
          height: "172%",
        }}
      >
        <SovereignDashboard demoMode />
      </div>

      {/* Overlay: light blur + subtle dim + gradient fade at bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(var(--color-bg-rgb, 15 15 20), 0.15) 0%, rgba(var(--color-bg-rgb, 15 15 20), 0.45) 100%)",
          backdropFilter: "blur(1px)",
          WebkitBackdropFilter: "blur(1px)",
        }}
      />

      {/* Sneak-peek label */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-th-border bg-th-card/80 px-4 py-1.5 text-xs font-medium text-th-text-muted backdrop-blur-sm">
        Your dashboard awaits
      </div>
    </div>
  );
}
