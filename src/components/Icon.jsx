/**
 * Icon.jsx — Custom SVG icon set for Invoixio.
 * Uses a 16px viewBox, 1.5px stroke, rounded joins.
 * Every icon inherits currentColor so it can be colored via CSS.
 */

const PATHS = {
  dashboard: (
    <>
      <rect x="2" y="2" width="5.5" height="6" rx="0.5" />
      <rect x="8.5" y="2" width="5.5" height="3.5" rx="0.5" />
      <rect x="2" y="9" width="5.5" height="5" rx="0.5" />
      <rect x="8.5" y="6.5" width="5.5" height="7.5" rx="0.5" />
    </>
  ),
  document: (
    <>
      <path d="M3.5 1.75h6L12.5 4.75v9.5a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5Z" />
      <path d="M9.5 1.75v3.25H12.5" />
      <path d="M5.5 8.5h5M5.5 11h5M5.5 6h2.5" />
    </>
  ),
  users: (
    <>
      <circle cx="6" cy="5.5" r="2.5" />
      <path d="M1.75 13.25c.4-2.2 2.2-3.5 4.25-3.5s3.85 1.3 4.25 3.5" />
      <circle cx="11.25" cy="4.75" r="1.75" />
      <path d="M10.5 9.25c1.1 0 2.1.35 2.85 1 .6.5 1.05 1.2 1.25 2" />
    </>
  ),
  package: (
    <>
      <path d="M8 1.75 14 4.5v7L8 14.25 2 11.5v-7Z" />
      <path d="M2 4.5 8 7.25 14 4.5" />
      <path d="M8 7.25v7" />
      <path d="m5 3.1 6 2.75" />
    </>
  ),
  settings: (
    <>
      <circle cx="8" cy="8" r="2.25" />
      <path d="M8 1.5v1.75M8 12.75v1.75M14.5 8h-1.75M3.25 8H1.5M12.6 3.4l-1.24 1.24M4.64 11.36l-1.24 1.24M12.6 12.6l-1.24-1.24M4.64 4.64 3.4 3.4" />
    </>
  ),
  exit: (
    <>
      <path d="M6.25 3.25V2a.5.5 0 0 1 .5-.5h6.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-6.5a.5.5 0 0 1-.5-.5v-1.25" />
      <path d="M9.5 8h-8M4 5l-3 3 3 3" />
    </>
  ),
  bell: (
    <>
      <path d="M8 1.5a4 4 0 0 0-4 4v2.75c0 .9-.36 1.77-1 2.4l-.5.5h11l-.5-.5c-.64-.63-1-1.5-1-2.4V5.5a4 4 0 0 0-4-4Z" />
      <path d="M6.5 13.25c.25.7.85 1.25 1.5 1.25s1.25-.55 1.5-1.25" />
    </>
  ),
  search: (
    <>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3.5 3.5" />
    </>
  ),
  plus: (
    <>
      <path d="M8 2.5v11M2.5 8h11" />
    </>
  ),
  close: (
    <>
      <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" />
    </>
  ),
  "chevron-down": (
    <>
      <path d="m3.5 6 4.5 4 4.5-4" />
    </>
  ),
  "chevron-right": (
    <>
      <path d="m6 3.5 4 4.5-4 4.5" />
    </>
  ),
  "arrow-up-right": (
    <>
      <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
    </>
  ),
  "arrow-up": (
    <>
      <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
    </>
  ),
  "arrow-down": (
    <>
      <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
    </>
  ),
  edit: (
    <>
      <path d="M10.5 2.5 13.5 5.5 5 14l-3.5.5L2 11Z" />
      <path d="m9.25 3.75 3 3" />
    </>
  ),
  trash: (
    <>
      <path d="M2.5 4h11M5.5 4V2.5h5V4M3.75 4l.75 9.5a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5L12.25 4" />
      <path d="M6.5 6.5v5M9.5 6.5v5" />
    </>
  ),
  refresh: (
    <>
      <path d="M2 7.5A6 6 0 0 1 13 5.5" />
      <path d="M14 8.5A6 6 0 0 1 3 10.5" />
      <path d="M13 2v3.5H9.5M3 14v-3.5h3.5" />
    </>
  ),
  warning: (
    <>
      <path d="M8 1.5 14.75 13H1.25Z" />
      <path d="M8 6v3.5M8 11.25v.5" />
    </>
  ),
  check: (
    <>
      <path d="m2.5 8 3.5 3.5 7.5-7.5" />
    </>
  ),
  eye: (
    <>
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" />
      <circle cx="8" cy="8" r="2.25" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M2.75 3 13.25 13" />
      <path d="M6.25 4c.55-.16 1.14-.25 1.75-.25 4.5 0 7 4.25 7 4.25a13.5 13.5 0 0 1-1.9 2.4" />
      <path d="M4.1 5.25A13 13 0 0 0 1 8s2.5 4.25 7 4.25c1 0 1.9-.2 2.7-.55" />
      <path d="M9.8 9.8a2.25 2.25 0 0 1-3.1-3.1" />
    </>
  ),
  download: (
    <>
      <path d="M8 1.5V10M4 6l4 4 4-4" />
      <path d="M2 12.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1" />
    </>
  ),
  filter: (
    <>
      <path d="M1.5 3h13l-5 6v4l-3 1.5V9Z" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="7" width="10" height="7" rx="0.75" />
      <path d="M5 7V4.5a3 3 0 0 1 6 0V7" />
    </>
  ),
  mail: (
    <>
      <rect x="1.5" y="3" width="13" height="10" rx="0.5" />
      <path d="m1.5 3.5 6.5 5 6.5-5" />
    </>
  ),
  "calendar": (
    <>
      <rect x="2" y="3" width="12" height="11" rx="0.5" />
      <path d="M2 6h12M5 1.5V4M11 1.5V4" />
    </>
  ),
  box: (
    <>
      <path d="M2 4.5h12v9.5H2Z" />
      <path d="M5.5 4.5V2.5h5v2M6 9h4" />
    </>
  ),
  "stroke-mark": (
    <>
      <path d="M2 12 14 4" />
    </>
  ),
  spark: (
    <>
      <path d="M8 1.5v3.5M8 11v3.5M1.5 8h3.5M11 8h3.5" />
      <path d="M3.75 3.75 6 6M10 10l2.25 2.25M3.75 12.25 6 10M10 6l2.25-2.25" />
    </>
  ),
};

export default function Icon({ name, size = 16, strokeWidth = 1.5, className = "", style, ...rest }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
      {...rest}
    >
      {path}
    </svg>
  );
}
