import Xansql from "../core/Xansql";
import { iof } from "../utils";
import XqlIDField from "../xt/fields/IDField";
import XqlRelationMany from "../xt/fields/RelationMany";
import XqlRelationOne from "../xt/fields/RelationOne";
import { AggregateArgs, CreateArgs, DeleteArgs, ExactArgs, FindArgs, FindResult, ModelClass, PaginateArgs, SchemaShape, UpdateArgs, UpsertArgs, WhereArgs } from "./types";
import XansqlError from "../core/XansqlError";
import BuildFindArgs from "./Build/FindArgs";
import BuildCreateArgs from "./Build/CreateArgs";
import xt from "../xt";
import BuildAggregateArgs from "./Build/AggregateArgs";
import BuildUpdateArgs from "./Build/UpdateArgs";
import BuildDeleteArgs from "./Build/DeleteArgs";
import ModelWhere from "./ModelWhere";
import ReserveKeywords from "./ReserveKeywords";
import BuildUpsertArgs from "./Build/UpsertArgs";


abstract class Model<S extends SchemaShape = SchemaShape> {
   abstract schema(): S
   readonly xansql: Xansql
   readonly IDColumn: string
   readonly alias: string

   get table() {
      const name = this.constructor.name.replace(/_/g, "");
      let table = name.split(/(?=[A-Z])/).filter((l: string) => l.toLowerCase() !== 'model').join("_").toLowerCase()
      table = table.endsWith("y") ? table.slice(0, -1) + "ies" : table + "s"
      return table
   }

   constructor(xansql: Xansql) {
      this.xansql = xansql
      const fields = this.schema()

      this.IDColumn = Object.keys(fields).find(column => fields[column] instanceof XqlIDField) || ''
      if (!this.IDColumn) {
         throw new Error(`ID Column not found in schema ${this.table}. Please define an ID column using xt.id() in the schema.`)
      }

      // build model registry in xansql for relations
      xansql.models.set(this.constructor as ModelClass<any>, this as any)
      for (let column in fields) {
         const field = fields[column]
         if (iof(field, XqlRelationMany, XqlRelationOne) && !xansql.models.has(field.model)) {
            xansql.model(field.model)
         }
      }

      // const aliases = Array.from(xansql.models.values()).map(m => m.alias)
      // const parts = this.table.split(/_|(?=[A-Z])/);
      // let alias = parts.map(p => p[0]).join('');
      // if (!alias || alias.length < 1) {
      //    alias = this.table.slice(0, 2);
      // }
      // alias = alias.toLowerCase();
      // let counter = 1;
      // while (aliases.includes(alias)) {
      //    alias = alias + counter;
      //    counter++;
      // }
      // this.alias = alias

      const aliases = Array.from(xansql.models.values()).map(m => m.alias);
      const parts = this.table.split(/_|(?=[A-Z])/).filter(Boolean);

      let alias = parts.map(p => p[0]).join('').toLowerCase(); // up
      let indexes = parts.map(() => 1);

      while (aliases.includes(alias)) {
         let changed = false;

         for (let i = 0; i < parts.length; i++) {
            if (indexes[i] < parts[i].length) {
               indexes[i]++;
               changed = true;
               break;
            }
         }

         if (!changed) break;

         alias = parts.map((p, i) => p.slice(0, indexes[i])).join('').toLowerCase();
      }

      if (aliases.includes(alias)) {
         let counter = 1;
         let temp = alias;
         while (aliases.includes(temp)) {
            temp = alias + counter;
            counter++;
         }
         alias = temp;
      }
      this.alias = alias;

      let migration_columns = []
      let index_sqls = []
      for (let column in fields) {
         if (ReserveKeywords.includes(column)) {
            throw new XansqlError({
               code: "INVALID_ARGUMENTS",
               message: `Invalid column name "${column}" in table "${this.table}". "${column}" is a reserved keyword.`,
               model: this.table,
               field: column
            })
         }

         const field = fields[column]

         // check field is valid XqlField
         if (!field.meta || !field.parse) {
            throw new XansqlError({
               code: "INTERNAL_ERROR",
               model: this.constructor.name,
               field: column,
               message: `Invalid field type in model ${this.constructor.name}:${column}`
            })
         }

         field.table = this.table
         field.column_name = column
         field.engine = xansql.dialect.engine

         if (iof(field, XqlRelationMany, XqlRelationOne)) {
            const targetColumn = field.targetColumn
            const TModel = field.model
            const targetModel = xansql.models.get(TModel)
            if (!targetModel) {
               throw new Error(`Target model for relation ${column} in schema ${fields.table} not found. Please define the target schema before defining the relation.`)
            }
            const targetShape = targetModel.schema() as Record<string, any>

            // check if relation target exists
            if (field.type === 'relation-many') {
               if (!targetShape[targetColumn] || targetShape[targetColumn].type !== "relation-one") {
                  throw new Error(`Target column ${targetColumn} for relation ${column} in schema ${fields.table} not found in target schema ${targetModel.table}. Please define the target column in the target schema.`)
               }
            } else if (!targetShape[targetColumn]) {
               // const tschema = targetModel.schema()
               // tschema[targetColumn] = xt.many(this.constructor as any, column)
               // targetModel.schema = (() => tschema).bind(targetModel)
            }

            if (field.type == 'relation-one') {
               field.relationInfo = {
                  self: {
                     table: this.table,
                     relation: column,
                     column: column,
                  },
                  target: {
                     table: targetModel.table,
                     relation: targetModel.IDColumn,
                     column: targetColumn,
                  },
                  sql: `${this.table}.${column} = ${targetModel.table}.${targetModel.IDColumn}`
               }
            } else if (field.type == 'relation-many') {
               field.relationInfo = {
                  self: {
                     table: this.table,
                     relation: this.IDColumn,
                     column: column,
                  },
                  target: {
                     table: targetModel.table,
                     relation: targetColumn,
                     column: targetColumn,
                  },
                  sql: `${this.table}.${this.IDColumn} = ${targetModel.table}.${targetColumn}`
               }
            }
         }

         if (!iof(field, XqlRelationMany)) {
            const info = field.info
            migration_columns.push(info.sql.column)
            if (info.sql.create_index) {
               index_sqls.push(info.sql.create_index)
            }
         }
      }

      this.schema = (() => fields).bind(this)

      // migration server only
      if (this.table !== "_xansql_migration") {
         xansql.Migration.migrate(this)
      }
   }

