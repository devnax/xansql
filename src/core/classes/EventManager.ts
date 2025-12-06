import Model from "../../model";
import { CreateArgsType, DeleteArgsType, FindArgsType, UpdateArgsType } from "../../model/types";

type Result = { [key: string]: any };

export type EventPayloads = {
   BEFORE_CREATE: { model: Model; args: CreateArgsType };
   BEFORE_UPDATE: { model: Model; args: UpdateArgsType };
   BEFORE_DELETE: { model: Model; args: DeleteArgsType };
   BEFORE_FIND: { model: Model; args: FindArgsType };
   BEFORE_AGGREGATE: { model: Model; args: any };

   CREATE: { model: Model; results: Result[]; args: CreateArgsType };
   UPDATE: { model: Model; results: Result[], args: UpdateArgsType };
   DELETE: { model: Model; results: Result[], args: DeleteArgsType };
   FIND: { model: Model; results: Result[], args: FindArgsType };
   AGGREGATE: { model: Model; results: any; args: any };

};

// correct type: handler only gets its OWN event payload
export type EventHandler<K extends keyof EventPayloads> = (payload: EventPayloads[K]) => void | Promise<void>;

class EventManager {
   private events: {
      [K in keyof EventPayloads]?: EventHandler<K>[];
   } = {};

   on<K extends keyof EventPayloads>(event: K, handler: EventHandler<K>) {
      if (!this.events[event]) {
         this.events[event] = [];
      }
      this.events[event]!.push(handler);
      return this;
   }

   async emit<K extends keyof EventPayloads>(event: K, payload: EventPayloads[K]) {
      const handlers = this.events[event];
      if (!handlers) return this;
      for (const handler of handlers) {
         await handler(payload);
      }
      return this;
   }
}

export default EventManager;
