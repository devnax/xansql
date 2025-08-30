import Schema from "..";
import XqlIDField from "../../Types/fields/IDField";
import { DataArgs } from "./types";


export type BuildDataInfo = {
   columns: string[];
   values: (string | number)[];
   table: string;
   joins: { [column: string]: BuildDataInfo | BuildDataInfo[] };
}

const BuildData = (args: Partial<DataArgs> | Partial<DataArgs>[], schema: Schema): BuildDataInfo | BuildDataInfo[] => {

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
         const foreign = schema.getForeign(column)
         if (!xanv && !foreign) {
            throw new Error("Invalid column in data clause: " + column)
         };
         if (xanv instanceof XqlIDField) {
            throw new Error("Cannot use ID field in data args directly. Use it in where clause instead.");
         }
         let value: any = args[column];
         if (foreign) {
            const isSingleRelation = schema.isSingleRelation(column)
            if (isSingleRelation) {
               throw new Error("Single relation is not supported in create data yet.");
            }
            const FModel = schema.xansql.getSchema(foreign.table);
            const _info = BuildData(value, FModel);
            info.joins[column] = _info
         } else {
            try {
               const val = schema.toSql(column, value);
               info.columns.push(column);
               info.values.push(val);
            } catch (error) {
               throw new Error(`Field ${column} is invalid in create data.`);
            }
         }
      }
   }

   return info;
}

export default BuildData;