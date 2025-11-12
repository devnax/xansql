import Foreign from "../core/classes/ForeignInfo";
import ExecuteMeta from "../core/ExcuteMeta";
import { XansqlModelOptions } from "../core/type";
import { XansqlSchemaObject, XqlFields } from "../Types/types";
import RelationExecuteArgs from "./Args/RelationExcuteArgs";
import ModelBase from "./Base";
import AggregateExecuter from "./Executer/Aggregate";
import CreateExecuter from "./Executer/Create";
import DeleteExecuter from "./Executer/Delete";
import FindExecuter from "./Executer/Find";
import UpdateExecuter from "./Executer/Update";
import { AggregateArgsType, CreateArgsType, DeleteArgsType, FindArgsType, UpdateArgsType, WhereArgsType } from "./type";

class Model extends ModelBase {

   options: XansqlModelOptions = {}
   constructor(table: string, schema: XansqlSchemaObject) {
      super(table, schema)
   }

   async create(args: CreateArgsType) {
      const xansql = this.xansql;
      const isRelArgs = args instanceof RelationExecuteArgs
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.XansqlTransaction.begin()
         if (this.options?.hooks && this.options.hooks.beforeCreate) {
            args = await this.options.hooks.beforeCreate(args) || args
         }

         const executer = new CreateExecuter(this);

         let result = await executer.execute(args);

         if (this.options?.hooks && this.options.hooks.afterCreate) {
            result = await this.options.hooks.afterCreate(result, args) || result
         }
         if (!isRelArgs) await xansql.XansqlTransaction.commit()
         return result
      } catch (error) {
         if (!isRelArgs) await xansql.XansqlTransaction.rollback()
         throw error;
      }
   }

   async update(args: UpdateArgsType) {
      const xansql = this.xansql;
      const isRelArgs = args instanceof RelationExecuteArgs
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.XansqlTransaction.begin()
         if (this.options?.hooks && this.options.hooks.beforeUpdate) {
            args = await this.options.hooks.beforeUpdate(args) || args
         }
         const executer = new UpdateExecuter(this);
         const result = await executer.execute(args);
         if (this.options?.hooks && this.options.hooks.afterUpdate) {
            return await this.options.hooks.afterUpdate(result, args) || result
         }
         if (!isRelArgs) await xansql.XansqlTransaction.commit()
         return result
      } catch (error) {
         if (!isRelArgs) await xansql.XansqlTransaction.rollback()
         throw error;
      }

   }

   async delete(args: DeleteArgsType) {
      const xansql = this.xansql;
      const isRelArgs = args instanceof RelationExecuteArgs
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.XansqlTransaction.begin()
         if (this.options?.hooks && this.options.hooks.beforeDelete) {
            args = await this.options.hooks.beforeDelete(args) || args
         }
         const executer = new DeleteExecuter(this);
         const result = await executer.execute(args);
         if (this.options.hooks && this.options.hooks.afterDelete) {
            return await this.options.hooks.afterDelete(result, args) || result
         }
         if (!isRelArgs) await xansql.XansqlTransaction.commit()
         return result
      } catch (error) {
         if (!isRelArgs) await xansql.XansqlTransaction.rollback()
         throw error;
      }
   }

   async find(args: FindArgsType) {
      if (this.options.hooks && this.options.hooks.beforeFind) {
         args = await this.options.hooks.beforeFind(args) || args
      }
      const executer = new FindExecuter(this);
      const result = await executer.execute(args);
      if (this.options.hooks && this.options.hooks.afterFind) {
         return await this.options.hooks.afterFind(result, args) || result
      }
      return result
   }

   async aggregate(args: AggregateArgsType) {
      if (this.options?.hooks && this.options.hooks.beforeAggregate) {
         args = await this.options.hooks.beforeAggregate(args) || args
      }
      const executer = new AggregateExecuter(this);
      const result = await executer.execute(args);
      if (this.options?.hooks && this.options.hooks.afterAggregate) {
         return await this.options.hooks.afterAggregate(result, args) || result
      }
      return result;
   }

   async truncate() {
      await this.xansql.execute(`TRUNCATE TABLE ${this.table}`);
   }

   // Helpers Methods

   async findOne(args: FindArgsType) {
      const res = await this.find({
         ...args,
         limit: {
            take: 1,
            skip: 0
         }
      })
      return res?.[0];
   }

   async findById(id: any, args?: Omit<FindArgsType, "where">) {
      return await this.findOne({
         ...args,
         where: {
            [this.IDColumn]: id
         }
      })
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
      const res = await this.aggregate({
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
      if (!(column in this.schema)) throw new Error(`Column "${column}" does not exist in table "${this.table}"`);
      const res = await this.aggregate({
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
      if (!(column in this.schema)) throw new Error(`Column "${column}" does not exist in table "${this.table}"`);
      const res = await this.aggregate({
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
      if (!(column in this.schema)) throw new Error(`Column "${column}" does not exist in table "${this.table}"`);
      const res = await this.aggregate({
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
      if (!(column in this.schema)) throw new Error(`Column "${column}" does not exist in table "${this.table}"`);
      const res = await this.aggregate({
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

   // end Helpers Methods
   async createIndex(column: string) {
      const { IndexMigration } = this.xansql.XansqlMigration.TableMigration;
      const indexsql = IndexMigration.buildCreate(this.table, column);
      try {
         let executeId = undefined;
         if (typeof window !== "undefined") {
            executeId = ExecuteMeta.set({
               model: this,
               action: "CREATE_INDEX",
               modelType: "main",
               args: {}
            });
         }
         await this.xansql.execute(indexsql, executeId);
      } catch (error) {
         throw new Error("Index already exists");
      }
   }

   async dropIndex(column: string) {
      const { IndexMigration } = this.xansql.XansqlMigration.TableMigration;
      const indexsql = IndexMigration.buildDrop(this.table, column);
      let executeId = undefined;
      if (typeof window !== "undefined") {
         executeId = ExecuteMeta.set({
            model: this,
            action: "DROP_INDEX",
            modelType: "main",
            args: {}
         });
      }
      await this.xansql.execute(indexsql, executeId);
   }

   async addColumn(column: string, field: XqlFields) {
      const { TableMigration } = this.xansql.XansqlMigration;
      if (column in this.schema) {
         throw new Error(`Column ${column} already exists in table ${this.table}`);
      }
      const sqlColumn = TableMigration.buildColumn(this.table, column);
      let sql = `ALTER TABLE ${this.table} ADD COLUMN ${sqlColumn};`;
      let executeId = undefined;
      if (typeof window !== "undefined") {
         executeId = ExecuteMeta.set({
            model: this,
            action: "ADD_COLUMN",
            modelType: "main",
            args: {}
         });
      }
      await this.xansql.execute(sql, executeId);
      this.schema[column] = field;

      // add foreign key if exists
      const meta = field.meta || {};
      if (Foreign.isSchema(field)) {
         const info = Foreign.get(this, column)
         const fkSql = TableMigration.ForeignKeyMigration.buildCreate(this.table, column, info.table, info.relation.main);
         let executeId = undefined;
         if (typeof window !== "undefined") {
            executeId = ExecuteMeta.set({
               model: this,
               action: "ADD_FOREIGN_KEY",
               modelType: "main",
               args: {}
            });
         }
         await this.xansql.execute(`ALTER TABLE ${this.table} ADD ${fkSql};`, executeId);
      }

      // add index if exists
      if (meta.index) {
         const indexSql = TableMigration.IndexMigration.buildCreate(this.table, column);
         let executeId = undefined;
         if (typeof window !== "undefined") {
            executeId = ExecuteMeta.set({
               model: this,
               action: "CREATE_INDEX",
               modelType: "main",
               args: {}
            });
         }
         await this.xansql.execute(indexSql, executeId);
      }

   }

   async renameColumn(oldColumn: string, newColumn: string) {
      if (!(oldColumn in this.schema)) {
         throw new Error(`Column ${oldColumn} does not exist in table ${this.table}`);
      }
      if (newColumn in this.schema) {
         throw new Error(`Column ${newColumn} already exists in table ${this.table}`);
      }
      const engine = this.xansql.config.dialect.engine;
      let sql = ``;

      if (engine === 'mysql') {
         sql = `ALTER TABLE ${this.table} CHANGE COLUMN ${oldColumn} ${newColumn} ${this.xansql.XansqlMigration.TableMigration.buildColumn(this.table, oldColumn)};`;
      } else if (engine === 'postgresql') {
         sql = `ALTER TABLE ${this.table} RENAME COLUMN ${oldColumn} TO ${newColumn};`;
      } else if (engine === 'sqlite') {
         throw new Error(`Renaming columns is not supported in SQLite`);
      }
      let executeId = undefined;
      if (typeof window !== "undefined") {
         executeId = ExecuteMeta.set({
            model: this,
            action: "RENAME_COLUMN",
            modelType: "main",
            args: {}
         });
      }
      await this.xansql.execute(sql, executeId);
      const field = this.schema[oldColumn];
      delete this.schema[oldColumn];
      this.schema[newColumn] = field;

      // rename foreign key if exists
      const fieldMeta = field.meta || {};
      if (Foreign.isSchema(field)) {
         const fkOld = this.xansql.XansqlMigration.TableMigration.ForeignKeyMigration.identifier(this.table, oldColumn);
         const fkNew = this.xansql.XansqlMigration.TableMigration.ForeignKeyMigration.identifier(this.table, newColumn);
         let fsql = ``;
         if (engine === 'mysql') {
            fsql = `ALTER TABLE ${this.table} DROP FOREIGN KEY ${fkOld}, ADD CONSTRAINT ${fkNew} FOREIGN KEY (${newColumn}) REFERENCES ${Foreign.get(this, newColumn).table}(${Foreign.get(this, newColumn).relation.main});`;
         } else if (engine === 'postgresql') {
            fsql = `ALTER TABLE ${this.table} RENAME CONSTRAINT ${fkOld} TO ${fkNew};`;
         } else if (engine === 'sqlite') {
            throw new Error(`Renaming foreign keys is not supported in SQLite`);
         }
         let executeId = undefined;
         if (typeof window !== "undefined") {
            executeId = ExecuteMeta.set({
               model: this,
               action: "DROP_FOREIGN_KEY",
               modelType: "main",
               args: {}
            });
         }
         await this.xansql.execute(fsql, executeId);
      }

      // rename index if exists
      if (fieldMeta.index) {
         const indexOld = this.xansql.XansqlMigration.TableMigration.IndexMigration.identifier(this.table, oldColumn);
         const indexNew = this.xansql.XansqlMigration.TableMigration.IndexMigration.identifier(this.table, newColumn);
         let isql = ``;
         if (engine === 'mysql') {
            isql = `ALTER TABLE ${this.table} DROP INDEX ${indexOld}, ADD INDEX ${indexNew} (${newColumn});`;
         } else if (engine === 'postgresql') {
            isql = `ALTER INDEX ${indexOld} RENAME TO ${indexNew};`;
         } else if (engine === 'sqlite') {
            throw new Error(`Renaming indexes is not supported in SQLite`);
         }
         let executeId = undefined;
         if (typeof window !== "undefined") {
            executeId = ExecuteMeta.set({
               model: this,
               action: "DROP_INDEX",
               modelType: "main",
               args: {}
            });
         }
         await this.xansql.execute(isql, executeId);
      }
   }

   async dropColumn(column: string) {
      if (!(column in this.schema)) {
         throw new Error(`Column ${column} does not exist in table ${this.table}`);
      }

      let sql = `ALTER TABLE ${this.table} DROP COLUMN ${column};`;
      let executeId = undefined;
      if (typeof window !== "undefined") {
         executeId = ExecuteMeta.set({
            model: this,
            action: "DROP_COLUMN",
            modelType: "main",
            args: {}
         });
      }
      await this.xansql.execute(sql, executeId);
      const field = this.schema[column];
      delete this.schema[column];
      const fieldMeta = field.meta || {};

      // drop foreign key if exists
      if (Foreign.isSchema(field)) {
         const fkSql = this.xansql.XansqlMigration.TableMigration.ForeignKeyMigration.buildDrop(this.table, column);
         let executeId = undefined;
         if (typeof window !== "undefined") {
            executeId = ExecuteMeta.set({
               model: this,
               action: "ADD_FOREIGN_KEY",
               modelType: "main",
               args: {}
            });
         }
         await this.xansql.execute(fkSql, executeId);
      }

      // drop index if exists
      if (fieldMeta.index) {
         const indexSql = this.xansql.XansqlMigration.TableMigration.IndexMigration.buildDrop(this.table, column);
         let executeId = undefined;
         if (typeof window !== "undefined") {
            executeId = ExecuteMeta.set({
               model: this,
               action: "CREATE_INDEX",
               modelType: "main",
               args: {}
            });
         }
         await this.xansql.execute(indexSql);
      }
   }

}

export default Model;
