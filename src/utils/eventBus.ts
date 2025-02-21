import mitt from "mitt";

type Events = {
  "refresh-folder": void;
  "return-root": void;
};

export const eventBus = mitt<Events>();
