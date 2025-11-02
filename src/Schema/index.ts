import Foreign from "../core/classes/ForeignInfo";
import { XansqlModelOptions } from "../core/type";
import { XansqlSchemaObject, XqlFields } from "../Types/types";
import RelationExecuteArgs from "./Args/RelationExcuteArgs";
import SchemaBase from "./Base";
import AggregateExecuter from "./Executer/Aggregate";
import CreateExecuter from "./Executer/Create";
import DeleteExecuter from "./Executer/Delete";
import FindExecuter from "./Executer/Find";
import UpdateExecuter from "./Executer/Update";
import { AggregateArgsType, CreateArgsType, DeleteArgsType, FindArgsType, UpdateArgsType, WhereArgsType } from "./type";

class Schema extends SchemaBase {

   options: XansqlModelOptions = {}
   constructor(table: string, schema: XansqlSchemaObject) {
      super(table, schema)
   }

   async create(args: CreateArgsType) {
      const xansql = this.xansql;
      const isRelArgs = args instanceof RelationExecuteArgs
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.beginTransaction()
         if (this.options?.hooks && this.options.hooks.beforeCreate) {
            args = await this.options.hooks.beforeCreate(args) || args
         }
         const executer = new CreateExecuter(this);
         let result = await executer.execute(args);

         if (this.options?.hooks && this.options.hooks.afterCreate) {
            result = await this.options.hooks.afterCreate(result, args) || result
         }
         if (!isRelArgs) await xansql.commitTransaction()
         return result
      } catch (error) {
         if (!isRelArgs) await xansql.rollbackTransaction()
         throw error;
      }
   }

   async update(args: UpdateArgsType) {
      const xansql = this.xansql;
      const isRelArgs = args instanceof RelationExecuteArgs
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.beginTransaction()
         if (this.options?.hooks && this.options.hooks.beforeUpdate) {
            args = await this.options.hooks.beforeUpdate(args) || args
         }
         const executer = new UpdateExecuter(this);
         const result = await executer.execute(args);
         if (this.options?.hooks && this.options.hooks.afterUpdate) {
            return await this.options.hooks.afterUpdate(result, args) || result
         }
         if (!isRelArgs) await xansql.commitTransaction()
         return result
      } catch (error) {
         if (!isRelArgs) await xansql.rollbackTransaction()
         throw error;
      }

   }

   async delete(args: DeleteArgsType) {
      const xansql = this.xansql;
      const isRelArgs = args instanceof RelationExecuteArgs
      if (isRelArgs) args = (args as any).args

      try {
         if (!isRelArgs) await xansql.beginTransaction()
         if (this.options?.hooks && this.options.hooks.beforeDelete) {
            args = await this.options.hooks.beforeDelete(args) || args
         }
         const executer = new DeleteExecuter(this);
         const result = await executer.execute(args);
         if (this.options.hooks && this.options.hooks.afterDelete) {
            return await this.options.hooks.afterDelete(result, args) || result
         }
         if (!isRelArgs) await xansql.commitTransaction()
         return result
      } catch (error) {
         if (!isRelArgs) await xansql.rollbackTransaction()
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
      await this.execute(`TRUNCATE TABLE ${this.table}`);
      await this.clearCache();
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


   // cache methods
   async clearCache() {
      const cachePlugins = await this.xansql.cachePlugins();
      if (this.xansql && cachePlugins.length) {
         for (let plugin of cachePlugins) {
            if (plugin.clear) {
               await plugin.clear(this)
            }
         }
      }
   }


   // end Helpers Methods


   async addIndex(column: string) {
      const engine = this.xansql.config.dialect.engine;
      if (!(column in this.schema)) {
         throw new Error(`Column ${column} does not exist in table ${this.table}`);
      }

      const field = this.schema[column];
      const meta = field?.meta || {};
      if (meta.index) {
         throw new Error(`Column ${column} is already indexed in table ${this.table}`);
      }

      const indexName = this.xansql.Migration.indexIdentifier(this.table, column);
      let sql = ``
      const unique = meta.unique ? `UNIQUE` : ``;
      if (engine === 'mssql') {
         sql += `CREATE ${unique} INDEX ${indexName} ON ${this.table} (${column});`
      } else {
         sql += `CREATE ${unique} INDEX ${indexName} ON ${this.table} (${column});`
      }

      await this.execute(sql);
   }

   async addColumn(column: string, field: XqlFields) {
      const engine = this.xansql.config.dialect.engine;
      let sql = ``;
      if (column in this.schema) {
         throw new Error(`Column ${column} already exists in table ${this.table}`);
      }

      if (engine === 'mssql') {
         sql += `ALTER TABLE ${this.table} ADD ${this.xansql.Migration.buildColumn(column, field)};`
      } else {
         sql += `ALTER TABLE ${this.table} ADD COLUMN ${this.xansql.Migration.buildColumn(column, field)};`
      }

      this.schema[column] = field;
      await this.execute(sql);
   }

   async renameColumn(oldColumn: string, newColumn: string) {
      const engine = this.xansql.config.dialect.engine;
      let sql = ``;
      if (!(oldColumn in this.schema)) {
         throw new Error(`Column ${oldColumn} does not exist in table ${this.table}`);
      }
      if (newColumn in this.schema) {
         throw new Error(`Column ${newColumn} already exists in table ${this.table}`);
      }

      if (engine === 'mssql') {
         sql += `EXEC sp_rename '${this.table}.${oldColumn}', '${newColumn}', 'COLUMN';`
      } else {
         sql += `ALTER TABLE ${this.table} RENAME COLUMN ${oldColumn} TO ${newColumn};`
      }

      const field = this.schema[oldColumn];
      delete this.schema[oldColumn];
      this.schema[newColumn] = field;
      await this.execute(sql);

      // rename foreign key if exists
      if (Foreign.isSchema(field)) {
         const fkOld = this.xansql.Migration.foreignKeyIdentifier(this.table, oldColumn);
         const fkNew = this.xansql.Migration.foreignKeyIdentifier(this.table, newColumn);
         let fsql = ``;
         if (engine === 'mssql') {
            fsql = `EXEC sp_rename '${this.table}.${fkOld}', '${fkNew}', 'OBJECT';`
         } else {
            fsql = `ALTER TABLE ${this.table} RENAME CONSTRAINT ${fkOld} TO ${fkNew};`
         }
         await this.execute(fsql);
      }

      // rename index if exists
      const indexOld = this.xansql.Migration.indexIdentifier(this.table, oldColumn);
      const indexNew = this.xansql.Migration.indexIdentifier(this.table, newColumn);
      let isql = ``;
      if (engine === 'mssql') {
         isql = `IF EXISTS (SELECT name FROM sys.indexes WHERE name = N'${indexOld}') EXEC sp_rename '${this.table}.${indexOld}', '${indexNew}', 'INDEX';`
      } else {
         isql = `ALTER INDEX ${indexOld} RENAME TO ${indexNew};`
      }
      await this.execute(isql);
   }

   async dropColumn(column: string) {
      const engine = this.xansql.config.dialect.engine;
      let sql = `ALTER TABLE ${this.table} DROP COLUMN ${column};`
      if (!(column in this.schema)) {
         throw new Error(`Column ${column} does not exist in table ${this.table}`);
      }

      // check the field is foreign key and drop the foreign key constraint first
      const field = this.schema[column];
      if (Foreign.isSchema(field)) {
         const fk = this.xansql.Migration.foreignKeyIdentifier(this.table, column);
         let asql = `ALTER TABLE ${this.table} DROP FOREIGN KEY ${fk};`;
         await this.execute(asql);
         // delete foreign table schema
         const foreignInfo = Foreign.get(this, column);
         const FM = this.xansql.getModel(foreignInfo.table);
         delete FM.schema[foreignInfo.column];

         // drop index if exists
         const indexName = this.xansql.Migration.indexIdentifier(this.table, column);
         let isql = ``;
         if (engine === 'mssql') {
            isql = `IF EXISTS (SELECT name FROM sys.indexes WHERE name = N'${indexName}') DROP INDEX ${indexName} ON ${this.table};`
         } else if (engine === 'postgresql' || engine === 'sqlite') {
            isql = `DROP INDEX IF EXISTS ${indexName};`
         } else {
            isql = `DROP INDEX IF EXISTS ${indexName} ON ${this.table};`
         }
         await this.execute(isql);
      } else {
         throw new Error("Cannot drop column that is an array of schemas");
      }
      delete this.schema[column];
      await this.execute(sql);
   }

}

export default Schema;
