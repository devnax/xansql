import Model from ".";
import { SchemaShape, WhereArgs } from "./types";

class ModelWhere<S extends SchemaShape> {
   constructor(public model: Model<S>, public inColumn: keyof S, public where?: WhereArgs<S>) {
   }
}

export default ModelWhere