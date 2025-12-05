import XansqlError from "../core/XansqlError";
import RelationExecuteArgs from "./Args/RelationExcuteArgs";
import ModelBase from "./Base";
import AggregateExecuter from "./Executer/Aggregate";
import CreateExecuter from "./Executer/Create";
import DeleteExecuter from "./Executer/Delete";
import FindExecuter from "./Executer/Find";
import UpdateExecuter from "./Executer/Update";
import { AggregateArgsType, CreateArgsType, DeleteArgsType, FindArgsType, UpdateArgsType, WhereArgsType } from "./types";

class Model extends ModelBase {

   async create(args: CreateArgsType): Promise<any[]> {
      const xansql = this.xansql;
      const isRelArgs = args instanceof RelationExecuteArgs
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.XansqlTransaction.begin()
         args = await this.callHook("beforeCreate", args) || args

         // event emit BEFORE_CREATE
         const executer = new CreateExecuter(this);
         await xansql.EventManager.emit("BEFORE_CREATE", { model: this, args });
         let results: any = await executer.execute(args);
         await xansql.EventManager.emit("CREATE", { model: this, results, args });

         results = await this.callHook("afterCreate", results, args) || results
         if (!isRelArgs) await xansql.XansqlTransaction.commit()
         return results
      } catch (error: any) {
         if (!isRelArgs) await xansql.XansqlTransaction.rollback()
         let errors: { [key: string]: string } = {}
         if (error instanceof Array && error[0] instanceof XansqlError) {
            for (let err of error) {
               errors[err.column] = err.message;
            }
         } else {
            errors["create"] = error.message;
         }
         throw error
      }
   }

   async update(args: UpdateArgsType): Promise<any[]> {
      const xansql = this.xansql;
      const isRelArgs = args instanceof RelationExecuteArgs
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.XansqlTransaction.begin()

         args = await this.callHook("beforeUpdate", args) || args
         const executer = new UpdateExecuter(this);
         await xansql.EventManager.emit("BEFORE_UPDATE", { model: this, args });
         let results: any = await executer.execute(args);
         await xansql.EventManager.emit("UPDATE", { model: this, results, args });
         results = await this.callHook("afterUpdate", results, args) || results

         if (!isRelArgs) await xansql.XansqlTransaction.commit()
         return results
      } catch (error: any) {
         if (!isRelArgs) await xansql.XansqlTransaction.rollback()
         let errors: { [key: string]: string } = {}
         if (error instanceof Array && error[0] instanceof XansqlError) {
            for (let err of error) {
               errors[err.column] = err.message;
            }
         } else {
            errors["update"] = error.message;
         }
         throw errors
      }
   }

   async delete(args: DeleteArgsType): Promise<any[]> {
      const xansql = this.xansql;
      const isRelArgs = args instanceof RelationExecuteArgs
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.XansqlTransaction.begin()

         args = await this.callHook("beforeDelete", args) || args
         const executer = new DeleteExecuter(this);
         await xansql.EventManager.emit("BEFORE_DELETE", { model: this, args });
         let results: any = await executer.execute(args);
         await xansql.EventManager.emit("DELETE", { model: this, results, args });
         results = await this.callHook("afterDelete", results, args) || results

         if (!isRelArgs) await xansql.XansqlTransaction.commit()
         return results
      } catch (error) {
         if (!isRelArgs) await xansql.XansqlTransaction.rollback()
         throw error
      }
   }

   async find(args: FindArgsType): Promise<any[]> {
      const isRelArgs = args instanceof RelationExecuteArgs
      if (isRelArgs) args = (args as any).args

      args = await this.callHook("beforeFind", args) || args
      const executer = new FindExecuter(this, async (row: any) => {
         return await this.callHook('transform', row) || row
      });
      await this.xansql.EventManager.emit("BEFORE_FIND", { model: this, args });
      let results = await executer.execute(args);
      await this.xansql.EventManager.emit("FIND", { model: this, results: results, args });
      results = await this.callHook("afterFind", results, args) || results
      return results
   }

   async findOne(args: FindArgsType): Promise<any | null> {
      const results = await this.find({
         ...args,
         limit: {
            take: 1,
            skip: 0
         }
      })
      return results.length ? results[0] : null
   }

   async findByID(id: number | string): Promise<any | null> {
      const results = await this.find({
         where: {
            [this.IDColumn]: id
         },
         limit: {
            take: 1,
            skip: 0
         }
      })
      return results.length ? results[0] : null
   }

   // Helpers Methods

   async aggregate(args: AggregateArgsType): Promise<any[]> {
      const isRelArgs = args instanceof RelationExecuteArgs
      if (isRelArgs) args = (args as any).args
      args = await this.callHook("beforeAggregate", args) || args
      const executer = new AggregateExecuter(this);
      await this.xansql.EventManager.emit("BEFORE_AGGREGATE", { model: this, args });
      let results = await executer.execute(args);
      await this.xansql.EventManager.emit("AGGREGATE", { model: this, results, args });

      results = await this.callHook("afterAggregate", results, args) || results
      return results
   }


   async paginate(page: number, args?: Omit<FindArgsType, "limit"> & { perpage?: number }) {
      const perpage = args?.perpage || 20;
      const skip = (page - 1) * perpage;
      const results = await this.find({
         ...args,
         limit: {
            take: perpage,
            skip
         }
      })
      const total = await this.count(args?.where || {})
      return {
         page,
         perpage,
         pagecount: Math.ceil(total / perpage),
         rowcount: total,
         results
      }
   }

   async count(where: WhereArgsType): Promise<number> {
      const res: any[] = await this.aggregate({
         where,
         select: {
            [this.IDColumn]: {
               count: true
            }
         }
      })
      return res.length ? res[0][`count_${this.IDColumn}`] : 0
   }

   async min(column: string, where: WhereArgsType): Promise<number> {
      if (!(column in this.schema)) {
         throw new XansqlError({
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
         });
      }
      const res: any[] = await this.aggregate({
         where,
         select: {
            [column]: {
               min: true
            }
         }
      })
      return res.length ? res[0][`min_${column}`] : 0
   }

   async max(column: string, where: WhereArgsType): Promise<number> {
      if (!(column in this.schema)) {
         throw new XansqlError({
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
         });
      }
      const res: any[] = await this.aggregate({
         where,
         select: {
            [column]: {
               max: true
            }
         }
      })
      return res.length ? res[0][`max_${column}`] : 0
   }

   async sum(column: string, where: WhereArgsType): Promise<number> {
      if (!(column in this.schema)) {
         throw new XansqlError({
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
         });
      }
      const res: any[] = await this.aggregate({
         where,
         select: {
            [column]: {
               sum: true
            }
         }
      })
      return res.length ? res[0][`sum_${column}`] : 0
   }

   async avg(column: string, where: WhereArgsType): Promise<number> {
      if (!(column in this.schema)) {
         throw new XansqlError({
            message: `Column "${column}" does not exist in table "${this.table}"`,
            model: this.table,
         });
      }
      const res: any[] = await this.aggregate({
         where,
         select: {
            [column]: {
               avg: true
            }
         }
      })
      return res.length ? res[0][`avg_${column}`] : 0
   }

   async exists(where: WhereArgsType): Promise<boolean> {
      return !!(await this.count({ where }))
   }

   async truncate() {
      await this.execute(`TRUNCATE TABLE ${this.table}`);
   }


   // end Helpers Methods
   // async createIndex(column: string) {
   //    const { IndexMigration } = this.xansql.XansqlMigration.TableMigration;
   //    const indexsql = IndexMigration.buildCreate(this.table, column);
   //    try {
   //       let executeId = undefined;
   //       if (typeof window !== "undefined") {
   //          executeId = ExecuteMeta.set({
   //             model: this,
   //             action: "CREATE_INDEX",
   //             modelType: "main",
   //             args: {}
   //          });
   //       }
   //       await this.xansql.execute(indexsql, executeId);
   //    } catch (error) {
   //       throw new Error("Index already exists");
   //    }
   // }

   // async dropIndex(column: string) {
   //    const { IndexMigration } = this.xansql.XansqlMigration.TableMigration;
   //    const indexsql = IndexMigration.buildDrop(this.table, column);
   //    let executeId = undefined;
   //    if (typeof window !== "undefined") {
   //       executeId = ExecuteMeta.set({
   //          model: this,
   //          action: "DROP_INDEX",
   //          modelType: "main",
   //          args: {}
   //       });
   //    }
   //    await this.xansql.execute(indexsql, executeId);
   // }

   // async addColumn(column: string) {
   //    const { TableMigration } = this.xansql.XansqlMigration;
   //    if (!(column in this.schema)) {
   //       throw new Error(`Column ${column} already exists in table ${this.table}`);
   //    }

   //    const field = this.schema[column] as XqlFields;
   //    if (!field) {
   //       throw new Error(`Field definition for column ${column} is missing in schema for table ${this.table}`);
   //    }
   //    const sqlColumn = TableMigration.buildColumn(this.table, column);
   //    let sql = `ALTER TABLE ${this.table} ADD COLUMN ${sqlColumn};`;
   //    let executeId = undefined;
   //    if (typeof window !== "undefined") {
   //       executeId = ExecuteMeta.set({
   //          model: this,
   //          action: "ADD_COLUMN",
   //          modelType: "main",
   //          args: {}
   //       });
   //    }
   //    await this.xansql.execute(sql, executeId);
   //    this.schema[column] = field;

   //    // add foreign key if exists
   //    const meta = field.meta || {};
   //    if (Foreign.isSchema(field)) {
   //       const info = Foreign.get(this, column)
   //       const fkSql = TableMigration.ForeignKeyMigration.buildCreate(this.table, column, info.table, info.relation.main);
   //       let executeId = undefined;
   //       if (typeof window !== "undefined") {
   //          executeId = ExecuteMeta.set({
   //             model: this,
   //             action: "ADD_FOREIGN_KEY",
   //             modelType: "main",
   //             args: {}
   //          });
   //       }
   //       await this.xansql.execute(`ALTER TABLE ${this.table} ADD ${fkSql};`, executeId);
   //    }

   //    // add index if exists
   //    if (meta.index) {
   //       const indexSql = TableMigration.IndexMigration.buildCreate(this.table, column);
   //       let executeId = undefined;
   //       if (typeof window !== "undefined") {
   //          executeId = ExecuteMeta.set({
   //             model: this,
   //             action: "CREATE_INDEX",
   //             modelType: "main",
   //             args: {}
   //          });
   //       }
   //       await this.xansql.execute(indexSql, executeId);
   //    }

   // }

   // async renameColumn(oldColumn: string, newColumn: string) {
   //    if (!(oldColumn in this.schema)) {
   //       throw new Error(`Column ${oldColumn} does not exist in table ${this.table}`);
   //    }
   //    if (newColumn in this.schema) {
   //       throw new Error(`Column ${newColumn} already exists in table ${this.table}`);
   //    }
   //    const engine = this.xansql.config.dialect.engine;
   //    let sql = ``;

   //    if (engine === 'mysql') {
   //       sql = `ALTER TABLE ${this.table} CHANGE COLUMN ${oldColumn} ${newColumn} ${this.xansql.XansqlMigration.TableMigration.buildColumn(this.table, oldColumn)};`;
   //    } else if (engine === 'postgresql') {
   //       sql = `ALTER TABLE ${this.table} RENAME COLUMN ${oldColumn} TO ${newColumn};`;
   //    } else if (engine === 'sqlite') {
   //       throw new Error(`Renaming columns is not supported in SQLite`);
   //    }
   //    let executeId = undefined;
   //    if (typeof window !== "undefined") {
   //       executeId = ExecuteMeta.set({
   //          model: this,
   //          action: "RENAME_COLUMN",
   //          modelType: "main",
   //          args: {}
   //       });
   //    }
   //    await this.xansql.execute(sql, executeId);
   //    const field = this.schema[oldColumn];
   //    delete this.schema[oldColumn];
   //    this.schema[newColumn] = field;

   //    // rename foreign key if exists
   //    const fieldMeta = field.meta || {};
   //    if (Foreign.isSchema(field)) {
   //       const fkOld = this.xansql.XansqlMigration.TableMigration.ForeignKeyMigration.identifier(this.table, oldColumn);
   //       const fkNew = this.xansql.XansqlMigration.TableMigration.ForeignKeyMigration.identifier(this.table, newColumn);
   //       let fsql = ``;
   //       if (engine === 'mysql') {
   //          fsql = `ALTER TABLE ${this.table} DROP FOREIGN KEY ${fkOld}, ADD CONSTRAINT ${fkNew} FOREIGN KEY (${newColumn}) REFERENCES ${Foreign.get(this, newColumn).table}(${Foreign.get(this, newColumn).relation.main});`;
   //       } else if (engine === 'postgresql') {
   //          fsql = `ALTER TABLE ${this.table} RENAME CONSTRAINT ${fkOld} TO ${fkNew};`;
   //       } else if (engine === 'sqlite') {
   //          throw new Error(`Renaming foreign keys is not supported in SQLite`);
   //       }
   //       let executeId = undefined;
   //       if (typeof window !== "undefined") {
   //          executeId = ExecuteMeta.set({
   //             model: this,
   //             action: "DROP_FOREIGN_KEY",
   //             modelType: "main",
   //             args: {}
   //          });
   //       }
   //       await this.xansql.execute(fsql, executeId);
   //    }

   //    // rename index if exists
   //    if (fieldMeta.index) {
   //       const indexOld = this.xansql.XansqlMigration.TableMigration.IndexMigration.identifier(this.table, oldColumn);
   //       const indexNew = this.xansql.XansqlMigration.TableMigration.IndexMigration.identifier(this.table, newColumn);
   //       let isql = ``;
   //       if (engine === 'mysql') {
   //          isql = `ALTER TABLE ${this.table} DROP INDEX ${indexOld}, ADD INDEX ${indexNew} (${newColumn});`;
   //       } else if (engine === 'postgresql') {
   //          isql = `ALTER INDEX ${indexOld} RENAME TO ${indexNew};`;
   //       } else if (engine === 'sqlite') {
   //          throw new Error(`Renaming indexes is not supported in SQLite`);
   //       }
   //       let executeId = undefined;
   //       if (typeof window !== "undefined") {
   //          executeId = ExecuteMeta.set({
   //             model: this,
   //             action: "DROP_INDEX",
   //             modelType: "main",
   //             args: {}
   //          });
   //       }
   //       await this.xansql.execute(isql, executeId);
   //    }
   // }

   // async dropColumn(column: string) {

   //    let sql = `ALTER TABLE ${this.table} DROP COLUMN ${column};`;
   //    let executeId = undefined;
   //    if (typeof window !== "undefined") {
   //       executeId = ExecuteMeta.set({
   //          model: this,
   //          action: "DROP_COLUMN",
   //          modelType: "main",
   //          args: {}
   //       });
   //    }
   //    await this.xansql.execute(sql, executeId);
   //    const field = this.schema[column];
   //    delete this.schema[column];
   //    const fieldMeta = field.meta || {};

   //    // drop foreign key if exists
   //    if (Foreign.isSchema(field)) {
   //       const fkSql = this.xansql.XansqlMigration.TableMigration.ForeignKeyMigration.buildDrop(this.table, column);
   //       let executeId = undefined;
   //       if (typeof window !== "undefined") {
   //          executeId = ExecuteMeta.set({
   //             model: this,
   //             action: "ADD_FOREIGN_KEY",
   //             modelType: "main",
   //             args: {}
   //          });
   //       }
   //       await this.xansql.execute(fkSql, executeId);
   //    }

   //    // drop index if exists
   //    if (fieldMeta.index) {
   //       const indexSql = this.xansql.XansqlMigration.TableMigration.IndexMigration.buildDrop(this.table, column);
   //       let executeId = undefined;
   //       if (typeof window !== "undefined") {
   //          executeId = ExecuteMeta.set({
   //             model: this,
   //             action: "CREATE_INDEX",
   //             modelType: "main",
   //             args: {}
   //          });
   //       }
   //       await this.xansql.execute(indexSql, executeId);
   //    }
   // }

}

export default Model;
