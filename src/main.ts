import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./style.css";
import "./styles/theme.scss";
import App from "./App.vue";
import router from "./router";
import { vTooltip } from "./directives/tooltip";
import "viewerjs/dist/viewer.css";
import VueViewer from "v-viewer";
import { menuState, MENU_KEY } from "./store/menuState";

const app = createApp(App);
app.use(ElementPlus);
app.use(router);
app.use(VueViewer, {
  defaultOptions: {
    zIndex: 9999,
    title: false,
    toolbar: {
      zoomIn: true,
      zoomOut: true,
      oneToOne: true,
      reset: true,
      prev: true,
      next: true,
      rotateLeft: true,
      rotateRight: true,
    },
  },
});

// 提供全局菜单状态
app.provide(MENU_KEY, menuState);

// 注册全局指令
app.directive("tooltip", vTooltip);

app.mount("#app");
