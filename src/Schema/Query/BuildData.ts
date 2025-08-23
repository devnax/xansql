import Schema from "..";
import XqlIDField from "../../Types/fields/IDField";
import { formatValue } from "../../utils";
import { DataArgs } from "./types";


export type BuildDataInfo = {
   columns: string[];
   values: (string | number)[];
   table: string;
   alias: string;
   joins: { [column: string]: BuildDataInfo | BuildDataInfo[] };
}

const BuildData = (args: DataArgs | DataArgs[], schema: Schema): BuildDataInfo | BuildDataInfo[] => {

   const info: BuildDataInfo = {
      columns: [],
      values: [],
      table: schema.table,
      alias: schema.table,
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
            const foreginModel = relation.foregin.schema;
            const _info = BuildData(value, foreginModel);
            info.joins[column] = _info
         } else {
            info.columns.push(column);
            info.values.push(value);
         }
      }
   }

   return info;
}

export default BuildData;