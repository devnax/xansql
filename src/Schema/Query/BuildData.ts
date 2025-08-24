import Schema from "..";
import XqlIDField from "../../Types/fields/IDField";
import { formatValue } from "../../utils";
import { DataArgs } from "./types";


export type BuildDataInfo = {
   columns: string[];
   values: (string | number)[];
   table: string;
   joins: { [column: string]: BuildDataInfo | BuildDataInfo[] };
}

const BuildData = (args: DataArgs | DataArgs[], schema: Schema): BuildDataInfo | BuildDataInfo[] => {

   const info: BuildDataInfo = {
      columns: [],
      values: [],
      table: schema.table,
      joins: {},
   }

   if (Array.isArray(args)) {
      let infos: BuildDataInfo[] = [];
      for (const data of args) {
         let _info = BuildData(data, schema) as BuildDataInfo
         infos.push(_info);
      }
      return infos;
   } else {
      for (const column in args) {
         const xanv = schema.schema[column]
         const relations = schema.xansql.getRelations(schema.table)
         if (!xanv && !(column in relations)) {
            throw new Error("Invalid column in where clause: " + column)
         };
         if (xanv instanceof XqlIDField) {
            throw new Error("Cannot use ID field in data args directly. Use it in where clause instead.");
         }

         let value: any = args[column];
         if (column in relations) {
            const relation = relations[column]
            if (relation.single && Array.isArray(value)) {
               throw new Error("Cannot use array in relation data directly. Use object instead.");
            }
            const foreginSchema = relation.foregin.schema;

            if (relation.single) {
               throw new Error("Single relation is not supported in create data yet.");
            }

            const _info = BuildData(value, foreginSchema);
            info.joins[column] = _info
         } else {
            const val = xanv.parse(value)
            info.columns.push(column);
            info.values.push(val);
         }
      }
   }

   return info;
}

export default BuildData;