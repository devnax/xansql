import Schema from ".."
import XqlJoin from "../../Types/fields/Join"
import { formatValue, isObject } from "../../utils"
import { WhereArgs } from "../type"
import BuildWhereCondition from "./BuildWhereCondition"

const BuildWhere = (where: WhereArgs, schema: Schema, aliases: { [key: string]: number } = {}) => {
   let alias = `${schema.alias + (aliases[schema.alias] || "")}`
   aliases[schema.alias] = (aliases[schema.alias] || 0) + 1
   let info = {
      alias,
      wheres: [] as string[],
      whereArgs: {} as any,
      relations: {} as { [column: string]: { where: object } }
   }

   for (let column in where) {
      const xanv = schema.schema[column]
      const relations = schema.xansql.getRelations(schema.table)
      if (!xanv && !(column in relations)) {
         throw new Error("Invalid column in where clause: " + column)
      };
      if (relations[column]) {
         console.log(column, relations[column]);

      } else {
         xanv.parse(where[column])
      }

   }
   return info
}

export default BuildWhere;