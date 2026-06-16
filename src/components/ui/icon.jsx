// Wrapper around FontAwesome that maps friendly names → icon definitions.
// Default styling matches our modern look (filled, rounded). Use `variant` to override.
//
// Usage:
//   <Icon name="truck" size="lg" />
//   <Icon name="truck" size="2xl" className="text-primary" />
//   <Icon icon={faPalette} size="xl" />
//   <Icon name="telegram" size="lg" /> // brand icon (faTelegramBrand from brands)
//
// Sizes (Tailwind classes):
//   xs  → text-xs   (~0.75rem)
//   sm  → text-sm   (~0.875rem)
//   md  → text-base (~1rem) [default]
//   lg  → text-lg   (~1.125rem)
//   xl  → text-xl   (~1.25rem)
//   2xl → text-2xl  (~1.5rem)
//   3xl → text-3xl  (~1.875rem)
//   4xl → text-4xl  (~2.25rem)
//   5xl → text-5xl  (~3rem)

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICON_MAP } from '@/lib/icons';
import { cn } from '@/lib/utils';

const SIZE_MAP = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
};

export default function Icon({
  name,
  icon,
  size = 'md',
  variant,
  className,
  spin,
  pulse,
  ...props
}) {
  const resolvedIcon = icon || (name && ICON_MAP[name]?.icon);

  if (!resolvedIcon) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[Icon] No icon for name="${name}" and no icon prop provided.`);
    }
    return null;
  }

  return (
    <FontAwesomeIcon
      icon={resolvedIcon}
      className={cn(
        SIZE_MAP[size] || SIZE_MAP.md,
        'flex-shrink-0 leading-none',
        className,
      )}
      spin={spin}
      pulse={pulse}
      {...props}
    />
  );
}
