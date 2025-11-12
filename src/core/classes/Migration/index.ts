import XqlFile from "../../../Types/fields/File";
import ExecuteMeta from "../../ExcuteMeta";
import Xansql from "../../Xansql";
import TableMigration from "./TableMigration";

class XansqlMigration {
   xansql: Xansql
   readonly TableMigration: TableMigration
   constructor(xansql: Xansql) {
      this.xansql = xansql;
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
         await xansql.execute(sql, executeId);
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

      return true;
   }
}

export default XansqlMigration;