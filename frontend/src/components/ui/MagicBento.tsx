'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode
} from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Lightweight inlined icon definitions so Vite dev optimizer never hangs on 50MB module scan
type IconTuple = [string, Record<string, string>];

export const GitBranchIcon: IconTuple[] = [
  ['path', { d: 'M7 19H13C15.8284 19 17.2426 19 18.1213 18.1213C19 17.2426 19 15.8284 19 13V10M19 10C19.7002 10 21.0085 11.9943 21.5 12.5M19 10C18.2998 10 16.9915 11.9943 16.5 12.5', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '0' }],
  ['path', { d: 'M5 7L5 17', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '1' }],
  ['circle', { cx: '5', cy: '5', r: '2', stroke: 'currentColor', strokeWidth: '1.5', key: '2' }],
  ['circle', { cx: '19', cy: '5', r: '2', stroke: 'currentColor', strokeWidth: '1.5', key: '3' }],
  ['circle', { cx: '5', cy: '19', r: '2', stroke: 'currentColor', strokeWidth: '1.5', key: '4' }]
];

export const Tick02Icon: IconTuple[] = [
  ['path', { d: 'M5 14L8.5 17.5L19 6.5', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '0' }]
];

export const SlackIcon: IconTuple[] = [
  ['path', { d: 'M13 9.25V3.75C13 2.7835 13.7835 2 14.75 2C15.7165 2 16.5 2.7835 16.5 3.75V9.25C16.5 10.2165 15.7165 11 14.75 11C13.7835 11 13 10.2165 13 9.25Z', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '0' }],
  ['path', { d: 'M7.5 20.25V14.75C7.5 13.7835 8.2835 13 9.25 13C10.2165 13 11 13.7835 11 14.75V20.25C11 21.2165 10.2165 22 9.25 22C8.2835 22 7.5 21.2165 7.5 20.25Z', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '1' }],
  ['path', { d: 'M14.75 13L20.25 13C21.2165 13 22 13.7835 22 14.75C22 15.7165 21.2165 16.5 20.25 16.5L14.75 16.5C13.7835 16.5 13 15.7165 13 14.75C13 13.7835 13.7835 13 14.75 13Z', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '2' }],
  ['path', { d: 'M3.75 7.5L9.25 7.5C10.2165 7.5 11 8.2835 11 9.25C11 10.2165 10.2165 11 9.25 11L3.75 11C2.7835 11 2 10.2165 2 9.25C2 8.2835 2.7835 7.5 3.75 7.5Z', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '3' }],
  ['path', { d: 'M7 3.75C7 4.7165 7.7835 5.5 8.75 5.5H10.5V3.75C10.5 2.7835 9.7165 2 8.75 2C7.7835 2 7 2.7835 7 3.75Z', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '1.5', key: '4' }],
  ['path', { d: 'M17 20.25C17 19.2835 16.2165 18.5 15.25 18.5H13.5V20.25C13.5 21.2165 14.2835 22 15.25 22C16.2165 22 17 21.2165 17 20.25Z', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '1.5', key: '5' }],
  ['path', { d: 'M20.25 7C19.2835 7 18.5 7.7835 18.5 8.75L18.5 10.5H20.25C21.2165 10.5 22 9.7165 22 8.75C22 7.7835 21.2165 7 20.25 7Z', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '1.5', key: '6' }],
  ['path', { d: 'M3.75 17C4.7165 17 5.5 16.2165 5.5 15.25V13.5L3.75 13.5C2.7835 13.5 2 14.2835 2 15.25C2 16.2165 2.7835 17 3.75 17Z', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '1.5', key: '7' }]
];

export const GithubIcon: IconTuple[] = [
  ['path', { d: 'M10 20.5675C6.57143 21.7248 3.71429 20.5675 2 17', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '0' }],
  ['path', { d: 'M10 22V18.7579C10 18.1596 10.1839 17.6396 10.4804 17.1699C10.6838 16.8476 10.5445 16.3904 10.1771 16.2894C7.13394 15.4528 5 14.1077 5 9.64606C5 8.48611 5.38005 7.39556 6.04811 6.4464C6.21437 6.21018 6.29749 6.09208 6.31748 5.9851C6.33746 5.87813 6.30272 5.73852 6.23322 5.45932C5.95038 4.32292 5.96871 3.11619 6.39322 2.02823C6.39322 2.02823 7.27042 1.74242 9.26698 2.98969C9.72282 3.27447 9.95075 3.41686 10.1515 3.44871C10.3522 3.48056 10.6206 3.41686 11.1611 3.25055C11.7107 3.0815 12.2882 3 13 3C13.7118 3 14.2893 3.0815 14.8389 3.25055C15.3794 3.41686 15.6478 3.48056 15.8485 3.44871C16.0493 3.41686 16.2772 3.27447 16.733 2.98969C18.7296 1.74242 19.6068 2.02823 19.6068 2.02823C20.0313 3.11619 20.0496 4.32292 19.7668 5.45932C19.6973 5.73852 19.6625 5.87813 19.6825 5.9851C19.7025 6.09208 19.7856 6.21018 19.9519 6.4464C20.6199 7.39556 21 8.48611 21 9.64606C21 14.1207 18.8475 15.4478 15.7766 16.2847C15.4143 16.3834 15.2759 16.8344 15.4746 17.1554C15.8159 17.7067 16 18.2691 16 19.0267V22', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '1' }]
];

