import xansql from "..";
import Column from "../schema/core/Column";
import IDField from "../schema/core/IDField";
import Relation from "../schema/core/Relation";
import { Schema } from "../schema/types";
import { FindArgs } from "../type";


abstract class ModelBase {
   xansql: xansql;
   table!: string;
   constructor(xansql: xansql) {
      this.xansql = xansql
   }

   protected jsonQuery(table: string, select: string[]) {
      const alias = this.xansql.getAlias(table)
      const dialect = this.xansql.getDialect()
      let sql = ``
      switch (dialect.driver) {
         case "mysql":
            sql = `JSON_ARRAYAGG(JSON_OBJECT(
                  ${select.map(f => `"${f}", ${alias}.${f}`).join(', ')}
               )) as ${table}`
            break;
         case "sqlite":

            break;
         case "postgres":

            break;
      }

      return sql
   }


   protected getRelation(table: string, field: Relation) {
      const model = this.xansql.getModel(table)
      if (!model) throw new Error(`Invalid table name ${table}`)
      const schema: Schema = model.schema()

      let rel_table = field.table
      let rel_column = field.column

      if (rel_column && schema[rel_column]) {
         const rel = schema[rel_column]
         if (rel instanceof Relation) {
            rel_table = rel.table
            rel_column = rel.column
         }
      }

      if (rel_table && rel_column) {

      }
   }


   protected buildFind(args: FindArgs, table: string, isRoot = true) {
      const { take, skip, orderBy, where, select } = args;
      const model = this.xansql.getModel(table)
      if (!model) throw new Error(`Invalid table name ${table}`)
      const schema: Schema = model.schema()
      const alias = this.xansql.getAlias(table)

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
         let value = (where as any)[field]
         let schemaField = schema[field]
         let isCol = (schemaField instanceof Column) || (schemaField instanceof IDField)
         if (isCol) {
            if (typeof value === 'object' && !Array.isArray(value)) {

            } else {

            }
         } else if (schemaField instanceof Relation) {
            const v = this.getRelation(field, schemaField)

            let tb = field
            let model = this.xansql.getModel(tb)
            if (!model) {
               const schemaCol: any = schemaField.table
               const rel: Relation = schema[schemaCol] as any
               model = this.xansql.getModel(rel.table as string)
               tb = rel.table as string
            }

            if (value.select.length) {
               _build.fields.push(
                  this.jsonQuery(tb, value.select)
               )
            } else {

            }
            let subalias = this.xansql.getAlias(tb)
            _build.join.push(`JOIN ${tb} ${subalias} ON ${subalias}.${schemaField.column} = ${tb}.${schemaField.column}`)

            // _build.join.push(`JOIN ${tb} ${subalias} ON ${subalias}.${schemaField.column} = ${tb}.${schemaField.column}`)

            if (model) {
               let v = this.buildFind(value, tb, false)
               _build.fields.push(...v.fields)
               _build.join.push(...v.join)
            } else {
               throw new Error(`Invalid field ${field} in where clause`)
            }
         } else {
            throw new Error(`Invalid field ${field} in where clause`);
         }
      }
      return _build
   }


}

export default ModelBase