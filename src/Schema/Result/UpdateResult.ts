import Schema from "..";
import { ForeignInfo } from "../../type";
import XqlIDField from "../../Types/fields/IDField";
import BuildData, { BuildDataInfo } from "../Query/BuildData";
import BuildLimit from "../Query/BuildLimit";
import BuildOrderby from "../Query/BuildOrderby";
import BuildSelect, { BuildSelectJoinInfo } from "../Query/BuildSelect";
import BuildWhere from "../Query/BuildWhere";
import { SelectArgs, WhereArgs } from "../Query/types";
import { UpdateArgs, UpdateDataArgs } from "../type";
import FindResult from "./FindResult";

class UpdateResult {
   finder: FindResult
   constructor(readonly schema: Schema) {
      this.finder = new FindResult(schema)
   }

   async result(args: UpdateArgs) {
      const schema = this.schema
      const build = this.buildData(args.data, schema)
      const where = BuildWhere(args.where, schema)
      const data = BuildData(build.data, schema) as BuildDataInfo
      const sql = `
         UPDATE ${schema.table}
         SET ${data.columns.map((col, i) => `${col} = ${data.values[i]}`).join(", ")}
         ${where ? `${where.sql}` : ""}
      `;

      const excute = await schema.excute(sql)
      if (excute?.affectedRows && excute.affectedRows > 0) {
         const result = await this.finder.result({
            where: args.where,
            select: {
               [schema.IDColumn]: true
            }
         })

         const res = result[0] || null
         console.log(res);

         for (const column in build.joins) {

         }
      }

      return where
   }


   private async excute(info: BuildDataInfo) {

   }

   private buildData(data: UpdateDataArgs, schema: Schema) {

      const info: any = {
         data: {},
         joins: {} as { [column: string]: { info: any, where: WhereArgs } }
      }

      for (let column in data) {
         const xanv = schema.schema[column]
         const foreign = schema.getForeign(column)
         if (!xanv && !foreign) {
            throw new Error("Invalid column in data clause: " + column)
         };
         if (xanv instanceof XqlIDField) {
            throw new Error("Cannot use ID field in data args directly. Use it in where clause instead.");
         }

         if (foreign) {
            const isSingleRelation = schema.isSingleRelation(column)
            if (isSingleRelation) {
               throw new Error("Single relation is not supported in update data yet.");
            }
            const FModel = schema.xansql.getSchema(foreign.table);
            const value: any = data[column];
            if (typeof value !== "object" || Array.isArray(value) || !value.data || (typeof value.data !== "object")) {
               throw new Error(`Relation column "${column}" in update data must be an object with data and optional where properties.`);
            }
            const _info = this.buildData(value.data as UpdateDataArgs, FModel);
            info.joins[column] = { ..._info, where: value.where }
         } else {
            info.data[column] = data[column]
         }
      }

      return info
   }


}

export default UpdateResult;