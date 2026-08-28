/**
 * Inline SVG icon set — keeps the bundle dependency-free and lets icons
 * inherit `currentColor` from whatever element they sit in.
 */
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

const Icon = ({ children, size, ...props }) => (
  <svg {...base} {...(size ? { width: size, height: size } : null)} {...props}>
    {children}
  </svg>
);

export const UsersIcon = (props) => (
  <Icon {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

export const ReportIcon = (props) => (
  <Icon {...props}>
    <path d="M3 3v18h18" />
    <rect x="7" y="12" width="3" height="6" rx="1" />
    <rect x="12.5" y="8" width="3" height="10" rx="1" />
    <rect x="18" y="4" width="3" height="14" rx="1" />
  </Icon>
);

export const SearchIcon = (props) => (
  <Icon size={16} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Icon>
);

export const PlusIcon = (props) => (
  <Icon size={16} {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const EyeIcon = (props) => (
  <Icon size={16} {...props}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const PencilIcon = (props) => (
  <Icon size={16} {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
);

export const TrashIcon = (props) => (
  <Icon size={16} {...props}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
);

export const CloseIcon = (props) => (
  <Icon size={18} {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

export const MenuIcon = (props) => (
  <Icon {...props}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </Icon>
);

export const ChevronLeftIcon = (props) => (
  <Icon size={16} {...props}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const ChevronRightIcon = (props) => (
  <Icon size={16} {...props}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

export const ArrowUpIcon = (props) => (
  <Icon size={13} {...props}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Icon>
);

export const ArrowDownIcon = (props) => (
  <Icon size={13} {...props}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </Icon>
);

export const AlertIcon = (props) => (
  <Icon {...props}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Icon>
);

export const CheckCircleIcon = (props) => (
  <Icon {...props}>
    <path d="M21.8 11.1V12a10 10 0 1 1-5.9-9.1" />
    <path d="M22 4 12 14.01l-3-3" />
  </Icon>
);

export const UserCheckIcon = (props) => (
  <Icon {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m16 11 2 2 4-4" />
  </Icon>
);

export const UserOffIcon = (props) => (
  <Icon {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M17 11h5" />
  </Icon>
);

export const MaleIcon = (props) => (
  <Icon {...props}>
    <circle cx="10" cy="14" r="5" />
    <path d="M14 10 20 4M15 4h5v5" />
  </Icon>
);

export const FemaleIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7M9 18h6" />
  </Icon>
);

export const FilterIcon = (props) => (
  <Icon size={16} {...props}>
    <path d="M3 5h18l-7 8v5l-4 2v-7Z" />
  </Icon>
);

export const InboxIcon = (props) => (
  <Icon size={30} {...props}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1Z" />
  </Icon>
);
