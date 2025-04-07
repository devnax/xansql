import xansql from "..";
import Column from "../schema/core/Column";
import IDField from "../schema/core/IDField";
import Relation from "../schema/core/Relation";
import { Schema } from "../schema/types";
import { FindArgs } from "../type";
import { isObject } from "../utils";


abstract class ModelBase {
   xansql: xansql;
   table!: string;
   alias!: string;
   constructor(xansql: xansql) {
      this.xansql = xansql
   }

   protected jsonQuery(table: string, select: string[]) {
      const dialect = this.xansql.getDialect()
      let sql = ``
      switch (dialect.driver) {
         case "mysql":
            sql = `JSON_ARRAYAGG(JSON_OBJECT(
                  ${select.map(f => `"${f}", ${this.alias}.${f}`).join(', ')}
               )) as ${table}`
            break;
         case "sqlite":

            break;
         case "postgres":

            break;
      }

      return sql
   }


   protected getRelation(table: string, rel: Relation) {

      let rel_table = rel.table
      let rel_column = rel.column
      let single = false

      if (!rel_table) {
         const model = this.xansql.getModel(table)
         if (!model) throw new Error(`Invalid table name ${table}`)
         const schema: Schema = model.schema()
         const schemaCol: any = schema[rel.column]
         rel_table = schemaCol.constraints.references.table
         rel_column = schemaCol.constraints.references.column
         single = true
      }

      if (!rel_table) throw new Error(`Invalid relation table name ${table}`)
      if (!rel_column) throw new Error(`Invalid relation column name ${table}`)

      return {
         main: {
            table: table,
            column: rel.column,
            alias: this.xansql.getModel(table).alias,
         },
         foregin: {
            table: rel_table,
            column: rel_column,
            alias: this.xansql.getModel(rel_table).alias,
         },
         single
      }
   }


   protected buildFind(args: FindArgs, table: string, isRoot = true) {
      const { take, skip, orderBy, where, select } = args;
      const model = this.xansql.getModel(table)
      if (!model) throw new Error(`Invalid table name ${table}`)
      const schema: Schema = model.schema()
      const alias = this.alias

      let _build: any = {
         fields: [],
         join: [],
         where: [],
         orderBy: [],
      }

      if (isRoot) {
         _build.fields = select?.length ? select.map(f => `${alias}.${f}`) : [`${alias}.*`]
      }

      for (let field in where) {
         let value = where[field]
         let schemaValue = schema[field]

         if (schemaValue instanceof Relation) {
            const foregen = this.getRelation(table, schemaValue)
            console.log(field, value);

         } else {
            if (isObject(value)) {

            } else {

            }
         }
      }
      return _build
   }


}

export default ModelBase