   // private async migrationInit() {
   //    const fields = this.schema()
   //    let migration_columns = []
   //    let index_sqls = []
   //    for (let column in fields) {
   //       const field = fields[column]

   //       if (!iof(field, XqlRelationMany)) {
   //          const info = field.info
   //          migration_columns.push(info.sql.column)
   //          if (info.sql.create_index) {
   //             index_sqls.push(info.sql.create_index)
   //          }
   //       }
   //    }
   //    const sql = `CREATE TABLE IF NOT EXISTS ${this.table}(${migration_columns.join(",")})`
   //    await this.xansql.execute(sql)

   //    for (let idxql of index_sqls) {
   //       try {
   //          await this.xansql.execute(idxql)
   //       } catch (error) { }
   //    }
   // }

   where(inColumn: string, where?: WhereArgs<S>) {
      return new ModelWhere<S>(this, inColumn, where)
   }

   async execute(sql: string, debug?: boolean) {
      return this.xansql.execute(sql, debug)
   }

   async find<T extends FindArgs<S>>(args: ExactArgs<T, FindArgs<S>>): Promise<FindResult<T, S>[] | null> {
      try {
         const build = new BuildFindArgs(args as any, this)
         const results = await build.results()
         return results as any
      } catch (error) {
         throw error
      }
   }

   async findOne<T extends FindArgs<S>>(args: ExactArgs<T, FindArgs<S>>): Promise<FindResult<T, S> | null> {
      try {
         const results = await this.find(args)
         if (results?.length) {
            return results[0]
         }
         return null
      } catch (error) {
         throw error
      }
   }

   async aggregate<T extends AggregateArgs<S, any>>(args: ExactArgs<T, AggregateArgs<S, T>>) {
      try {
         await this.xansql.XansqlTransaction.begin()
         const build = new BuildAggregateArgs(args as any, this)
         const results = await build.results()
         await this.xansql.XansqlTransaction.commit()
         return results as any
      } catch (error) {
         await this.xansql.XansqlTransaction.rollback()
         throw error
      }
   }

