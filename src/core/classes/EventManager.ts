import Model from "../../model";
import { CreateArgsType, DeleteArgsType, FindArgsType, UpdateArgsType } from "../../model/type";

export type EventNames =
   | "CREATE"
   | "UPDATE"
   | "DELETE"
   | "FIND"
   | "AGGREGATE"

   | "BEFORE_CREATE"
   | "BEFORE_UPDATE"
   | "BEFORE_DELETE"
   | "BEFORE_FIND"
   | "BEFORE_AGGREGATE"

   | "BEFORE_FETCH"
   | "FETCH";


type Result = { [key: string]: any };

export type EventPayloads = {
   CREATE: { model: Model; results: Result[]; args: CreateArgsType };
   UPDATE: { model: Model; results: Result[], args: UpdateArgsType };
   DELETE: { model: Model; results: Result[], args: DeleteArgsType };
   FIND: { model: Model; results: Result[], args: FindArgsType };
   AGGREGATE: { model: Model; results: any; args: any };

   BEFORE_CREATE: { model: Model; args: CreateArgsType };
   BEFORE_UPDATE: { model: Model; args: UpdateArgsType };
   BEFORE_DELETE: { model: Model; args: DeleteArgsType };
   BEFORE_FIND: { model: Model; args: FindArgsType };
   BEFORE_AGGREGATE: { model: Model; args: any };

   BEFORE_FETCH: { url: string; info: any };
   FETCH: { url: string; info: any; response: any };

};

// correct type: handler only gets its OWN event payload
export type EventHandler<K extends EventNames> = (payload: EventPayloads[K]) => void | Promise<void>;

class EventManager {
   private events: {
      [K in EventNames]?: EventHandler<K>[];
   } = {};

   on<K extends EventNames>(event: K, handler: EventHandler<K>) {
      if (!this.events[event]) {
         this.events[event] = [];
      }
      this.events[event]!.push(handler);
      return this;
   }

   async emit<K extends EventNames>(event: K, payload: EventPayloads[K]) {
      const handlers = this.events[event];
      if (!handlers) return this;
      for (const handler of handlers) {
         await handler(payload);
      }
      return this;
   }
}

export default EventManager;
