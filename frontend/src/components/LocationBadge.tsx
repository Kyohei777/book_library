"use client";

interface LocationBadgeProps {
  location?: string;
}

export function LocationBadge({ location }: LocationBadgeProps) {
  if (!location) return null;
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
      📍 {location}
    </span>
  );
}
