import type { ReactNode, SVGProps } from 'react';

// Íconos propios de trazo, en línea. Siempre decorativos: el texto va al lado o en aria-label.
function Icon({ size = 22, children, ...rest }: SVGProps<SVGSVGElement> & { size?: number; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

type IconProps = { size?: number };

export function Logo({ size = 36 }: IconProps) {
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 36 36">
      <rect x="0" y="0" width="16" height="16" rx="4" fill="#B79CFF" />
      <rect x="20" y="0" width="16" height="16" rx="4" fill="#6FB1FF" />
      <rect x="0" y="20" width="16" height="16" rx="4" fill="#5FD6C9" />
      <rect x="20" y="20" width="16" height="16" rx="4" fill="#FFB27A" />
    </svg>
  );
}

export function MenuIcon({ size = 30 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
    >
      <line x1="4" y1="7" x2="26" y2="7" />
      <line x1="4" y1="15" x2="26" y2="15" />
      <line x1="4" y1="23" x2="26" y2="23" />
    </svg>
  );
}

export const HomeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 11 L12 3 L21 11" />
    <path d="M6 10 V20 H18 V10" />
  </Icon>
);

export const ProjectsIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="5" cy="6" r="2.5" />
    <circle cx="19" cy="18" r="2.5" />
    <path d="M7.5 6 H14 a4 4 0 0 1 0 8 H10 a4 4 0 0 0 0 8" />
  </Icon>
);

export const ApprovalsIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5 L11 15.5 L16.5 9" />
  </Icon>
);

export const AgentsIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="7" width="14" height="12" rx="3" />
    <path d="M12 7 V3" />
    <circle cx="9.5" cy="13" r="1" />
    <circle cx="14.5" cy="13" r="1" />
  </Icon>
);

export const ExecutionsIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 6 H20" />
    <path d="M9 12 H20" />
    <path d="M9 18 H20" />
    <circle cx="4.5" cy="6" r="1" />
    <circle cx="4.5" cy="12" r="1" />
    <circle cx="4.5" cy="18" r="1" />
  </Icon>
);

export const SquadsIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="4" width="7" height="7" rx="2" />
    <rect x="14" y="4" width="7" height="7" rx="2" />
    <rect x="8.5" y="14" width="7" height="7" rx="2" />
  </Icon>
);

export const ExternalLinkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 4 H20 V10" />
    <path d="M20 4 L11 13" />
    <path d="M18 14 V19 a1 1 0 0 1 -1 1 H5 a1 1 0 0 1 -1 -1 V7 a1 1 0 0 1 1 -1 H10" />
  </Icon>
);

export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7 H20" />
    <path d="M9 7 V4 H15 V7" />
    <path d="M6 7 L7 20 H17 L18 7" />
  </Icon>
);

export const SparkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3 L13.8 9.2 L20 11 L13.8 12.8 L12 19 L10.2 12.8 L4 11 L10.2 9.2 Z" />
  </Icon>
);

export const ClockIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7 V12 L15.5 14" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12.5 L10 17.5 L19 7.5" />
  </Icon>
);

export const AlertIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3 L22 20 H2 Z" />
    <path d="M12 10 V14" />
    <path d="M12 17 V17.01" />
  </Icon>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 12 H5" />
    <path d="M11 6 L5 12 L11 18" />
  </Icon>
);