export const FigmaIcon: IconTuple[] = [
  ['path', { d: 'M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '1.5', key: '0' }],
  ['path', { d: 'M9 21C10.6569 21 12 19.6569 12 18V15H9C7.34315 15 6 16.3431 6 18C6 19.6569 7.34315 21 9 21Z', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '1.5', key: '1' }],
  ['path', { d: 'M12 9V15H9C7.34315 15 6 13.6569 6 12C6 10.3431 7.34315 9 9 9H12Z', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '2' }],
  ['path', { d: 'M12 3V9H9C7.34315 9 6 7.65685 6 6C6 4.34315 7.34315 3 9 3H12Z', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '3' }],
  ['path', { d: 'M12 3V9H15C16.6569 9 18 7.65685 18 6C18 4.34315 16.6569 3 15 3H12Z', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '4' }]
];

export const NotionIcon: IconTuple[] = [
  ['path', { d: 'M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '1.5', key: '0' }],
  ['path', { d: 'M8.42857 10L13.5196 16.3964C13.716 16.6432 13.9002 16.8767 14.2159 16.9639C14.3466 17 14.4882 17 14.7714 17C15.0515 17 15.1915 17 15.2984 16.9455C15.5894 16.7973 15.5714 16.4841 15.5714 16.2V13.4286M8.42857 10V7M8.42857 10V17M8.42857 7H9.53035C10.0067 7 10.2448 7 10.4514 7.10018C10.6581 7.20035 10.8056 7.38733 11.1006 7.76128L15.5714 13.4286M8.42857 7H7M8.42857 17H7M8.42857 17H10M15.5714 7V13.4286M15.5714 7H14M15.5714 7H17', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '1' }]
];

export const SparklesIcon: IconTuple[] = [
  ['path', { d: 'M15 2L15.5387 4.39157C15.9957 6.42015 17.5798 8.00431 19.6084 8.46127L22 9L19.6084 9.53873C17.5798 9.99569 15.9957 11.5798 15.5387 13.6084L15 16L14.4613 13.6084C14.0043 11.5798 12.4202 9.99569 10.3916 9.53873L8 9L10.3916 8.46127C12.4201 8.00431 14.0043 6.42015 14.4613 4.39158L15 2Z', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '1.5', key: '0' }],
  ['path', { d: 'M7 12L7.38481 13.7083C7.71121 15.1572 8.84275 16.2888 10.2917 16.6152L12 17L10.2917 17.3848C8.84275 17.7112 7.71121 18.8427 7.38481 20.2917L7 22L6.61519 20.2917C6.28879 18.8427 5.15725 17.7112 3.70827 17.3848L2 17L3.70827 16.6152C5.15725 16.2888 6.28879 15.1573 6.61519 13.7083L7 12Z', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '1.5', key: '1' }]
];

export const Key01Icon: IconTuple[] = [
  ['path', { d: 'M15.5 14.5C18.8137 14.5 21.5 11.8137 21.5 8.5C21.5 5.18629 18.8137 2.5 15.5 2.5C12.1863 2.5 9.5 5.18629 9.5 8.5C9.5 9.38041 9.68962 10.2165 10.0303 10.9697L2.5 18.5V21.5H5.5V19.5H7.5V17.5H9.5L13.0303 13.9697C13.7835 14.3104 14.6196 14.5 15.5 14.5Z', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '0' }],
  ['path', { d: 'M17.5 6.5L16.5 7.5', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '1' }]
];

export const FingerPrintIcon: IconTuple[] = [
  ['path', { d: 'M7.42857 3.36201C11.3996 0.664089 17.136 2.12432 19.2301 6.41803M10.8571 21.9236C15.5839 22.5822 20 18.8952 20 14.2103V10.3333M7.42857 20.6058C5.35602 19.1977 4 16.8583 4 14.2103V9.75757C4 8.57285 4.27144 7.44988 4.75704 6.44444', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '0' }],
  ['path', { d: 'M16 13.8C16 16.1196 14.2091 18 12 18C9.79086 18 8 16.1196 8 13.8V10.2C8 9.55584 8.13811 8.94555 8.38493 8.4M12 6C14.2091 6 16 7.8804 16 10.2', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '1' }],
  ['path', { d: 'M12 10.5L12 13.5', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '1.5', key: '2' }]
];

export const HugeiconsIcon = ({
  icon,
  size = 14,
  strokeWidth = 1.8,
  className = ''
}: {
  icon: IconTuple[];
  size?: number;
  strokeWidth?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={{ strokeWidth }}
  >
    {icon.map(([tag, attrs], idx) => {
      const { key, ...rest } = attrs;
      if (tag === 'circle') {
        return <circle key={key || idx} {...(rest as any)} />;
      }
      return <path key={key || idx} {...(rest as any)} />;
    })}
  </svg>
);

export type MagicBentoVisual = 'analytics' | 'dashboard' | 'collaboration' | 'automation' | 'integration' | 'security';

export interface MagicBentoItem {
  id?: string | number;
  label?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  image?: string;
  visual?: MagicBentoVisual | ReactNode;
  content?: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  colSpan?: number;
  rowSpan?: number;
}

export interface MagicBentoProps {
  items?: MagicBentoItem[];
  columns?: number;
  rowHeight?: number;
  gap?: number;
  radius?: number;
  theme?: 'dark' | 'light';
  glowColor?: string;
  textAutoHide?: boolean;
  enableBorderGlow?: boolean;
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  enableStars?: boolean;
  particleCount?: number;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  intro?: boolean;
  disableAnimations?: boolean;
  onItemClick?: (item: MagicBentoItem, index: number) => void;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  items: MagicBentoItem[];
  columns: number;
  gap: number;
  enableBorderGlow: boolean;
  enableSpotlight: boolean;
  spotlightRadius: number;
  enableStars: boolean;
  particleCount: number;
  enableTilt: boolean;
  enableMagnetism: boolean;
  clickEffect: boolean;
  intro: boolean;
  disableAnimations: boolean;
  onItemClick?: (item: MagicBentoItem, index: number) => void;
  glow: number[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  rate: number;
}

interface CardState {
  hot: number;
  rx: number;
  ry: number;
  tx: number;
  ty: number;
  vrx: number;
  vry: number;
  vtx: number;
  vty: number;
  press: number;
  vpress: number;
  stars: number;
  particles: Particle[] | null;
  active: boolean;
  drawn?: boolean;
  written: Record<string, string>;
}

type Spring = ['rx' | 'ry' | 'tx' | 'ty', 'vrx' | 'vry' | 'vtx' | 'vty'];

const THEMES: Record<'dark' | 'light', Record<string, string | number>> = {
  dark: {
    '--mb-surface': 'linear-gradient(180deg, #1f1e1c 0%, #171717 100%)',
    '--mb-edge': 'rgba(214, 184, 117, 0.16)',
    '--mb-highlight': 'rgba(255, 255, 255, 0.08)',
    '--mb-shadow': '0 24px 48px -28px rgba(0, 0, 0, 0.85), 0 8px 18px -12px rgba(0, 0, 0, 0.6)',
    '--mb-tile': 'linear-gradient(180deg, #2b2824 0%, #1f1e1c 100%)',
    '--mb-tile-edge': 'rgba(214, 184, 117, 0.18)',
    '--mb-tile-highlight': 'rgba(255, 255, 255, 0.08)',
    '--mb-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--mb-well': 'rgba(255, 255, 255, 0.03)',
    '--mb-well-edge': 'rgba(214, 184, 117, 0.12)',
    '--mb-ink': '#f5f1e8',
    '--mb-muted': 'rgba(245, 241, 232, 0.65)',
    '--mb-faint': 'rgba(245, 241, 232, 0.3)',
    '--mb-line': 'rgba(245, 241, 232, 0.12)',
    '--mb-secondary': '#D6B875',
    '--mb-secondary-ink': '#171717',
    '--mb-cursor-stroke': 'rgba(23, 23, 23, 0.9)',
    '--mb-ring': 'rgba(23, 23, 23, 0.85)',
    '--mb-focus': 'rgba(214, 184, 117, 0.5)',
    '--mb-glow-alpha': 0.85,
    '--mb-spot-alpha': 0.08
  },
  light: {
    '--mb-surface': 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F3 100%)',
    '--mb-edge': 'rgba(23, 23, 23, 0.07)',
    '--mb-highlight': '#FFFFFF',
    '--mb-shadow': '0 20px 42px -28px rgba(23, 23, 23, 0.12), 0 6px 14px -8px rgba(23, 23, 23, 0.06)',
    '--mb-tile': 'linear-gradient(180deg, #FFFFFF 0%, #F5F1E8 100%)',
    '--mb-tile-edge': 'rgba(214, 184, 117, 0.25)',
    '--mb-tile-highlight': '#FFFFFF',
    '--mb-tile-shadow': '0 4px 12px -5px rgba(23, 23, 23, 0.08)',
    '--mb-well': 'rgba(23, 23, 23, 0.025)',
    '--mb-well-edge': 'rgba(23, 23, 23, 0.06)',
    '--mb-ink': '#171717',
    '--mb-muted': 'rgba(23, 23, 23, 0.65)',
    '--mb-faint': 'rgba(23, 23, 23, 0.3)',
    '--mb-line': 'rgba(23, 23, 23, 0.08)',
    '--mb-secondary': '#8C867A',
    '--mb-secondary-ink': '#FFFFFF',
    '--mb-cursor-stroke': '#FFFFFF',
    '--mb-ring': '#FFFFFF',
    '--mb-focus': 'rgba(214, 184, 117, 0.5)',
    '--mb-glow-alpha': 0.65,
    '--mb-spot-alpha': 0.045
  }
};

const INK: Record<'dark' | 'light', number[]> = { dark: [244, 244, 245], light: [24, 24, 27] };
const MIN_CELL = 150;
const MIN_PAIR = 200;
const STAGGER = 80;
const TILT = 6;
const MAGNET = 6;

const ROOT_CLASS =
  'magic-bento relative box-border grid w-full [grid-auto-flow:row_dense] text-[color:var(--mb-ink)] [-webkit-tap-highlight-color:transparent]';
const CELL_CLASS = 'magic-bento__cell relative min-h-0 min-w-0 [--mb-delay:0ms]';
const CARD_CLASS =
  'magic-bento__card relative box-border isolate flex h-full w-full select-none flex-col overflow-hidden rounded-[var(--mb-radius)] text-[color:var(--mb-ink)] no-underline outline-none [background:var(--mb-surface)] [box-shadow:var(--mb-shadow)] [transform:perspective(900px)_translate3d(var(--mb-tx,0px),var(--mb-ty,0px),0)_rotateX(var(--mb-rx,0deg))_rotateY(var(--mb-ry,0deg))_scale(var(--mb-press,1))] data-[clickable]:cursor-pointer focus-visible:[box-shadow:var(--mb-shadow),0_0_0_2px_var(--mb-focus)]';
const IMAGE_CLASS = 'pointer-events-none absolute inset-0 z-0 h-full w-full object-cover';
const SCRIM_CLASS = 'pointer-events-none absolute inset-0 z-0';
const LIGHT_CLASS = 'pointer-events-none absolute inset-0 z-[1] rounded-[inherit]';
const STARS_CLASS = 'pointer-events-none absolute inset-0 z-[1] block h-full w-full';
const RIM_CLASS =
  'pointer-events-none absolute inset-0 z-[3] rounded-[inherit] [box-shadow:inset_0_0_0_1px_var(--mb-edge),inset_0_1px_0_var(--mb-highlight)]';
const BORDER_CLASS = 'pointer-events-none absolute inset-0 z-[4] box-border rounded-[inherit] p-px';
const CONTENT_CLASS = 'relative z-[2] box-border flex min-h-0 flex-1 flex-col gap-3 p-[var(--mb-pad)]';
const HEADER_CLASS =
  'flex min-w-0 items-center gap-2 text-[12px] leading-4 font-medium text-[color:var(--mb-muted)] [[data-image]_&]:text-[rgba(244,244,245,0.72)]';
const ICON_CLASS =
  'grid h-4 w-4 flex-none place-items-center text-[color:var(--mb-ink)] [[data-image]_&]:text-[#f4f4f5]';
const LABEL_CLASS = 'overflow-hidden text-ellipsis whitespace-nowrap tracking-wider uppercase text-[11px] font-semibold text-[#8C867A]';
const VISUAL_CLASS = 'relative flex min-h-0 flex-1 flex-col justify-center [container-type:size]';
const TEXT_CLASS = 'mt-auto flex flex-col gap-1';
const TITLE_CLASS =
  'm-0 text-[15px] leading-5 font-semibold tracking-[-0.01em] text-[color:var(--mb-ink)] [[data-image]_&]:text-[#f4f4f5] [[data-autohide]_&]:line-clamp-1';
const DESCRIPTION_CLASS =
  'm-0 text-[13px] leading-[1.45] text-[color:var(--mb-muted)] [[data-image]_&]:text-[rgba(244,244,245,0.72)] [[data-autohide]_&]:line-clamp-2';
const CHART_CLASS = 'magic-bento__chart flex min-h-0 flex-1 touch-pan-y flex-col';
const FIGURE_CLASS = 'flex min-w-0 items-baseline gap-1.5 whitespace-nowrap';
const FIGURE_VALUE_CLASS =
  'text-[15px] leading-[18px] font-semibold tracking-[-0.02em] text-[color:var(--mb-ink)] tabular-nums';
const FIGURE_NOTE_CLASS =
  'min-w-0 overflow-hidden text-ellipsis text-[11.5px] leading-[14px] text-[color:var(--mb-muted)] tabular-nums';
const PLOT_CLASS =
  'relative mt-1.5 min-h-0 flex-1 [&_svg]:absolute [&_svg]:inset-0 [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:overflow-visible';
const CHART_AREA_CLASS = 'magic-bento__chart-area [fill:rgba(var(--mb-accent-rgb),0.14)]';
const CHART_LINE_CLASS =
  'magic-bento__chart-line fill-none [stroke:rgb(var(--mb-accent-rgb))] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.6]';
const SCRUB_CLASS =
  'pointer-events-none absolute top-0 bottom-0 left-0 w-px opacity-0 transition-opacity duration-[180ms] [background:linear-gradient(to_bottom,rgba(var(--mb-accent-rgb),0),rgba(var(--mb-accent-rgb),0.35))] [[data-scrub]_&]:opacity-100';
const SCRUB_DOT_CLASS =
  'absolute top-0 left-0 -mt-[3.5px] -ml-[3px] h-[7px] w-[7px] rounded-full [background:rgb(var(--mb-accent-rgb))] [box-shadow:0_0_0_3px_var(--mb-ring)]';
const BARS_CLASS = 'magic-bento__bars flex min-h-0 flex-1 flex-col';
const BARS_PLOT_CLASS = 'mt-2 flex min-h-0 flex-1 items-end gap-[5px]';
const BAR_CLASS =
  'magic-bento__bar relative h-[calc(var(--h)*100%)] min-h-[3px] flex-1 origin-bottom rounded-[3px_3px_2px_2px] bg-[rgba(var(--mb-accent-rgb),0.22)] transition-[background-color,filter] duration-200 hover:bg-[rgba(var(--mb-accent-rgb),0.48)] data-[peak]:bg-[rgb(var(--mb-accent-rgb))] data-[peak]:hover:brightness-110';
const COLLAB_CLASS =
  'relative flex min-h-0 flex-col overflow-hidden px-4 pt-4 pb-[22px] rounded-[var(--mb-inner-radius)] [background:var(--mb-well)] [box-shadow:inset_0_0_0_1px_var(--mb-well-edge)]';
const DOC_TITLE_CLASS = 'text-[13px] leading-[18px] font-semibold text-[color:var(--mb-ink)]';
const LINES_CLASS = 'mt-[18px] flex flex-col gap-2.5';
const LINE_CLASS = 'relative h-1.5 w-[var(--w)] rounded-[3px] [background:var(--mb-line)]';
const LINE_GAP_CLASS = 'relative mt-2 h-1.5 w-[var(--w)] rounded-[3px] [background:var(--mb-line)]';
const SELECTION_CLASS =
  'magic-bento__selection absolute -top-1 -bottom-1 left-[var(--from)] w-[var(--span)] rounded-[3px] bg-[rgba(var(--mb-accent-rgb),0.16)]';
const CARET_CLASS =
  'magic-bento__caret absolute -top-[5px] -right-px -bottom-[5px] w-[1.5px] rounded-[1px] [background:rgb(var(--mb-accent-rgb))]';
const CURSOR_PRIMARY_CLASS =
  'magic-bento__cursor pointer-events-none absolute top-[var(--y)] left-[var(--x)] z-[2] flex items-start [&_svg]:block [&_svg]:flex-none [&_svg]:[filter:drop-shadow(0_1px_1.5px_rgba(0,0,0,0.35))] [&_path]:[fill:rgb(var(--mb-accent-rgb))] [&_path]:[stroke:var(--mb-cursor-stroke)]';
const CURSOR_SECONDARY_CLASS =
  'magic-bento__cursor pointer-events-none absolute top-[var(--y)] left-[var(--x)] z-[2] flex items-start [&_svg]:block [&_svg]:flex-none [&_svg]:[filter:drop-shadow(0_1px_1.5px_rgba(0,0,0,0.35))] [&_path]:[fill:var(--mb-secondary)] [&_path]:[stroke:var(--mb-cursor-stroke)]';
const NAME_PRIMARY_CLASS =
  'mt-[13px] -ml-[2px] rounded-[7px] px-[7px] py-[2px] text-[10.5px] leading-[14px] font-semibold whitespace-nowrap text-[color:var(--mb-accent-ink)] [background:rgb(var(--mb-accent-rgb))]';
const NAME_SECONDARY_CLASS =
  'mt-[13px] -ml-[2px] rounded-[7px] px-[7px] py-[2px] text-[10.5px] leading-[14px] font-semibold whitespace-nowrap text-[color:var(--mb-secondary-ink)] [background:var(--mb-secondary)]';
const FLOW_CLASS = 'relative flex min-h-0 flex-col gap-2';
const FLOW_TRIGGER_CLASS =
  "relative box-border flex items-center gap-2.5 rounded-[var(--mb-inner-radius)] py-2 pr-3 pl-2 [background:var(--mb-tile)] [box-shadow:var(--mb-tile-shadow)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:[box-shadow:inset_0_0_0_1px_var(--mb-tile-edge),inset_0_1px_0_var(--mb-tile-highlight)]";
const FLOW_GLYPH_CLASS =
  'grid h-7 w-7 flex-none place-items-center rounded-[calc(var(--mb-inner-radius)-2px)] text-[color:var(--mb-ink)] [background:var(--mb-well)]';
const FLOW_COPY_CLASS = 'flex min-w-0 flex-col';
const FLOW_NAME_CLASS =
  'overflow-hidden text-ellipsis whitespace-nowrap text-[13px] leading-[17px] font-semibold text-[color:var(--mb-ink)]';
const FLOW_HASH_CLASS =
  'overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] leading-[15px] text-[color:var(--mb-muted)]';
const STEPS_CLASS =
  'magic-bento__steps relative m-0 flex list-none flex-col gap-[2px] p-0 pt-[2px] rounded-[var(--mb-inner-radius)] [background:var(--mb-well)] [box-shadow:inset_0_0_0_1px_var(--mb-well-edge)]';
const RAIL_CLASS = 'absolute top-4 bottom-4 left-[21px] w-px [background:var(--mb-line)]';
const RAIL_FILL_CLASS = 'magic-bento__rail-fill absolute inset-0 origin-top bg-[rgba(var(--mb-accent-rgb),0.55)]';
const STEP_CLASS =
  'relative flex h-[33px] items-center gap-2.5 pr-3 pl-3.5 text-[13px] leading-4 text-[color:var(--mb-ink)]';
const STATUS_CLASS = 'relative grid h-4 w-4 flex-none place-items-center [&>*]:[grid-area:1/1]';
const PENDING_CLASS =
  'magic-bento__pending box-border h-3 w-3 rounded-full border-[1.5px] border-dashed border-[color:var(--mb-faint)] opacity-0';
const SPINNER_CLASS =
  'magic-bento__spinner box-border h-3.5 w-3.5 rounded-full border-[1.5px] border-solid border-[rgba(var(--mb-accent-rgb),0.22)] border-t-[rgb(var(--mb-accent-rgb))] opacity-0';
const DONE_CLASS =
  'magic-bento__done grid h-4 w-4 place-items-center rounded-full text-[color:var(--mb-accent-ink)] [background:rgb(var(--mb-accent-rgb))]';
const STEP_TIME_CLASS = 'magic-bento__step-time ml-auto text-[12px] text-[color:var(--mb-muted)] tabular-nums';
const HUB_CLASS = 'magic-bento__hub relative mx-auto min-h-0 w-full max-w-[240px] flex-1';
const HUB_LINKS_CLASS =
  'magic-bento__hub-links absolute inset-0 h-full w-full overflow-visible [&_line]:[stroke:var(--mb-line)] [&_line]:[stroke-width:1] [&_line]:[vector-effect:non-scaling-stroke]';
const HUB_NODE_CLASS =
  "magic-bento__hub-node absolute top-[var(--y)] left-[var(--x)] -mt-[calc(var(--size)*0.5)] -ml-[calc(var(--size)*0.5)] box-border grid h-[var(--size)] w-[var(--size)] place-items-center rounded-[calc(var(--size)*0.3)] text-[color:var(--mb-ink)] [--size:min(var(--s),30cqh)] [background:var(--mb-tile)] [box-shadow:var(--mb-tile-shadow)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:[box-shadow:inset_0_0_0_1px_var(--mb-tile-edge),inset_0_1px_0_var(--mb-tile-highlight)]";
const PACKET_CLASS =
  'magic-bento__packet absolute top-[var(--y)] left-[var(--x)] -mt-[2px] -ml-[2px] h-1 w-1 rounded-full opacity-0 [background:rgb(var(--mb-accent-rgb))]';
const SHIELD_CLASS = 'magic-bento__shield flex min-h-0 w-full max-w-[320px] flex-1 flex-col justify-center gap-2';
const SETTING_CLASS =
  "magic-bento__setting relative box-border flex h-8 flex-none items-center gap-2 rounded-[var(--mb-inner-radius)] pr-2 pl-2.5 text-[12.5px] leading-4 font-medium text-[color:var(--mb-ink)] [background:var(--mb-tile)] [box-shadow:var(--mb-tile-shadow)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:[box-shadow:inset_0_0_0_1px_var(--mb-tile-edge),inset_0_1px_0_var(--mb-tile-highlight)]";
const SETTING_LABEL_CLASS = 'overflow-hidden text-ellipsis whitespace-nowrap';
const SWITCH_CLASS = 'magic-bento__switch relative ml-auto h-4 w-[26px] flex-none rounded-lg';

const SCRIM_STYLE: CSSProperties = {
  background:
    'linear-gradient(to top, rgba(10, 9, 13, 0.82) 0%, rgba(10, 9, 13, 0.7) 14%, rgba(10, 9, 13, 0.46) 30%, rgba(10, 9, 13, 0.2) 46%, rgba(10, 9, 13, 0.05) 60%, rgba(10, 9, 13, 0) 72%)'
};

const FALLOFF = [1, 0.973, 0.837, 0.593, 0.317, 0.104, 0.009];

const glowStops = (alpha: string, weight: string) =>
  `${FALLOFF.map(
    (fall, index) => `rgba(var(--mb-glow-rgb), calc(var(${alpha}) * var(${weight}, 0) * ${fall})) ${index * 15}%`
  ).join(', ')}, rgba(var(--mb-glow-rgb), 0) 100%`;

const LIGHT_STYLE: CSSProperties = {
  background: `radial-gradient(var(--mb-spot-size) circle at var(--mb-x, -999px) var(--mb-y, -999px), ${glowStops('--mb-spot-alpha', '--mb-hot')})`
};

const WAVE: [string, string][] = [
  ['0', '110px'],
  ['0.1', '80px'],
  ['0.32', '52px'],
  ['0.68', '28px'],
  ['0.94', '10px'],
  ['1', '3px']
];

const BORDER_STYLE: CSSProperties = {
  background: `radial-gradient(var(--mb-border-size) circle at var(--mb-x, -999px) var(--mb-y, -999px), ${glowStops('--mb-glow-alpha', '--mb-near')}), radial-gradient(circle at var(--mb-wx, -999px) var(--mb-wy, -999px), ${WAVE.map(
    ([alpha, offset]) =>
      `rgba(var(--mb-glow-rgb), calc(var(--mb-glow-alpha) * var(--mb-wa, 0) * ${alpha})) calc(var(--mb-wr, 0px) - ${offset})`
  ).join(', ')}, rgba(var(--mb-glow-rgb), 0) var(--mb-wr, 0px))`,
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
  mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)'
};

const STYLE = `
.magic-bento{--mb-spring:cubic-bezier(0.34, 1.4, 0.64, 1)}
@supports (transition-timing-function: linear(0,1)){.magic-bento{--mb-spring: linear( 0,0.0603,0.2033,0.3821,0.5633,0.7258,0.8584,0.9574,1.0242,1.0634,1.0809,1.0828,1.0747,1.0613,1.046,1.0313,1.0186,1.0085,1.0012,0.9965,0.994,0.9931,0.9933,0.9941,0.9953,0.9966,0.9978,0.9988,1 )}}
.magic-bento[data-intro] .magic-bento__cell{opacity: 0;transform: translate3d(0,16px,0) scale(0.97)}
.magic-bento[data-intro] .magic-bento__cell[data-state='in']{opacity: 1;transform: none;transition: opacity 420ms cubic-bezier(0.22,1,0.36,1) var(--mb-delay),transform 760ms var(--mb-spring) var(--mb-delay)}
@container (max-height: 78px){.magic-bento__setting ~ .magic-bento__setting{display: none}}
@container (max-height: 60px){.magic-bento__hub{display: none}}
@container (max-height: 38px){.magic-bento__shield,.magic-bento__chart,.magic-bento__bars{visibility: hidden}}
.magic-bento__switch{position: relative;width: 26px;height: 16px;flex: none;margin-left: auto;border-radius: 8px;background: rgb(var(--mb-accent-rgb));transition: background-color 220ms ease}
.magic-bento__switch::after{content: '';position: absolute;top: 2px;left: 2px;width: 12px;height: 12px;border-radius: 50%;background: var(--mb-accent-ink);box-shadow: 0 1px 2px rgba(0,0,0,0.3);transform: translateX(10px);transition: transform 320ms var(--mb-spring)}
.magic-bento__switch[data-off]{background: var(--mb-line)}
.magic-bento__switch[data-off]::after{background: var(--mb-ink);transform: none}
.magic-bento[data-motion] .magic-bento__chart-line{stroke-dasharray: 1;animation: magic-bento-draw 1100ms cubic-bezier(0.65,0,0.35,1) calc(var(--mb-delay) + 220ms) both paused}
.magic-bento[data-motion] .magic-bento__chart-area{animation: magic-bento-fade 700ms ease calc(var(--mb-delay) + 700ms) both paused}
.magic-bento[data-motion] .magic-bento__bar{animation: magic-bento-grow 760ms var(--mb-spring) calc(var(--mb-delay) + 200ms + var(--i) * 55ms) both paused}
.magic-bento[data-motion] .magic-bento__cursor{animation: magic-bento-pop 420ms var(--mb-spring) calc(var(--mb-delay) + 600ms + var(--i) * 160ms) both paused,var(--path) 9s ease-in-out calc(var(--i) * -3s) infinite paused}
.magic-bento[data-motion] .magic-bento__selection{animation: magic-bento-select 900ms cubic-bezier(0.65,0,0.35,1) calc(var(--mb-delay) + 760ms) both paused}
.magic-bento[data-motion] .magic-bento__caret{animation: magic-bento-blink 1.1s steps(1) infinite paused}
.magic-bento[data-motion] .magic-bento__pending{animation: magic-bento-wait 1ms linear calc(var(--mb-delay) + 360ms + var(--i) * 520ms) both paused}
.magic-bento[data-motion] .magic-bento__spinner{animation: magic-bento-run 520ms linear calc(var(--mb-delay) + 360ms + var(--i) * 520ms) both paused,magic-bento-spin 700ms linear infinite paused}
.magic-bento[data-motion] .magic-bento__done{animation: magic-bento-check 420ms var(--mb-spring) calc(var(--mb-delay) + 880ms + var(--i) * 520ms) both paused}
.magic-bento[data-motion] .magic-bento__step-time{animation: magic-bento-fade 300ms ease calc(var(--mb-delay) + 880ms + var(--i) * 520ms) both paused}
.magic-bento[data-motion] .magic-bento__rail-fill{animation: magic-bento-rail calc(var(--n) * 520ms) linear calc(var(--mb-delay) + 360ms) both paused}
.magic-bento[data-motion] .magic-bento__hub-node{animation: magic-bento-pop 520ms var(--mb-spring) calc(var(--mb-delay) + 200ms + var(--i) * 70ms) both paused}
.magic-bento[data-motion] .magic-bento__hub-links line{stroke-dasharray: 1;animation: magic-bento-draw 700ms cubic-bezier(0.65,0,0.35,1) calc(var(--mb-delay) + 360ms) both paused}
.magic-bento[data-motion] .magic-bento__card[data-active] .magic-bento__packet{animation: magic-bento-packet 1.8s cubic-bezier(0.45,0,0.55,1) calc(var(--i) * 0.45s) infinite}
.magic-bento[data-motion] .magic-bento__switch{animation: magic-bento-switch-track 420ms ease calc(var(--mb-delay) + 520ms + var(--i) * 200ms) both paused}
.magic-bento[data-motion] .magic-bento__switch::after{animation: magic-bento-switch-knob 520ms var(--mb-spring) calc(var(--mb-delay) + 520ms + var(--i) * 200ms) both paused}
.magic-bento[data-motion] .magic-bento__switch[data-off],.magic-bento[data-motion] .magic-bento__switch[data-off]::after{animation: none}
.magic-bento[data-motion] .magic-bento__cell[data-state='in'] :is( .magic-bento__chart-line,.magic-bento__chart-area,.magic-bento__bar,.magic-bento__selection,.magic-bento__pending,.magic-bento__spinner,.magic-bento__done,.magic-bento__step-time,.magic-bento__rail-fill,.magic-bento__hub-node,.magic-bento__hub-links line,.magic-bento__switch ){animation-play-state: running}
.magic-bento[data-motion] .magic-bento__cell[data-state='in'] .magic-bento__switch::after{animation-play-state: running}
.magic-bento[data-motion] .magic-bento__cell[data-state='in'] .magic-bento__cursor{animation-play-state: running,paused}
.magic-bento[data-motion] .magic-bento__cell[data-state='in'] .magic-bento__card[data-active] .magic-bento__cursor{animation-play-state: running,running}
.magic-bento[data-motion] .magic-bento__card[data-active] .magic-bento__caret{animation-play-state: running}
.magic-bento[data-motion] .magic-bento__cell[data-state='in'] .magic-bento__spinner{animation-play-state: running,running}
@keyframes magic-bento-draw{from{stroke-dashoffset: 1}to{stroke-dashoffset: 0}}
@keyframes magic-bento-fade{from{opacity: 0}to{opacity: 1}}
@keyframes magic-bento-grow{from{transform: scaleY(0)}to{transform: scaleY(1)}}
@keyframes magic-bento-pop{from{opacity: 0;scale: 0.6}to{opacity: 1;scale: 1}}
@keyframes magic-bento-select{from{clip-path: inset(0 100% 0 0)}to{clip-path: inset(0 0 0 0)}}
@keyframes magic-bento-blink{0%{opacity: 1}50%{opacity: 0}}
@keyframes magic-bento-wait{from{opacity: 1}to{opacity: 0}}
@keyframes magic-bento-run{0%{opacity: 0}1%,92%{opacity: 1}100%{opacity: 0}}
@keyframes magic-bento-spin{to{rotate: 360deg}}
@keyframes magic-bento-check{from{opacity: 0;scale: 0.4}to{opacity: 1;scale: 1}}
@keyframes magic-bento-rail{from{transform: scaleY(0)}to{transform: scaleY(1)}}
@keyframes magic-bento-packet{0%{top: var(--y);left: var(--x);opacity: 0}15%{opacity: 1}80%{opacity: 1}100%{top: 50%;left: 50%;opacity: 0}}
@keyframes magic-bento-switch-track{from{background-color: var(--mb-line)}to{background-color: rgb(var(--mb-accent-rgb))}}
@keyframes magic-bento-switch-knob{from{background: var(--mb-ink);transform: none}to{background: var(--mb-accent-ink);transform: translateX(10px)}}
@keyframes magic-bento-path-a{0%,100%{translate: 0 0}30%{translate: 46px -18px}62%{translate: 12px 26px}}
@keyframes magic-bento-path-b{0%,100%{translate: 0 0}35%{translate: -40px 14px}70%{translate: -8px -22px}}
`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const vars = (values: Record<string, string | number>) => values as CSSProperties;

const parseRgb = (value?: string | null): number[] | null => {
  if (!value) return null;
  const text = String(value).trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16));
  }
  const numbers = text.match(/[\d.]+/g);
  if (numbers && numbers.length >= 3 && /^(rgba?\(|[\d.\s,]+$)/i.test(text)) {
    return numbers.slice(0, 3).map(channel => clamp(Math.round(parseFloat(channel)), 0, 255));
  }
  return null;
};

const inkFor = (rgb: number[]) => {
  const [r, g, b] = rgb.map(channel => channel / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#121016' : '#ffffff';
};

const CHART = [3.1, 3.8, 3.5, 4.9, 4.4, 5.8, 5.3, 6.9, 6.5, 8.2, 9.4, 12.4];

const curve = (values: number[], width: number, height: number) => {
  const top = 6;
  const bottom = 2;
  const low = Math.min(...values) * 0.7;
  const high = Math.max(...values);
  const points: number[][] = values.map((value, index) => [
    (index / (values.length - 1)) * width,
    top + (1 - (value - low) / (high - low)) * (height - top - bottom)
  ]);
  const count = points.length;
  const slopes: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    slopes.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]));
  }
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === count - 1) return slopes[count - 2];
    return slopes[i - 1] * slopes[i] > 0 ? (slopes[i - 1] + slopes[i]) / 2 : 0;
  });
  for (let i = 0; i < count - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const length = a * a + b * b;
    if (length > 9) {
      const scale = 3 / Math.sqrt(length);
      tangents[i] = scale * a * slopes[i];
      tangents[i + 1] = scale * b * slopes[i];
    }
  }
  let line = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  const samples: number[][] = [];
  for (let i = 0; i < count - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const third = (x1 - x0) / 3;
    const c1 = [x0 + third, y0 + tangents[i] * third];
    const c2 = [x1 - third, y1 - tangents[i + 1] * third];
    line += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`;
    for (let step = 0; step < 12; step++) {
      const t = step / 12;
      const u = 1 - t;
      samples.push([
        u * u * u * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * x1,
        u * u * u * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * y1
      ]);
    }
  }
  samples.push(points[count - 1]);
  const area = `${line} L${width.toFixed(2)},${height.toFixed(2)} L0,${height.toFixed(2)} Z`;
  return { line, area, samples };
};

const sampleAt = (samples: number[][], x: number) => {
  let index = 1;
  while (index < samples.length - 1 && samples[index][0] < x) index++;
  const [x0, y0] = samples[index - 1];
  const [x1, y1] = samples[index];
  const t = x1 === x0 ? 0 : clamp((x - x0) / (x1 - x0), 0, 1);
  return y0 + (y1 - y0) * t;
};

const AnalyticsVisual = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const noteRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;
    const update = () => {
      const next = { width: plot.clientWidth, height: plot.clientHeight };
      setSize(previous =>
        previous && previous.width === next.width && previous.height === next.height ? previous : next
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(plot);
    return () => observer.disconnect();
  }, []);

  const shape = useMemo(
    () => (size && size.width > 4 && size.height > 4 ? curve(CHART, size.width, size.height) : null),
    [size]
  );

  const scrub = (event: ReactPointerEvent<HTMLDivElement>) => {
    const plot = plotRef.current;
    const chart = chartRef.current;
    const line = scrubRef.current;
    const dot = dotRef.current;
    const label = valueRef.current;
    const note = noteRef.current;
    if (!shape || !plot || !chart || !line || !dot || !label || !note) return;
    const rect = plot.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = sampleAt(shape.samples, x);
    const position = (x / Math.max(1, rect.width)) * (CHART.length - 1);
    const index = Math.floor(position);
    const next = Math.min(CHART.length - 1, index + 1);
    const value = CHART[index] + (CHART[next] - CHART[index]) * (position - index);
    chart.dataset.scrub = '';
    line.style.transform = `translateX(${x.toFixed(1)}px)`;
    dot.style.transform = `translateY(${y.toFixed(1)}px)`;
    label.textContent = `${value.toFixed(1)}k`;
    note.textContent = `Oct ${Math.round(position) + 1}`;
  };

  const rest = () => {
    if (chartRef.current) delete chartRef.current.dataset.scrub;
    if (valueRef.current) valueRef.current.textContent = `${CHART[CHART.length - 1].toFixed(1)}k`;
    if (noteRef.current) noteRef.current.textContent = '+18%';
  };

  return (
    <div ref={chartRef} className={CHART_CLASS} onPointerMove={scrub} onPointerDown={scrub} onPointerLeave={rest}>
      <div className={FIGURE_CLASS}>
        <span ref={valueRef} className={FIGURE_VALUE_CLASS}>
          {CHART[CHART.length - 1].toFixed(1)}k
        </span>
        <span ref={noteRef} className={FIGURE_NOTE_CLASS}>
          +18%
        </span>
      </div>
      <div ref={plotRef} className={PLOT_CLASS}>
        {shape && size && (
          <svg viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
            <path className={CHART_AREA_CLASS} d={shape.area} />
            <path className={CHART_LINE_CLASS} d={shape.line} pathLength="1" />
          </svg>
        )}
        <span ref={scrubRef} className={SCRUB_CLASS}>
          <span ref={dotRef} className={SCRUB_DOT_CLASS} />
        </span>
      </div>
    </div>
  );
};

const BARS = [42, 58, 49, 71, 63, 88, 76];

const DashboardVisual = () => (
  <div className={BARS_CLASS}>
    <div className={FIGURE_CLASS}>
      <span className={FIGURE_VALUE_CLASS}>$48.2k</span>
      <span className={FIGURE_NOTE_CLASS}>Weekly</span>
    </div>
    <div className={BARS_PLOT_CLASS}>
      {BARS.map((height, index) => (
        <span
          key={index}
          className={BAR_CLASS}
          data-peak={height === Math.max(...BARS) ? '' : undefined}
          style={vars({ '--h': height / 100, '--i': index })}
        />
      ))}
    </div>
  </div>
);

const ARROW = (
  <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
    <path
      d="M2.2 1.6 13.4 9.9c.5.4.3 1.2-.4 1.3l-4.6.6-2.2 4.2c-.3.6-1.2.5-1.4-.1L1.2 2.4c-.2-.6.5-1.1 1-.8Z"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

const CollaborationVisual = () => (
  <div className={COLLAB_CLASS}>
    <span className={DOC_TITLE_CLASS}>Bespoke Glaze Formulation</span>
    <div className={LINES_CLASS}>
      <span className={LINE_CLASS} style={vars({ '--w': '92%' })} />
      <span className={LINE_CLASS} style={vars({ '--w': '78%' })} />
      <span className={LINE_CLASS} style={vars({ '--w': '86%' })} />
      <span className={LINE_CLASS} style={vars({ '--w': '44%' })} />
      <span className={LINE_GAP_CLASS} style={vars({ '--w': '88%' })} />
      <span className={LINE_CLASS} style={vars({ '--w': '70%' })}>
        <span className={SELECTION_CLASS} style={vars({ '--from': '18%', '--span': '58%' })}>
          <span className={CARET_CLASS} />
        </span>
      </span>
      <span className={LINE_CLASS} style={vars({ '--w': '82%' })} />
    </div>
    <span
      className={CURSOR_PRIMARY_CLASS}
      style={vars({ '--x': '58%', '--y': '52%', '--i': 0, '--path': 'magic-bento-path-a' })}
    >
      {ARROW}
      <span className={NAME_PRIMARY_CLASS}>Kenji (Kyoto)</span>
    </span>
    <span
      className={CURSOR_SECONDARY_CLASS}
      style={vars({ '--x': '30%', '--y': '24%', '--i': 1, '--path': 'magic-bento-path-b' })}
    >
      {ARROW}
      <span className={NAME_SECONDARY_CLASS}>Curator Elena</span>
    </span>
  </div>
);

const STEPS = [
  { label: 'Clay Sourcing', time: '1d' },
  { label: 'Hand Shaping', time: '4h' },
  { label: 'Glaze Dipping', time: '12h' },
  { label: 'Wood-Kiln Firing', time: '36h' }
];

const AutomationVisual = () => (
  <div className={FLOW_CLASS} style={vars({ '--n': STEPS.length })}>
    <div className={FLOW_TRIGGER_CLASS}>
      <span className={FLOW_GLYPH_CLASS}>
        <HugeiconsIcon icon={GitBranchIcon} size={15} strokeWidth={1.8} />
      </span>
      <span className={FLOW_COPY_CLASS}>
        <span className={FLOW_NAME_CLASS}>Batch #48 Anagama</span>
        <span className={FLOW_HASH_CLASS}>kyoto-wood-1280C</span>
      </span>
    </div>
    <ol className={STEPS_CLASS}>
      <span className={RAIL_CLASS} aria-hidden="true">
        <span className={RAIL_FILL_CLASS} />
      </span>
      {STEPS.map((step, index) => (
        <li key={step.label} className={STEP_CLASS} style={vars({ '--i': index })}>
          <span className={STATUS_CLASS}>
            <span className={PENDING_CLASS} />
            <span className={SPINNER_CLASS} />
            <span className={DONE_CLASS}>
              <HugeiconsIcon icon={Tick02Icon} size={11} strokeWidth={2.6} />
            </span>
          </span>
          {step.label}
          <span className={STEP_TIME_CLASS}>{step.time}</span>
        </li>
      ))}
    </ol>
  </div>
);

const APPS = [
  { icon: SlackIcon, x: '17%', y: '24%' },
  { icon: GithubIcon, x: '83%', y: '24%' },
  { icon: FigmaIcon, x: '17%', y: '78%' },
  { icon: NotionIcon, x: '83%', y: '78%' }
];

const IntegrationVisual = () => (
  <div className={HUB_CLASS}>
    <svg className={HUB_LINKS_CLASS} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {APPS.map(app => (
        <line key={app.x + app.y} x1={parseFloat(app.x)} y1={parseFloat(app.y)} x2="50" y2="51" pathLength="1" />
      ))}
    </svg>
    {APPS.map((app, index) => (
      <span
        key={`packet-${index}`}
        className={PACKET_CLASS}
        style={vars({ '--x': app.x, '--y': app.y, '--i': index })}
      />
    ))}
    {APPS.map((app, index) => (
      <span
        key={app.x + app.y}
        className={HUB_NODE_CLASS}
        style={vars({ '--x': app.x, '--y': app.y, '--s': '26px', '--i': index + 1 })}
      >
        <HugeiconsIcon icon={app.icon} size={14} strokeWidth={1.8} />
      </span>
    ))}
    <span className={HUB_NODE_CLASS} style={vars({ '--x': '50%', '--y': '51%', '--s': '34px', '--i': 0 })}>
      <HugeiconsIcon icon={SparklesIcon} size={17} strokeWidth={1.8} />
    </span>
  </div>
);

const SETTINGS = [
  { icon: Key01Icon, label: 'Provenance Seal' },
  { icon: FingerPrintIcon, label: 'Master Signature' }
];

const SecurityVisual = () => (
  <div className={SHIELD_CLASS}>
    {SETTINGS.map((setting, index) => (
      <div key={setting.label} className={SETTING_CLASS}>
        <HugeiconsIcon icon={setting.icon} size={14} strokeWidth={1.8} />
        <span className={SETTING_LABEL_CLASS}>{setting.label}</span>
        <span className={SWITCH_CLASS} style={vars({ '--i': index })} />
      </div>
    ))}
  </div>
);

const VISUALS: Record<string, () => ReactNode> = {
  analytics: AnalyticsVisual,
  dashboard: DashboardVisual,
  collaboration: CollaborationVisual,
  automation: AutomationVisual,
  integration: IntegrationVisual,
  security: SecurityVisual
};

const REPLAY = new Set([
  'magic-bento-draw',
  'magic-bento-fade',
  'magic-bento-grow',
  'magic-bento-pop',
  'magic-bento-select',
  'magic-bento-wait',
  'magic-bento-run',
  'magic-bento-check',
  'magic-bento-rail',
  'magic-bento-switch-track',
  'magic-bento-switch-knob'
]);

const FLOW = new Set([
  'magic-bento-wait',
  'magic-bento-run',
  'magic-bento-check',
  'magic-bento-rail',
  'magic-bento-fade'
]);

const finite = (animation: Animation) => {
  const timing = animation.effect?.getTiming?.();
  return timing ? timing.iterations !== Infinity : false;
};

const nameOf = (animation: Animation) => (animation as CSSAnimation).animationName || '';

export const DEFAULT_MARKETPLACE_ITEMS: MagicBentoItem[] = [
  {
    id: 'fair-economy',
    label: 'Direct Royalties',
    title: '88% to Independent Makers',
    description: 'Weekly direct payouts empower traditional workshops and master generational artisans.',
    visual: 'dashboard',
    colSpan: 1,
    rowSpan: 1
  },
  {
    id: 'collector-discovery',
    label: 'Global Discovery',
    title: '12.4k Monthly Collectors',
    description: 'Conscious buyers exploring museum-grade pottery, woven fibers, and sculpted bronze.',
    visual: 'analytics',
    colSpan: 1,
    rowSpan: 1
  },
  {
    id: 'bespoke-atelier',
    label: 'Live Co-Creation',
    title: 'Custom Studio Commissions',
    description: 'Collaborate directly with master artisans to specify custom glazes, dimensions, and materials.',
    visual: 'collaboration',
    colSpan: 2,
    rowSpan: 2
  },
  {
    id: 'artisan-lifecycle',
    label: 'Craft Pipeline',
    title: 'Handcrafted Provenance Journey',
    description: 'Each piece passes through certified steps: raw earth sourcing, hand turning, and wood kiln firing.',
    visual: 'automation',
    colSpan: 2,
    rowSpan: 2
  },
  {
    id: 'studio-network',
    label: 'Global Ateliers',
    title: 'Heritage Guild Network',
    description: 'Connecting preserved artisan traditions across Kyoto, Murano, Florence, and Oaxaca.',
    visual: 'integration',
    colSpan: 1,
    rowSpan: 1
  },
  {
    id: 'authenticity-guarantee',
    label: 'Trust & Verification',
    title: '100% Studio Provenance',
    description: 'Every creation includes an individually signed certificate of authenticity and batch registration.',
    visual: 'security',
    colSpan: 1,
    rowSpan: 1
  }
];

export const MagicBento = ({
  items = DEFAULT_MARKETPLACE_ITEMS,
  columns = 4,
  rowHeight = 200,
  gap = 12,
  radius = 20,
  theme = 'light',
  glowColor = '#D6B875',
  textAutoHide = true,
  enableBorderGlow = true,
  enableSpotlight = true,
  spotlightRadius = 300,
  enableStars = false,
  particleCount = 24,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = true,
  intro = true,
  disableAnimations = false,
  onItemClick,
  className = '',
  style
}: MagicBentoProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const starRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const engineRef = useRef<{ sync: () => void } | null>(null);
  const [cols, setCols] = useState(Math.max(1, Math.round(columns)));

  const palette = theme === 'dark' ? 'dark' : 'light';
  const glow = parseRgb(glowColor) ?? INK[palette];
  const settings: Settings = {
    items,
    columns: Math.max(1, Math.round(columns)),
    gap: Math.max(0, gap),
    enableBorderGlow,
    enableSpotlight,
    spotlightRadius: Math.max(40, spotlightRadius),
    enableStars,
    particleCount: clamp(Math.round(particleCount), 0, 120),
    enableTilt,
    enableMagnetism,
    clickEffect,
    intro,
    disableAnimations,
    onItemClick,
    glow
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motion = !settingsRef.current.disableAnimations && !reduced;
    const playIntro = motion && settingsRef.current.intro;
    if (motion) root.dataset.motion = '';
    else delete root.dataset.motion;
    if (playIntro) root.dataset.intro = '';
    else delete root.dataset.intro;

    const pointer = { x: -1e5, y: -1e5, inside: false, down: -1 };
    const light = { x: -1e5, y: -1e5, near: 0, ready: false };
    const states: CardState[] = [];
    const wave = { x: 0, y: 0, t: -1, duration: 1.1, reach: 800 };
    let rects: (DOMRect | null)[] = [];
    let bounds: DOMRect | null = null;
    let dirty = true;
    let raf = 0;
    let last = 0;
    let visible = true;
    let entered = !playIntro;
    let settleTimer = 0;
    let introTimer = 0;
    const lastFlow: number[] = [];

    const stateFor = (index: number): CardState => {
      if (!states[index]) {
        states[index] = {
          hot: 0,
          rx: 0,
          ry: 0,
          tx: 0,
          ty: 0,
          vrx: 0,
          vry: 0,
          vtx: 0,
          vty: 0,
          press: 1,
          vpress: 0,
          stars: 0,
          particles: null,
          active: false,
          written: {}
        };
      }
      return states[index];
    };

    const write = (element: HTMLElement, state: CardState, name: string, value: string) => {
      if (state.written[name] === value) return;
      state.written[name] = value;
      element.style.setProperty(name, value);
    };

    const measure = () => {
      dirty = false;
      bounds = root.getBoundingClientRect();
      rects = cellRefs.current.map(cell => (cell ? cell.getBoundingClientRect() : null));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      starRefs.current.forEach((canvas, index) => {
        const rect = rects[index];
        if (!canvas || !rect) return;
        const width = Math.max(1, Math.round(rect.width * ratio));
        const height = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      });
    };

    const seed = (index: number, rect: DOMRect): Particle[] => {
      const count = settingsRef.current.particleCount;
      const state = stateFor(index);
      if (state.particles && state.particles.length === count) return state.particles;
      state.particles = Array.from({ length: count }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 6,
        vy: -4 - Math.random() * 10,
        size: 0.6 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        rate: 1.2 + Math.random() * 2.4
      }));
      return state.particles;
    };

    const drawStars = (
      index: number,
      rect: DOMRect,
      state: CardState,
      lx: number,
      ly: number,
      dt: number,
      now: number
    ) => {
      const canvas = starRefs.current[index];
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      const ratio = canvas.width / Math.max(1, rect.width);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (state.stars < 0.004) return;
      const s = settingsRef.current;
      const particles = seed(index, rect);
      const reach = s.spotlightRadius * 0.75;
      const [r, g, b] = s.glow;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      for (const particle of particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        if (particle.y < -4) {
          particle.y = rect.height + 4;
          particle.x = Math.random() * rect.width;
        }
        if (particle.x < -4) particle.x = rect.width + 4;
        if (particle.x > rect.width + 4) particle.x = -4;
        const distance = Math.hypot(particle.x - lx, particle.y - ly) / reach;
        if (distance >= 1) continue;
        const falloff = 1 - distance * distance * (3 - 2 * distance);
        const twinkle = 0.55 + 0.45 * Math.sin(now * 0.001 * particle.rate + particle.phase);
        const alpha = state.stars * falloff * twinkle;
        if (alpha < 0.01) continue;
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }
    };

    const replay = (card: HTMLElement, filter: Set<string>) => {
      if (!motion || !card.getAnimations) return;
      for (const animation of card.getAnimations({ subtree: true })) {
        if (!filter.has(nameOf(animation)) || !finite(animation)) continue;
        const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
        if (target instanceof Element && target.classList.contains('magic-bento__cursor')) continue;
        animation.currentTime = 0;
        animation.play();
      }
    };

    const startWave = (x: number, y: number, duration: number) => {
      if (!motion || !bounds) return;
      wave.x = x;
      wave.y = y;
      wave.t = 0;
      wave.duration = duration;
      wave.reach =
        Math.max(
          Math.hypot(x - bounds.left, y - bounds.top),
          Math.hypot(x - bounds.right, y - bounds.top),
          Math.hypot(x - bounds.left, y - bounds.bottom),
          Math.hypot(x - bounds.right, y - bounds.bottom)
        ) + 140;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (dirty) measure();
      const s = settingsRef.current;
      const cards = cardRefs.current;
      let busy = false;

      const margin = s.spotlightRadius * 0.5;
      const near =
        pointer.inside &&
        bounds &&
        pointer.x > bounds.left - margin &&
        pointer.x < bounds.right + margin &&
        pointer.y > bounds.top - margin &&
        pointer.y < bounds.bottom + margin
          ? 1
          : 0;
      if (!light.ready && near) {
        light.x = pointer.x;
        light.y = pointer.y;
        light.ready = true;
      }
      const follow = 1 - Math.exp(-dt / 0.05);
      light.x += (pointer.x - light.x) * follow;
      light.y += (pointer.y - light.y) * follow;
      const fade = 1 - Math.exp(-dt / (near > light.near ? 0.12 : 0.4));
      light.near += (near - light.near) * fade;
      if (Math.abs(near - light.near) < 0.002) light.near = near;
      else busy = true;
      if (Math.abs(pointer.x - light.x) + Math.abs(pointer.y - light.y) > 0.3) busy = true;

      let waveRadius = 0;
      let waveAlpha = 0;
      if (wave.t >= 0) {
        wave.t += dt;
        const progress = Math.min(1, wave.t / wave.duration);
        waveRadius = wave.reach * (1 - Math.pow(1 - progress, 2.2));
        waveAlpha = Math.pow(1 - progress, 1.3);
        if (progress >= 1) {
          wave.t = -1;
          waveAlpha = 0;
        } else busy = true;
      }

      cards.forEach((card, index) => {
        const rect = rects[index];
        if (!card || !rect) return;
        const state = stateFor(index);
        const lx = light.x - rect.left;
        const ly = light.y - rect.top;
        const px = pointer.x - rect.left;
        const py = pointer.y - rect.top;
        const inside = pointer.inside && entered && px >= 0 && py >= 0 && px <= rect.width && py <= rect.height;

        if (inside !== state.active) {
          state.active = inside;
          if (inside) {
            card.dataset.active = '';
            if (now - (lastFlow[index] || -1e9) > 3200 && card.querySelector('.magic-bento__steps')) {
              lastFlow[index] = now;
              replay(card, FLOW);
            }
          } else delete card.dataset.active;
        }

        const hotTarget = inside && s.enableSpotlight ? 1 : 0;
        state.hot += (hotTarget - state.hot) * (1 - Math.exp(-dt / (hotTarget > state.hot ? 0.14 : 0.32)));
        if (Math.abs(hotTarget - state.hot) < 0.002) state.hot = hotTarget;
        else busy = true;

        const u = clamp(px / Math.max(1, rect.width), 0, 1) - 0.5;
        const v = clamp(py / Math.max(1, rect.height), 0, 1) - 0.5;
        const tilt = inside && s.enableTilt && motion;
        const magnet = inside && s.enableMagnetism && motion;
        const targets = [
          tilt ? -v * 2 * TILT : 0,
          tilt ? u * 2 * TILT : 0,
          magnet ? u * 2 * MAGNET : 0,
          magnet ? v * 2 * MAGNET : 0
        ];
        const keys: Spring[] = [
          ['rx', 'vrx'],
          ['ry', 'vry'],
          ['tx', 'vtx'],
          ['ty', 'vty']
        ];
        const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
        const h = dt / steps;
        keys.forEach(([key, velocity], k) => {
          for (let step = 0; step < steps; step++) {
            state[velocity] += (170 * (targets[k] - state[key]) - 20 * state[velocity]) * h;
            state[key] += state[velocity] * h;
          }
          if (Math.abs(targets[k] - state[key]) < 0.002 && Math.abs(state[velocity]) < 0.01) {
            state[key] = targets[k];
            state[velocity] = 0;
          } else busy = true;
        });
        const pressTarget = pointer.down === index && s.clickEffect && motion ? 0.985 : 1;
        for (let step = 0; step < steps; step++) {
          state.vpress += (420 * (pressTarget - state.press) - 28 * state.vpress) * h;
          state.press += state.vpress * h;
        }
        if (Math.abs(pressTarget - state.press) < 0.0002 && Math.abs(state.vpress) < 0.001) {
          state.press = pressTarget;
          state.vpress = 0;
        } else busy = true;

        write(card, state, '--mb-x', `${lx.toFixed(1)}px`);
        write(card, state, '--mb-y', `${ly.toFixed(1)}px`);
        write(card, state, '--mb-near', (s.enableBorderGlow ? light.near : 0).toFixed(3));
        write(card, state, '--mb-hot', state.hot.toFixed(3));
        write(card, state, '--mb-rx', `${state.rx.toFixed(3)}deg`);
        write(card, state, '--mb-ry', `${state.ry.toFixed(3)}deg`);
        write(card, state, '--mb-tx', `${state.tx.toFixed(2)}px`);
        write(card, state, '--mb-ty', `${state.ty.toFixed(2)}px`);
        write(card, state, '--mb-press', state.press.toFixed(4));
        write(card, state, '--mb-wx', `${(wave.x - rect.left).toFixed(1)}px`);
        write(card, state, '--mb-wy', `${(wave.y - rect.top).toFixed(1)}px`);
        write(card, state, '--mb-wr', `${waveRadius.toFixed(1)}px`);
        write(card, state, '--mb-wa', waveAlpha.toFixed(3));

        if (s.enableStars && starRefs.current[index]) {
          const starTarget = inside && motion ? 1 : 0;
          state.stars += (starTarget - state.stars) * (1 - Math.exp(-dt / (starTarget ? 0.3 : 0.5)));
          if (state.stars < 0.004 && !starTarget) state.stars = 0;
          if (state.stars > 0 || starTarget) {
            drawStars(index, rect, state, lx, ly, dt, now);
            state.drawn = true;
            busy = true;
          } else if (state.drawn) {
            drawStars(index, rect, state, lx, ly, dt, now);
            state.drawn = false;
          }
        }
      });

      if (busy && visible) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const cardIndex = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return -1;
      const card = target.closest('.magic-bento__card');
      return card instanceof HTMLElement ? cardRefs.current.indexOf(card) : -1;
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      wake();
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointer.inside = false;
      pointer.down = -1;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      pointer.down = cardIndex(event.target);
      wake();
    };

    const release = () => {
      if (pointer.down < 0) return;
      pointer.down = -1;
      wake();
    };

    const activate = (index: number, x: number, y: number) => {
      const s = settingsRef.current;
      const card = cardRefs.current[index];
      if (!card) return;
      if (s.clickEffect) {
        if (dirty) measure();
        startWave(x, y, 1.1);
        replay(card, REPLAY);
        lastFlow[index] = performance.now();
      }
      wake();
    };

    const onClick = (event: MouseEvent) => {
      const index = cardIndex(event.target);
      const card = cardRefs.current[index];
      if (!card) return;
      if (event.detail === 0) {
        const rect = card.getBoundingClientRect();
        activate(index, rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else activate(index, event.clientX, event.clientY);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = cardRefs.current[cardIndex(event.target)];
      if (!card || event.target !== card || card.tagName === 'A') return;
      event.preventDefault();
      card.click();
    };

    const onScroll = () => {
      dirty = true;
      wake();
    };

    const resizeObserver = new ResizeObserver(() => {
      const s = settingsRef.current;
      const width = root.clientWidth;
      const cell = (count: number) => (width - s.gap * (count - 1)) / count;
      const next = cell(s.columns) >= MIN_CELL ? s.columns : s.columns >= 2 && cell(2) >= MIN_PAIR ? 2 : 1;
      setCols(next);
      dirty = true;
      wake();
    });
    resizeObserver.observe(root);

    const enter = () => {
      entered = true;
      let order = 0;
      cellRefs.current.forEach(cell => {
        if (!cell) return;
        cell.style.setProperty('--mb-delay', `${order++ * STAGGER}ms`);
        cell.dataset.state = 'in';
      });
      if (dirty) measure();
      introTimer = window.setTimeout(() => {
        if (bounds) startWave(bounds.left, bounds.top, 1.7);
        wake();
      }, 260);
      settleTimer = window.setTimeout(
        () => {
          cellRefs.current.forEach(cell => cell?.style.setProperty('--mb-delay', '0ms'));
        },
        order * STAGGER + 2600
      );
      wake();
    };

    let gate: IntersectionObserver | null = null;
    if (playIntro && typeof IntersectionObserver !== 'undefined') {
      gate = new IntersectionObserver(
        (entries, observer) => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          observer.disconnect();
          enter();
        },
        { threshold: 0.15 }
      );
      gate.observe(root);
    } else {
      cellRefs.current.forEach(cell => {
        if (!cell) return;
        cell.style.setProperty('--mb-delay', '0ms');
        cell.dataset.state = 'in';
      });
      if (motion) {
        for (const animation of root.getAnimations ? root.getAnimations({ subtree: true }) : []) {
          if (REPLAY.has(nameOf(animation)) && finite(animation)) animation.finish();
        }
      }
    }

    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        dirty = true;
        wake();
      }
    });
    visibility.observe(root);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('pointerout', onPointerOut);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeyDown);

    engineRef.current = {
      sync: () => {
        cellRefs.current.forEach(cell => {
          if (!cell || (!entered && playIntro)) return;
          if (cell.dataset.state !== 'in') {
            cell.style.setProperty('--mb-delay', '0ms');
            cell.dataset.state = 'in';
          }
        });
        dirty = true;
        wake();
      }
    };

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
      window.clearTimeout(introTimer);
      gate?.disconnect();
      visibility.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('pointerout', onPointerOut);
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeyDown);
      engineRef.current = null;
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    engineRef.current?.sync();
  }, [items, cols, rowHeight, gap, radius, enableStars, enableSpotlight, enableBorderGlow]);

  const ink = INK[palette];
  const accent = parseRgb(glowColor) ?? ink;
  const corner = Math.max(0, radius);
  const span = Math.max(1, cols);

  cellRefs.current.length = items.length;
  cardRefs.current.length = items.length;
  starRefs.current.length = items.length;

  return (
    <div
      ref={rootRef}
      className={`${ROOT_CLASS} ${className}`.trim()}
      data-autohide={textAutoHide ? '' : undefined}
      data-motion={disableAnimations ? undefined : ''}
      data-intro={intro && !disableAnimations ? '' : undefined}
      style={{
        ...vars({
          ...THEMES[palette],
          '--mb-glow-rgb': glow.join(', '),
          '--mb-accent-rgb': accent.join(', '),
          '--mb-accent-ink': inkFor(accent),
          '--mb-radius': `${corner}px`,
          '--mb-inner-radius': `${Math.round(clamp(corner * 0.5, 6, 12))}px`,
          '--mb-pad': `${Math.round(clamp(corner * 0.85, 14, 20))}px`,
          '--mb-spot-size': `${Math.max(40, spotlightRadius)}px`,
          '--mb-border-size': `${Math.round(Math.max(40, spotlightRadius) * 0.75)}px`
        }),
        gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`,
        gridAutoRows: span === 1 ? `minmax(${rowHeight}px, auto)` : `${rowHeight}px`,
        gap: `${Math.max(0, gap)}px`,
        ...style
      }}
    >
      <style>{STYLE}</style>
      {items.map((item, index) => {
        const entry: MagicBentoItem = item ?? {};
        const Visual = typeof entry.visual === 'string' ? VISUALS[entry.visual] : null;
        const visual = Visual ? <Visual /> : typeof entry.visual === 'string' ? null : entry.visual;
        const clickable = Boolean(entry.href || entry.onClick || onItemClick);
        const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
          entry.onClick?.(event);
          onItemClick?.(entry, index);
        };
        const cardProps = {
          ref: (element: HTMLElement | null) => {
            cardRefs.current[index] = element;
          },
          className: CARD_CLASS,
          'data-clickable': clickable ? '' : undefined,
          'data-image': entry.image ? '' : undefined,
          onClick: clickable ? handleClick : undefined
        };
        const body = (
          <>
            {entry.image && <img className={IMAGE_CLASS} src={entry.image} alt="" draggable={false} />}
            {entry.image && <span className={SCRIM_CLASS} style={SCRIM_STYLE} />}
            {enableSpotlight && <span className={LIGHT_CLASS} style={LIGHT_STYLE} />}
            {enableStars && (
              <canvas
                ref={element => {
                  starRefs.current[index] = element;
                }}
                className={STARS_CLASS}
                aria-hidden="true"
              />
            )}
            <div className={CONTENT_CLASS}>
              {entry.content ?? (
                <>
                  {(entry.icon || entry.label) && (
                    <div className={HEADER_CLASS}>
                      {entry.icon && <span className={ICON_CLASS}>{entry.icon}</span>}
                      {entry.label && <span className={LABEL_CLASS}>{entry.label}</span>}
                    </div>
                  )}
                  {visual && (
                    <div className={VISUAL_CLASS} aria-hidden="true">
                      {visual}
                    </div>
                  )}
                  {(entry.title || entry.description) && (
                    <div className={TEXT_CLASS}>
                      {entry.title && <h3 className={TITLE_CLASS}>{entry.title}</h3>}
                      {entry.description && <p className={DESCRIPTION_CLASS}>{entry.description}</p>}
                    </div>
                  )}
                </>
              )}
            </div>
            <span className={RIM_CLASS} />
            <span className={BORDER_CLASS} style={BORDER_STYLE} />
          </>
        );

        return (
          <div
            key={entry.id ?? index}
            ref={element => {
              cellRefs.current[index] = element;
            }}
            className={CELL_CLASS}
            style={{
              gridColumn: `span ${Math.min(span, Math.max(1, Math.round(entry.colSpan ?? 1)))}`,
              gridRow: `span ${Math.max(1, Math.round(entry.rowSpan ?? 1))}`
            }}
          >
            {entry.href ? (
              <a {...cardProps} href={entry.href} target={entry.target} rel={entry.rel}>
                {body}
              </a>
            ) : (
              <div
                {...cardProps}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-label={clickable ? entry.title : undefined}
              >
                {body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MagicBento;
