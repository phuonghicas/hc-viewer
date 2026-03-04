// sdk/src/modules/base.module.ts
import type { HcViewer } from "../viewer";

export class BaseModule<LocalEventMap extends Record<string, any>> {
  constructor(protected viewer: HcViewer, private ns: string) {}

  // local event: "home" -> global event: "camera:home"
  on<K extends keyof LocalEventMap & string>(event: K, cb: (payload: LocalEventMap[K]) => void) {
    return this.viewer.on(`${this.ns}:${event}` as any, cb as any);
  }

  off<K extends keyof LocalEventMap & string>(event: K, cb: (payload: LocalEventMap[K]) => void) {
    this.viewer.off(`${this.ns}:${event}` as any, cb as any);
  }
}   