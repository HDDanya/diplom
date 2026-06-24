import { TransitionStyle } from "../types/api";

export const TRANSITIONS: TransitionStyle[] = [
  "SLIDE_LEFT",
  "SLIDE_RIGHT",
  "FADE",
  "ZOOM",
  "PAGE_FLIP",
  "VERTICAL_REVEAL",
  "GLITCH_CUT",
  "WHIP_PAN",
  "INK_BLEED",
  "PARALLAX_SWEEP",
  "ROTATE_IN",
  "BLUR_DISSOLVE",
  "SHUTTER",
  "RIPPLE",
  "FLASH",
  "PANEL_STAGGER",
  "COMIC_BURST",
  "TILT_DROP",
  "CURTAIN",
  "FOCUS_PULL",
  "NONE"
];

export const TRANSITION_LABELS: Record<TransitionStyle, string> = {
  SLIDE_LEFT: "Сдвиг влево",
  SLIDE_RIGHT: "Сдвиг вправо",
  FADE: "Плавное появление",
  ZOOM: "Приближение",
  PAGE_FLIP: "Перелистывание",
  VERTICAL_REVEAL: "Вертикальное раскрытие",
  GLITCH_CUT: "Глитч",
  WHIP_PAN: "Резкая панорама",
  INK_BLEED: "Чернильное проявление",
  PARALLAX_SWEEP: "Параллакс",
  ROTATE_IN: "Поворот",
  BLUR_DISSOLVE: "Растворение",
  SHUTTER: "Затвор",
  RIPPLE: "Волна",
  FLASH: "Вспышка",
  PANEL_STAGGER: "Каскад панелей",
  COMIC_BURST: "Комиксный взрыв",
  TILT_DROP: "Падение с наклоном",
  CURTAIN: "Шторка",
  FOCUS_PULL: "Перевод фокуса",
  NONE: "Без анимации"
};

type TransitionState = Record<string, number | string>;

export type TransitionVariants = {
  initial: TransitionState;
  animate: TransitionState;
  exit: TransitionState;
};

export function createTransitionVariants(style: TransitionStyle, direction: number): TransitionVariants {
  switch (style) {
    case "NONE":
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 }
      };
    case "FADE":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      };
    case "ZOOM":
      return {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.07 }
      };
    case "PAGE_FLIP":
      return {
        initial: { opacity: 0, rotateY: -30 * direction, transformPerspective: 1200, x: 80 * direction },
        animate: { opacity: 1, rotateY: 0, transformPerspective: 1200, x: 0 },
        exit: { opacity: 0, rotateY: 24 * direction, transformPerspective: 1200, x: -90 * direction }
      };
    case "VERTICAL_REVEAL":
      return {
        initial: { opacity: 0, y: 80 * direction, clipPath: "inset(100% 0 0 0 round 8px)" },
        animate: { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0 round 8px)" },
        exit: { opacity: 0, y: -60 * direction, clipPath: "inset(0 0 100% 0 round 8px)" }
      };
    case "GLITCH_CUT":
      return {
        initial: { opacity: 0, x: 18 * direction, skewX: 7 * direction, filter: "contrast(1.4)" },
        animate: { opacity: 1, x: 0, skewX: 0, filter: "contrast(1)" },
        exit: { opacity: 0, x: -22 * direction, skewX: -5 * direction, filter: "contrast(1.5)" }
      };
    case "WHIP_PAN":
      return {
        initial: { opacity: 0, x: 240 * direction, filter: "blur(10px)" },
        animate: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: { opacity: 0, x: -240 * direction, filter: "blur(10px)" }
      };
    case "INK_BLEED":
      return {
        initial: { opacity: 0, scale: 1.03, filter: "contrast(0.7) grayscale(1)" },
        animate: { opacity: 1, scale: 1, filter: "contrast(1) grayscale(0)" },
        exit: { opacity: 0, scale: 0.985, filter: "contrast(1.2) grayscale(0.6)" }
      };
    case "PARALLAX_SWEEP":
      return {
        initial: { opacity: 0, x: 100 * direction, y: 30, rotate: -1.4 * direction },
        animate: { opacity: 1, x: 0, y: 0, rotate: 0 },
        exit: { opacity: 0, x: -100 * direction, y: -25, rotate: 1.4 * direction }
      };
    case "ROTATE_IN":
      return {
        initial: { opacity: 0, rotate: -7 * direction, scale: 0.94 },
        animate: { opacity: 1, rotate: 0, scale: 1 },
        exit: { opacity: 0, rotate: 6 * direction, scale: 1.04 }
      };
    case "BLUR_DISSOLVE":
      return {
        initial: { opacity: 0, filter: "blur(18px) saturate(0.4)" },
        animate: { opacity: 1, filter: "blur(0px) saturate(1)" },
        exit: { opacity: 0, filter: "blur(14px) saturate(0.5)" }
      };
    case "SHUTTER":
      return {
        initial: { opacity: 0, clipPath: "inset(0 50% 0 50%)" },
        animate: { opacity: 1, clipPath: "inset(0 0% 0 0%)" },
        exit: { opacity: 0, clipPath: "inset(50% 0 50% 0)" }
      };
    case "RIPPLE":
      return {
        initial: { opacity: 0, scale: 0.88, borderRadius: "50%" },
        animate: { opacity: 1, scale: 1, borderRadius: "0%" },
        exit: { opacity: 0, scale: 1.08, borderRadius: "35%" }
      };
    case "FLASH":
      return {
        initial: { opacity: 0, filter: "brightness(3) contrast(0.4)" },
        animate: { opacity: 1, filter: "brightness(1) contrast(1)" },
        exit: { opacity: 0, filter: "brightness(2.4) contrast(0.6)" }
      };
    case "PANEL_STAGGER":
      return {
        initial: { opacity: 0, y: 42, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -32, scale: 0.98 }
      };
    case "COMIC_BURST":
      return {
        initial: { opacity: 0, scale: 0.55, rotate: -3 * direction },
        animate: { opacity: 1, scale: 1, rotate: 0 },
        exit: { opacity: 0, scale: 1.18, rotate: 2 * direction }
      };
    case "TILT_DROP":
      return {
        initial: { opacity: 0, y: -110, rotate: -8 * direction },
        animate: { opacity: 1, y: 0, rotate: 0 },
        exit: { opacity: 0, y: 90, rotate: 7 * direction }
      };
    case "CURTAIN":
      return {
        initial: { opacity: 0, clipPath: "inset(0 100% 0 0)" },
        animate: { opacity: 1, clipPath: "inset(0 0 0 0)" },
        exit: { opacity: 0, clipPath: "inset(0 0 0 100%)" }
      };
    case "FOCUS_PULL":
      return {
        initial: { opacity: 0, scale: 1.1, filter: "blur(12px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.94, filter: "blur(8px)" }
      };
    case "SLIDE_RIGHT":
    case "SLIDE_LEFT":
    default: {
      const shift = style === "SLIDE_RIGHT" ? -direction : direction;
      return {
        initial: { opacity: 0, x: 135 * shift, rotateY: 7 * shift },
        animate: { opacity: 1, x: 0, rotateY: 0 },
        exit: { opacity: 0, x: -135 * shift, rotateY: -5 * shift }
      };
    }
  }
}

export function transitionClassName(style: TransitionStyle) {
  return `comic-canvas--${style.toLowerCase().replace(/_/g, "-")}`;
}
