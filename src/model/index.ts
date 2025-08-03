import { CountArgs, CreateArgs, DeleteArgs, FindArgs, ReturnCount, UpdateArgs } from "./type";
import ModelBase from "./Base";
import youid from "youid";


export default class Model<DATA extends {} = {}> extends ModelBase {
   async excute(sql: string): Promise<any> {
      return await this.xansql.excute(sql, this as any)
   }

   async find(args: FindArgs): Promise<DATA[] | null> {
      const build = await this.buildFind(args, this)
      if (build.type === "main") {
         const data = build.results as DATA[];
         const cache_plugins = await this.xansql.getCachePlugins();
         const key = cache_plugins.length ? youid(JSON.stringify(args)) : ""
         build.cache_key = key;
         for (const plugin of cache_plugins) {
            if (plugin.onCache) {
               const cache_value = await plugin.onCache(build);
               if (cache_value) {
                  return cache_value as DATA[];
               }
            }
         }

         for (const plugin of cache_plugins) {
            if (plugin.onFind) {
               await plugin.onFind(build);
            }
         }
         return data
      }
      return build as any
   }
   async create(args: CreateArgs): Promise<DATA[]> {
      const build = await this.buildCreate(args, this)
      if (build.type === "main") {
         console.log(build);

         return build.results as DATA[];
      }
      return build as any
   }

   async update(args: UpdateArgs): Promise<DATA[] | null> {
      const build = await this.buildUpdate(args, this)
      if (build.type === "main") {
         return build.results as DATA[];
      }
      return build as any
   }
   async delete(args: DeleteArgs) {
      const build = await this.buildDelete(args, this)
      if (build.type === "main") {
         return build.results as DATA[];
      }
      return build as any
   }
   async count(args: CountArgs): Promise<ReturnCount> {
      const build = await this.buildCount(args, this)
      if (build.type === "main") {
         if (build.results && build.results.length) {
            return build.results[0] as ReturnCount;
         }
         return { _count: 0 } as ReturnCount;
      }
      return build as any
   }


   //== Additional Methods == 

   async findOne(args: FindArgs): Promise<DATA | null> {
      const results = await this.find({
         ...args,
         limit: {
            take: 1,
         }
      })
      return results?.length ? results[0] : null
   }

   async upsert(args: UpdateArgs) {
      const results = await this.update(args)
      if (!results?.length) {
         const createArgs: CreateArgs = {
            data: args.data as any,
            select: args.select
         }
         const createResults = await this.create(createArgs)
         return createResults
      }
      return results
   }


   //== Server-Side Methods ==

   async drop() {
      if (typeof window === "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      await this.excute(`DROP TABLE IF EXISTS ${this.table}`);
   }

   async migrate(force = false) {
      if (typeof window === "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      if (force) {
         await this.drop();
      }
      const dialect = await this.xansql.getDialect()
      const sql = dialect.buildSchema(this);
      await this.excute(sql)
   }

   async renameColumn(oldName: string, newName: string) {
      if (typeof window === "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      const dialect = await this.xansql.getDialect()
      return await dialect.renameColumn(this, oldName, newName)
   }

   async addColumn(columnName: string) {
      if (typeof window === "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      const dialect = await this.xansql.getDialect()
      return await dialect.addColumn(this, columnName)
   }

   async dropColumn(columnName: string) {
      if (typeof window === "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      const dialect = await this.xansql.getDialect()
      return await dialect.dropColumn(this, columnName)
   }

   async addIndex(columnName: string) {
      if (typeof window === "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      const dialect = await this.xansql.getDialect()
      return await dialect.addIndex(this, columnName)
   }

   async dropIndex(columnName: string) {
      if (typeof window === "undefined") {
         throw new Error("This method can only be used on the server side.");
      }
      const dialect = await this.xansql.getDialect()
      return await dialect.dropIndex(this, columnName)
   }

}