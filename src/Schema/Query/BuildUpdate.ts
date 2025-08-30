import Schema from "..";
import XqlIDField from "../../Types/fields/IDField";
import { UpdateArgs, WhereArgs } from "./types";


export type BuildUpdateJoinInfo = BuilUpdateInfo & {
   where?: WhereArgs;
}

export type BuilUpdateInfo = {
   columns: string[];
   values: (string | number)[];
   table: string;
   joins: { [column: string]: BuildUpdateJoinInfo };
}

const BuilUpdate = (args: UpdateArgs, schema: Schema): BuilUpdateInfo => {

   const info: BuilUpdateInfo = {
      columns: [],
      values: [],
      table: schema.table,
      joins: {},
   }

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
         const _info = BuilUpdate(value, FModel);
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

   return info;
}

export default BuilUpdate;