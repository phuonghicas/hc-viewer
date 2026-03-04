// sdk/src/core/emitter.ts

export class Emitter<EventMap extends Record<string, any>> {
  private listeners: {
    [K in keyof EventMap]?: Array<(payload: EventMap[K]) => void>;
  } = {};

  on<K extends keyof EventMap>(event: K, cb: (payload: EventMap[K]) => void): () => void {
    const arr = (this.listeners[event] ||= []);
    arr.push(cb);
    return () => this.off(event, cb);
  }

  off<K extends keyof EventMap>(event: K, cb: (payload: EventMap[K]) => void) {
    const arr = this.listeners[event];
    if (!arr) return;

    const idx = arr.indexOf(cb);
    if (idx >= 0) arr.splice(idx, 1);

    if (arr.length === 0) delete this.listeners[event];
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    this.listeners[event]?.forEach((cb) => cb(payload));
  }

  clear() {
    this.listeners = {};
  }
}