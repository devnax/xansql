import xt from "../../../Types";
import Model from "../../../model";
import XqlFile from "../../../Types/fields/File";
import ExecuteMeta from "../../ExcuteMeta";
import Xansql from "../../Xansql";
import TableMigration from "./TableMigration";

class XansqlMigration {
   readonly xansql: Xansql
   readonly MigrateModel: Model
   readonly TableMigration: TableMigration
   private migration_table = "migrations"
   constructor(xansql: Xansql) {
      this.xansql = xansql;
      this.MigrateModel = xansql.model(this.migration_table, {
         id: xt.id(),
         info: xt.object(),
         createdAt: xt.createdAt(),
      });
      this.TableMigration = new TableMigration(xansql);
   }

   async migrate(force?: boolean) {
      const xansql = this.xansql;
      const { options, tables, indexes } = this.TableMigration.statements();
      if (force) {
         const models = Array.from(xansql.ModelFactory.values()).reverse();

         for (let model of models) {
            const fileWhere: any[] = [];
            for (let column in model.schema) {
               const field = model.schema[column];
               if (field instanceof XqlFile) {
                  fileWhere.push({ [column]: { isNotNull: true } });
               }
            }

            if (Object.keys(fileWhere).length > 0) {
               try {
                  await model.delete({
                     where: fileWhere,
                     select: { [model.IDColumn]: true }
                  });
               } catch (error) { }
            }
         }

         for (let model of models) {
            const dsql = this.TableMigration.buildDrop(model);
            let executeId = undefined;
            if (typeof window !== "undefined") {
               executeId = ExecuteMeta.set({
                  model,
                  action: "DROP_TABLE",
                  modelType: "main",
                  args: {}
               });
            }
            await xansql.execute(dsql, executeId);
         }
      }

      for (let option of options) {
         await xansql.dialect.execute(option);
      }

      let migrationMeta: {
         [table: string]: {
            [column: string]: { [key: string]: any }
         }
      } = {};

      for (let { table, sql } of tables) {
         let executeId = undefined;
         if (typeof window !== "undefined") {
            executeId = ExecuteMeta.set({
               model: xansql.getModel(table),
               action: "CREATE_TABLE",
               modelType: "main",
               args: {}
            });
         }

         await xansql.EventManager.emit("BEFORE_MIGRATE", { info: { table, sql } });
         await xansql.execute(sql, executeId);
         await xansql.EventManager.emit("MIGRATE", { info: { table, sql } });

         if (!force && table !== this.migration_table) {
            const model = xansql.getModel(table);
            migrationMeta[table] = {}

            for (let column in model.schema) {
               const field = model.schema[column];
               migrationMeta[table][column] = field.meta || {}
            }
         }
      }

      for (let { sql, table } of indexes) {
         try {
            let executeId = undefined;
            if (typeof window !== "undefined") {
               executeId = ExecuteMeta.set({
                  model: xansql.getModel(table),
                  action: "CREATE_INDEX",
                  modelType: "main",
                  args: {}
               });
            }
            await xansql.execute(sql, executeId);
         } catch (error) { }
      }

      if (!force) {
         const lastMigration = await this.MigrateModel.findOne({
            select: { info: true },
            orderBy: { id: "desc" }
         });

         console.log(lastMigration);
         await this.MigrateModel.create({
            data: {
               info: migrationMeta
            }
         });
      }

      return true;
   }
}

export default XansqlMigration;