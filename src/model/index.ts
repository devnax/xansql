import xansql from "../";
import Relation from "../schema/core/Relation";
import { Schema } from "../schema/types";
import { CreateArgs, DeleteArgs, FindArgs, UpdateArgs } from "./type";
import { isArray, isObject } from "../utils";
import ModelBase from "./Base";
import buildFindArgs from "./builder/buildFindArgs";

class Model extends ModelBase {
   constructor(xansql: xansql) {
      super(xansql)
   }

   schema(): Schema {
      throw new Error(`schema method not implemented in model ${this.constructor.name}`);
   }

   loopWhere(where: any, callback: Function) {
      for (let field in where) {
         let value = where[field]
         if (isObject(value)) {
            callback(field, value)
            this.loopWhere(value, callback)
         } else {
            callback(field, value)
         }
      }
   }

   buildJoin(relation: any, args: FindArgs) {

      const { take, skip, orderBy, where, select } = args;
      const main = relation.main
      const foregin = relation.foregin
      let joins = []

      if (take || skip || orderBy) {
         joins.push(
            `JOIN (
               SELECT ${main.alias}.${main.column}, ${foregin.alias}.${foregin.column} FROM ${foregin.table} ${foregin.alias}
               WHERE ${main.alias}.${main.column} = ${foregin.alias}.${foregin.column}
               ${take ? `LIMIT ${take}` : ""}
               ${skip ? `OFFSET ${skip}` : ""}
            ) ${foregin.alias} ON ${main.alias}.${main.column} = ${foregin.alias}.${foregin.column}`
         )
      } else {
         joins.push(
            `JOIN ${foregin.table} ${foregin.alias} ON ${main.alias}.${main.column} = ${foregin.alias}.${foregin.column}`
         )
      }

      for (let field in where) {

      }

      return joins
   }

   async find(args: FindArgs) {

      const builder = new buildFindArgs(this, args)
      const q = builder.build()
      // console.log(builder.relations);

      return
      const { take, skip, orderBy, where, select } = args;
      const schema: Schema = this.schema()
      const alias = this.alias

      let _select = select ? select.map(f => ` ${alias}.${f}`).join(',').trim() : "*"
      let sql = `SELECT ${_select} FROM ${this.table} ${alias}`

      for (let field in where) {
         let value = where[field]
         let schemaValue = schema[field]

         if (schemaValue instanceof Relation) {
            const foregin = this.getRelation(this.table, schemaValue)

            const joins = this.buildJoin(foregin, value as any)
            console.log(joins);


            // build join query

            // build JSON_AGGREGATE query

         } else {
            if (isObject(value)) {

            } else {

            }
         }
      }

   }
   async create(args: CreateArgs) {
      if (!isArray(args)) {

      } else {

      }
   }
   async update(args: UpdateArgs) { }
   async delete(args: DeleteArgs) { }
   async sync() {
      const schema = this.xansql.buildSchema(this)
   }
   async drop() { }
}


export default Model