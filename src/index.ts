import Model from "./Model";
import { Schema } from "./Schema";
import { XansqlConfig } from "./type";

class xansql {
   private _models = new Map<string, Model>();
   private _config: XansqlConfig;

   constructor(config: XansqlConfig) {
      this._config = config;
   }

   get config() {
      return typeof this._config === 'function' ? this._config() : this._config;
   }

   get dialect() {
      return this.config.dialect;
   }

   get models() {
      return Array.from(this._models.values());
   }

   model(schema: Schema) {
      const instance = new Model(schema, this);
      if (this._models.has(schema.table)) {
         throw new Error("Model already exists for this table");
      }
      this._models.set(schema.table, instance);
      return instance
   }

   migrate() {

   }

   excute() {

   }

}

export default xansql