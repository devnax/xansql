import Xansql from "../core/Xansql";
import XansqlError from "../core/XansqlError";
import { iof } from "../utils";
import { XqlSchemaShape } from "../xt/types";
import RelationExecuteArgs from "./Args/RelationExcuteArgs";
import ModelBase from "./Base";
import AggregateExecuter from "./Executer/Aggregate";
import CreateExecuter from "./Executer/Create";
import DeleteExecuter from "./Executer/Delete";
import FindExecuter from "./Executer/Find";
import UpdateExecuter from "./Executer/Update";
import Migrations from "./Migrations";
import { AggregateArgs, AggregateResult, CreateArgs, DeleteArgs, FindArgs, ResultArgs, UpdateArgs, WhereArgs } from "./types";

class Model<Xql extends Xansql, T extends string, S extends XqlSchemaShape> extends ModelBase<Xql, T, S> {
   readonly migrations: Migrations<any>

   constructor(xansql: Xql, table: T, schema: S) {
      super(xansql, table, schema);
      this.migrations = new Migrations(this as any);
   }

   async create<T extends CreateArgs<S>>(args: T): Promise<ResultArgs<S, T['select']>[] | null> {
      const xansql = this.xansql;
      const isRelArgs = iof(args, RelationExecuteArgs)
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.XansqlTransaction.begin()
         args = await this.callHook("beforeCreate", args) || args

         // event emit BEFORE_CREATE
         const executer = new CreateExecuter(this as any);
         await xansql.EventManager.emit("BEFORE_CREATE", { model: this, args } as any);
         let results: any = await executer.execute(args as any);
         await xansql.EventManager.emit("CREATE", { model: this, results, args } as any);

         results = await this.callHook("afterCreate", results, args) || results
         if (!isRelArgs) await xansql.XansqlTransaction.commit()
         return results?.length ? results : null
      } catch (error: any) {
         if (!isRelArgs) await xansql.XansqlTransaction.rollback()
         let errors: { [key: string]: string } = {}
         if (iof(error, Array) && iof(error[0], XansqlError)) {
            for (let err of error) {
               errors[err.column] = err.message;
            }
         } else {
            errors["create"] = error.message;
         }
         throw error
      }
   }

   async update<T extends UpdateArgs<S>>(args: T): Promise<ResultArgs<S, T['select']>[] | null> {
      const xansql = this.xansql;
      const isRelArgs = iof(args, RelationExecuteArgs)
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.XansqlTransaction.begin()

         args = await this.callHook("beforeUpdate", args) || args
         const executer = new UpdateExecuter(this as any);
         await xansql.EventManager.emit("BEFORE_UPDATE", { model: this, args } as any);
         let results: any = await executer.execute(args as any);
         await xansql.EventManager.emit("UPDATE", { model: this, results, args } as any);
         results = await this.callHook("afterUpdate", results, args) || results

         if (!isRelArgs) await xansql.XansqlTransaction.commit()
         return results?.length ? results : null
      } catch (error: any) {
         if (!isRelArgs) await xansql.XansqlTransaction.rollback()
         let errors: { [key: string]: string } = {}
         if (iof(error, Array) && iof(error[0], XansqlError)) {
            for (let err of error) {
               errors[err.column] = err.message;
            }
         } else {
            errors["update"] = error.message;
         }
         throw errors
      }
   }

   async delete<T extends DeleteArgs<S>>(args: T): Promise<ResultArgs<S, T['select']>[] | null> {
      const xansql = this.xansql;
      const isRelArgs = iof(args, RelationExecuteArgs)
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.XansqlTransaction.begin()

         args = await this.callHook("beforeDelete", args) || args
         const executer = new DeleteExecuter(this as any);
         await xansql.EventManager.emit("BEFORE_DELETE", { model: this, args } as any);
         let results: any = await executer.execute(args as any);
         await xansql.EventManager.emit("DELETE", { model: this, results, args } as any);
         results = await this.callHook("afterDelete", results, args) || results

         if (!isRelArgs) await xansql.XansqlTransaction.commit()
         return results?.length ? results : null
      } catch (error) {
         if (!isRelArgs) await xansql.XansqlTransaction.rollback()
         throw error
      }
   }

   async find<T extends FindArgs<S>>(args: T): Promise<ResultArgs<S, T['select']>[] | null> {
      const isRelArgs = iof(args, RelationExecuteArgs)
      if (isRelArgs) args = (args as any).args

      args = await this.callHook("beforeFind", args) || args
      const executer = new FindExecuter(this as any, async (row: any) => {
         return await this.callHook('transform', row) || row
      });
      await this.xansql.EventManager.emit("BEFORE_FIND", { model: this, args } as any);
      let results = await executer.execute(args as any);
      await this.xansql.EventManager.emit("FIND", { model: this, results: results, args } as any);
      results = await this.callHook("afterFind", results, args) || results
      return results?.length ? results : null
   }

   async findOne<T extends FindArgs<S>>(args: T): Promise<ResultArgs<S, T['select']> | null> {
      const results = await this.find({
         ...args,
         limit: {
            take: 1,
            skip: 0
         }
      })
      return results?.length ? results[0] : null
   }

   async findByID(id: number): Promise<ResultArgs<S, {}> | null> {
      return await this.findOne({
         where: {
            [this.IDColumn]: id
         },
         limit: {
            take: 1,
            skip: 0
         }
      } as any)
   }

   // Helpers Methods

   async aggregate<T extends AggregateArgs<S>>(args: T): Promise<AggregateResult<T['select']>[] | null> {
      const isRelArgs = iof(args, RelationExecuteArgs)
      if (isRelArgs) args = (args as any).args
      args = await this.callHook("beforeAggregate", args) || args
      const executer = new AggregateExecuter(this as any);
      await this.xansql.EventManager.emit("BEFORE_AGGREGATE", { model: this, args } as any);
      let results = await executer.execute(args as any);
      await this.xansql.EventManager.emit("AGGREGATE", { model: this, results, args } as any);

      results = await this.callHook("afterAggregate", results, args) || results
      return results?.length ? results : null
   }


   async paginate(page: number, args?: Omit<FindArgs<S>, "limit"> & { perpage?: number }) {
      const perpage = args?.perpage || 20;
      const skip = (page - 1) * perpage;
      const results = await this.find({
         ...args,
         limit: {
            take: perpage,
            skip
         }
      })
      const total = await this.count(args?.where || {} as WhereArgs<S>)
      return {
         page,
         perpage,
         pagecount: Math.ceil(total / perpage),
         rowcount: total,
         results
      }
   }

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
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
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
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
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
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
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
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
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

   async exists(where: WhereArgs<S>): Promise<boolean> {
      return !!(await this.count(where))
   }

   async addColumn(column: string) {
      if (!(column in this.schema)) {
         throw new XansqlError({
            message: `Column "${column}" does not exist in schema "${this.table}"`,
            model: this.table,
         });
      }

      const migrations = this.migrations.up()
      const colsql = migrations.columns[column];
      const sql = `ALTER TABLE ${this.table} ADD COLUMN ${colsql}`;
      await this.execute(sql);

      // add indexes
      if (column in migrations.indexes) {
         await this.execute(migrations.indexes[column]);
      }

      // add foreign keys
      if (column in migrations.foreign_keys) {
         await this.execute(migrations.foreign_keys[column]);
      }

      // add types
      if (column in migrations.types) {
         await this.execute(migrations.types[column]);
      }
   }

   async removeColumn(column: string) {
      const sql = `ALTER TABLE ${this.table} DROP COLUMN ${column}`;

      // remove foreign keys
      const migrations = this.migrations.down()
      if (column in migrations.foreign_keys) {
         await this.execute(migrations.foreign_keys[column]);
      }

      // remove indexes
      if (column in migrations.indexes) {
         await this.execute(migrations.indexes[column]);
      }

      // remove types
      if (column in migrations.types) {
         await this.execute(migrations.types[column]);
      }

      await this.execute(sql);
   }

   async renameColumn(oldColumn: string, newColumn: string) {
      if (!(newColumn in this.schema)) {
         throw new XansqlError({
            message: `Column "${newColumn}" does not exist in schema "${this.table}"`,
            model: this.table,
         });
      }
      const sql = `ALTER TABLE ${this.table} RENAME COLUMN ${oldColumn} TO ${newColumn}`;
      await this.execute(sql);
   }

   async truncate() {
      await this.execute(`TRUNCATE TABLE ${this.table}`);
   }

   async drop() {
      const sql = this.migrations.down().table
      await this.execute(sql)
   }

}

export default Model;
