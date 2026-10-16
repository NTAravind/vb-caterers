import type { SVGProps } from "react";

export type IconName =
  | "whatsapp"
  | "menu"
  | "calendar"
  | "phone"
  | "download"
  | "globe"
  | "star"
  | "pin"
  | "mail"
  | "instagram"
  | "facebook"
  | "photos"
  | "video"
  | "search"
  | "chevron"
  | "arrow-up"
  | "close"
  | "play"
  | "pause"
  | "arrow-left"
  | "arrow-right"
  | "volume"
  | "mute"
  | "fullscreen"
  | "exit-fullscreen"
  | "alert"
  | "lock"
  | "logout"
  | "users"
  | "refresh"
  | "check"
  | "plus"
  | "trash"
  | "arrow-down"
  | "save";

type Props = { name: IconName } & Omit<SVGProps<SVGSVGElement>, "name">;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const filled = {
  fill: "currentColor",
  stroke: "none",
};

export function Icon({ name, ...rest }: Props) {
  const common = {
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    focusable: false,
    ...rest,
  };

  switch (name) {
    case "whatsapp":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.14-.14.3-.35.44-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.98 2.9a9.83 9.83 0 0 1 2.9 6.99c0 5.45-4.44 9.89-9.89 9.89m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.09.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.48-8.41"
          />
        </svg>
      );
    case "menu":
      return (
        <svg {...common} {...stroke}>
          <path d="M4 6h16M4 12h16M4 18h10" />
          <path d="M4 4h16v16H4z" opacity={0.35} />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common} {...stroke}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
          <path d="M8 15h.01M12 15h.01M16 15h.01" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common} {...stroke}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.93.34 1.85.66 2.73a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.35-1.23a2 2 0 0 1 2.11-.45c.88.32 1.8.54 2.73.66A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case "download":
      return (
        <svg {...common} {...stroke}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5M12 15V3" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common} {...stroke}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 3.6 9A14 14 0 0 1 12 21a14 14 0 0 1-3.6-9A14 14 0 0 1 12 3z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} {...filled}>
          <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.4l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95L12 2.5z" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common} {...stroke}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common} {...stroke}>
          <rect x="2.5" y="5" width="19" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} {...stroke}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <path d="M17.5 6.5h.01" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} {...stroke}>
          <path d="M17 2.5H15a5 5 0 0 0-5 5V11H7.5v4H10v6.5h4V15h2.5l.5-4H14V7.5a1 1 0 0 1 1-1h2z" />
        </svg>
      );
    case "photos":
      return (
        <svg {...common} {...stroke}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M21 16l-5-5-9 9" />
        </svg>
      );
    case "video":
      return (
        <svg {...common} {...stroke}>
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="M16 11l6-3.5v9L16 13z" />
        </svg>
      );
    case "search":
      return (
        <svg {...common} {...stroke}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20.5 20.5L16.2 16.2" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common} {...stroke}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      );
    case "arrow-up":
      return (
        <svg {...common} {...stroke}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      );
    case "close":
      return (
        <svg {...common} {...stroke}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "play":
      return (
        <svg {...common} {...filled}>
          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z" />
        </svg>
      );
    case "pause":
      return (
        <svg {...common} {...filled}>
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...common} {...stroke}>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common} {...stroke}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      );
    case "volume":
      return (
        <svg {...common} {...stroke}>
          <path d="M11 5L6.5 9H3v6h3.5L11 19z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      );
    case "mute":
      return (
        <svg {...common} {...stroke}>
          <path d="M11 5L6.5 9H3v6h3.5L11 19z" />
          <path d="M16 9l5 6M21 9l-5 6" />
        </svg>
      );
    case "fullscreen":
      return (
        <svg {...common} {...stroke}>
          <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
        </svg>
      );
    case "exit-fullscreen":
      return (
        <svg {...common} {...stroke}>
          <path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common} {...stroke}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common} {...stroke}>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common} {...stroke}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5M21 12H9" />
        </svg>
      );
    case "users":
      return (
        <svg {...common} {...stroke}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...common} {...stroke}>
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 4v5h-5" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} {...stroke}>
          <path d="M4 12.5l5 5L20 6.5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common} {...stroke}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common} {...stroke}>
          <path d="M4 7h16M10 11v6M14 11v6" />
          <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
          <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
        </svg>
      );
    case "arrow-down":
      return (
        <svg {...common} {...stroke}>
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      );
    case "save":
      return (
        <svg {...common} {...stroke}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <path d="M17 21v-8H7v8M7 3v5h8" />
        </svg>
      );
  }
}
