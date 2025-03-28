import xansql from ".";
import Column from "./schema/core/Column";
import IDField from "./schema/core/IDField";
import Relation from "./schema/core/Relation";
import { Schema } from "./schema/types";
import { CreateArgs, DeleteArgs, FindArgs, JsonQueryOption, UpdateArgs } from "./type";

class Model {
   xansql: xansql
   table!: string
   constructor(xansql: xansql) {
      this.xansql = xansql;
   }

   schema(): Schema {
      throw new Error(`schema method not implemented in model ${this.constructor.name}`);
   }

   private jsonQuery(table: string, select: string[]) {
      const alias = this.xansql.getAlias(table)
      const dialect = this.xansql.getDialect()
      let sql = ``
      switch (dialect.driver) {
         case "mysql":
            sql = `JSON_ARRAYAGG(JSON_OBJECT(
               ${select.map(f => `"${f}" VALUE ${alias}.${f}`).join(', ')}
            )) as ${table}`
            break;
         case "sqlite":

            break;
         case "postgres":

            break;
      }

      return sql
   }

   private buildFind(args: FindArgs, schema: Schema, table: string) {
      const { take, skip, orderBy, where, select } = args;

      const alias = this.xansql.getAlias(table)
      let _build: any = {
         fields: select?.length ? select.map(f => `${alias}.${f}`) : [],
         join: [],
         where: [],
         orderBy: [],
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
            let tb = field
            let model = this.xansql.getModel(tb)
            if (!model) {
               const schemaCol: any = schemaField.table
               const rel: Relation = schema[schemaCol] as any
               model = this.xansql.getModel(rel.table as string)
               tb = rel.table as string
            }
            console.log(value);

            if (value.select.length) {
               _build.fields.push(
                  this.jsonQuery(tb, value.select)
               )
            } else {

            }


            let subalias = this.xansql.getAlias(tb)
            // _build.join.push(`JOIN ${tb} ${subalias} ON ${subalias}.${schemaField.column} = ${tb}.${schemaField.column}`)

            if (model) {
               let v = this.buildFind(value, model.schema(), tb)
               _build.fields.push(...v.fields)
            } else {
               throw new Error(`Invalid field ${field} in where clause`)
            }
         } else {
            throw new Error(`Invalid field ${field} in where clause`);
         }
      }
      return _build
   }

   async find(args: FindArgs) {
      const build = this.buildFind(args, this.schema(), this.table)
      console.log(build);
      const sql = `SELECT ${build.fields.join(', ')} FROM ${this.table} ${build.join.join(' ')}`
      const where = build.where.length ? `WHERE ${build.where.join(' AND ')}` : ''
      const orderBy = build.orderBy.length ? `ORDER BY ${build.orderBy.join(', ')}` : ''


   }
   async create(args: CreateArgs) { }
   async update(args: UpdateArgs) { }
   async delete(args: DeleteArgs) { }
   async sync() {
      const schema = this.xansql.buildSchema(this)
   }
   async drop() { }
}


export default Model