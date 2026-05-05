/**
 * Shared component type utilities for React components.
 * Provides common type definitions for icon components and other UI patterns.
 *
 * @example
 * import { IconComponent, getLucideIcon, LucideIconName } from "src/types/components";
 */

import * as LucideIcons from "lucide-react";

/**
 * Generic icon component type accepting standard Lucide-like props.
 * Used for polymorphic icon props in components that need to accept any icon library.
 */
export type IconComponent = React.ComponentType<{ className?: string; size?: number }>;

/**
 * All valid Lucide icon names derived from the lucide-react export object.
 * Use this type for string-based icon name validation.
 */
export type LucideIconName = keyof typeof LucideIcons;

/**
 * Type-safe Lucide icon lookup utility.
 * Returns the icon component for a given name, or a safe fallback (Award) if not found.
 *
 * @example
 * const IconComp = getLucideIcon(badge.icon);
 * return <IconComp size={24} className="text-ares-gold" />;
 *
 * @param name - The icon name to look up (e.g., "Award", "User", "Settings")
 * @returns A Lucide icon component or the Award icon as fallback
 */
export function getLucideIcon(name: string): IconComponent {
  const iconComponent = (LucideIcons as unknown as Record<string, IconComponent>)[name];
  return iconComponent || LucideIcons.Award;
}
