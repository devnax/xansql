import { ModelsType, XansqlConfig } from "./types";
export * from "./schema";

class xansql {
   config: XansqlConfig;
   models: ModelsType = new Map();
   constructor(config: XansqlConfig) {
      this.config = config;
   }

   assignModel<M extends { new(arg: xansql): any }>(model: M): InstanceType<M> {
      const m = new model(this);
      this.models.set(m.table, m);
      return m;
   }

   migrate(force?: boolean) {

   }
}

export default xansql