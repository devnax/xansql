import Model from "./Model";
import SchemaBuilder from "./SchemaBuilder";
import { Models, TableName, XansqlConfig } from "./types";
import "./Schema"

class xansql {
  private factory: Models = new Map()
  private config: XansqlConfig
  constructor(config: XansqlConfig) {
    this.config = config;
  }

  check() {
    console.log(this);
  }

  Model(table: string) {
    const xansql = this;
    const schema = new SchemaBuilder(table)
    const model = Model(table, xansql);
    const instance = new model();

    this.factory.set(table, {
      model,
      instance,
      schema
    })
    return model;
  }

  sync(force?: boolean) {
    this.factory.forEach(({ model }) => {
      model.sync(force)
    })
  }
}

export default xansql