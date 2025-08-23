import Schema from "..";
import { formatValue } from "../../utils";
import { DataArgs } from "./types";

const BuildData = (args: DataArgs, schema: Schema) => {
   const info = {
      sql: '',
      joins: [],
   }

   let values: any[] = [];

   for (const column in args) {
      const xanv = schema.schema[column]
      const relations = schema.xansql.getRelations(schema.table)
      if (!xanv && !(column in relations)) {
         throw new Error("Invalid column in where clause: " + column)
      };
      const value: any = args[column];

      if (Array.isArray(value)) {

      } else {
         if (column in relations) {
            const relation = relations[column]
            const foreginModel = schema.xansql.getSchema(relation.foregin.table)
            if (!foreginModel) {
               throw new Error("Foregin model not found for relation " + column)
            }
            const buildData = BuildData(value, foreginModel);
         } else {

         }
      }
   }
}

export default BuildData;