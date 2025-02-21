import { ref } from "vue";
import type { Ref } from "vue";

export interface MenuState {
  activeMenu: Ref<symbol | null>;
}

export const menuState: MenuState = {
  activeMenu: ref(null),
};

export const MENU_KEY = Symbol("menuKey");