   async create<T extends CreateArgs<S>>(args: ExactArgs<T, CreateArgs<S>>): Promise<FindResult<T, S>[] | null> {
      const useTransection = args.useTransection ?? true
      try {
         useTransection && await this.xansql.XansqlTransaction.begin()
         const build = new BuildCreateArgs(args as any, this)
         const results = await build.results() as any
         useTransection && await this.xansql.XansqlTransaction.commit()
         return results
      } catch (error) {
         useTransection && await this.xansql.XansqlTransaction.rollback()
         throw error
      }
   }

   async update<T extends UpdateArgs<S>>(args: ExactArgs<T, UpdateArgs<S>>) {
      const useTransection = args.useTransection ?? true
      try {
         useTransection && await this.xansql.XansqlTransaction.begin()
         const build = new BuildUpdateArgs(args, this)
         const results = await build.results()
         useTransection && await this.xansql.XansqlTransaction.commit()
         return results
      } catch (error) {
         useTransection && await this.xansql.XansqlTransaction.rollback()
         throw error
      }
   }

   async upsert<T extends UpsertArgs<S>>(args: ExactArgs<T, UpsertArgs<S>>) {
      const useTransection = args.useTransection ?? true
      try {
         useTransection && await this.xansql.XansqlTransaction.begin()
         const build = new BuildUpsertArgs(args, this)
         const results = await build.results()
         useTransection && await this.xansql.XansqlTransaction.commit()
         return results
      } catch (error) {
         useTransection && await this.xansql.XansqlTransaction.rollback()
         throw error
      }
   }

   async delete<T extends DeleteArgs<S>>(args: ExactArgs<T, DeleteArgs<S>>) {
      const useTransection = args.useTransection ?? true
      try {
         useTransection && await this.xansql.XansqlTransaction.begin()
         const build = new BuildDeleteArgs(args as any, this as any)
         const results = await build.results()
         useTransection && await this.xansql.XansqlTransaction.commit()
         return results
      } catch (error) {
         useTransection && await this.xansql.XansqlTransaction.rollback()
         throw error
      }
   }

   // Helper Methods
   async paginate(args: PaginateArgs<S>) {
      const page = args.page
      const perpage = args?.perpage || 20;
      const skip = (page - 1) * perpage;
      const results = await this.find({
         ...args as any,
         limit: {
            take: perpage,
            skip
         }
      })
      const total = await this.count(args?.where || {} as WhereArgs<S>)
      return {
         results,
         total,
         page,
         perpage,
         pages: Math.ceil(total / perpage)
      }
   }

   async exists(where: WhereArgs<S>): Promise<boolean> {
      return !!(await this.count(where))
   }

   // Aggregate Methods
   async count(where: WhereArgs<S>): Promise<number> {
      const res: any = await this.aggregate({
         where,
         select: {
            [this.IDColumn]: {
               count: true
            }
         } as any
      })
      return res?.length ? res[0][`count_${this.IDColumn}`] : 0
   }

   async min(column: string, where: WhereArgs<S>): Promise<number> {
      if (!(column in this.schema)) {
         throw new XansqlError({
            code: "INVALID_ARGUMENTS",
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
            field: column
         });
      }
      const res: any = await this.aggregate({
         where,
         select: {
            [column]: {
               min: true
            }
         } as any
      })
      return res?.length ? res[0][`min_${column}`] : 0
   }

   async max(column: string, where: WhereArgs<S>): Promise<number> {
      if (!(column in this.schema)) {
         throw new XansqlError({
            code: "INVALID_ARGUMENTS",
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
            field: column
         });
      }
      const res: any = await this.aggregate({
         where,
         select: {
            [column]: {
               max: true
            }
         } as any
      })
      return res?.length ? res[0][`max_${column}`] : 0
   }

   async sum(column: string, where: WhereArgs<S>): Promise<number> {
      if (!(column in this.schema)) {
         throw new XansqlError({
            code: "INVALID_ARGUMENTS",
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
            field: column
         });
      }
      const res: any = await this.aggregate({
         where,
         select: {
            [column]: {
               sum: true
            }
         } as any
      })
      return res?.length ? res[0][`sum_${column}`] : 0
   }

   async avg(column: string, where: WhereArgs<S>): Promise<number> {
      if (!(column in this.schema)) {
         throw new XansqlError({
            code: "INVALID_ARGUMENTS",
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
            field: column
         });
      }
      const res: any = await this.aggregate({
         where,
         select: {
            [column]: {
               avg: true
            }
         } as any
      })
      return res?.length ? res[0][`avg_${column}`] : 0
   }
}

export default Model