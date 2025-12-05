import mitt from "mitt";

export type Emitter = typeof emitter

export const emitter = mitt()