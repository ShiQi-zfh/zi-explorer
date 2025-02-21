import type { Directive } from "vue";
import type { ComponentPublicInstance } from "vue";

interface TooltipServiceInstance extends ComponentPublicInstance {
  show: (text: string, target: HTMLElement, options?: TooltipOptions) => void;
  hide: () => void;
}

interface TooltipOptions {
  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "bottom-start"
    | "bottom-end";
  offset?: [number, number];
}

type TooltipValue =
  | string
  | { content: string; placement?: string; offset?: [number, number] };

let tooltipService: TooltipServiceInstance | null = null;
const tooltipValues = new WeakMap<HTMLElement, TooltipValue>();

export const vTooltip: Directive<HTMLElement, TooltipValue> = {
  mounted(el, binding) {
    tooltipValues.set(el, binding.value);

    el.addEventListener("mouseenter", () => {
      if (tooltipService) {
        const value = tooltipValues.get(el);
        if (typeof value === "string") {
          tooltipService.show(value, el);
        } else if (value && typeof value === "object") {
          tooltipService.show(value.content, el, {
            placement: value.placement as TooltipOptions["placement"],
            offset: value.offset,
          });
        }
      }
    });

    el.addEventListener("mouseleave", () => {
      if (tooltipService) {
        tooltipService.hide();
      }
    });
  },
  updated(el, binding) {
    const oldValue = tooltipValues.get(el);
    const newValue = binding.value;
    if (oldValue !== newValue) {
      tooltipValues.set(el, newValue);
    }
  },
  unmounted(el) {
    tooltipValues.delete(el);
  },
};

export const setTooltipService = (service: TooltipServiceInstance) => {
  tooltipService = service;
};
