/**
 * Common client-side utility functions for the NoumAI dashboard.
 */

/**
 * Returns a human-readable "time ago" string for a given date.
 */
export function getTimeAgo(dateString: string | Date | undefined): string {
  if (!dateString) return "Never";
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 30) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}
