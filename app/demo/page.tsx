import { NoumAIDashboard } from "@/components/noumai-dashboard";

export const metadata = {
  title: "NoumAI — Demo",
  description: "Read-only demo of NoumAI. Explore AI visibility tracking, competitor battlecards, citation analysis, and more.",
};

export default function DemoPage() {
  return <NoumAIDashboard demoMode />;
}
