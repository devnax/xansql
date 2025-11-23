import XqlFile from "../../../Types/fields/File";
import ExecuteMeta from "../../ExcuteMeta";
import Xansql from "../../Xansql";
import TableMigration from "./TableMigration";
import Foreign from "../ForeignInfo";
import { XansqlDialectSchemaType } from "../../type";
import { quote } from "../../../utils";
import XqlIDField from "../../../Types/fields/IDField";

class XansqlMigration {
   readonly xansql: Xansql
   readonly TableMigration: TableMigration

   constructor(xansql: Xansql) {
      this.xansql = xansql;
      this.TableMigration = new TableMigration(xansql);
   }

   async migrate(force?: boolean) {
      const xansql = this.xansql;
      const engine = xansql.config.dialect.engine;
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

      if (!force) {
         const raw_schema: XansqlDialectSchemaType = await xansql.getRawSchema() as any

         for (let { table } of tables) {
            const model = xansql.getModel(table);
            const model_columns = model.schema;
            const raw_columns = raw_schema[table] || [];

            for (let column in model_columns) {
               if (model_columns[column] instanceof XqlIDField) continue;
               const has_column = raw_columns.find((rc: any) => rc.name === column);
               if (!has_column && !Foreign.isArray(model_columns[column])) {
                  let executeId = undefined;
                  if (typeof window !== "undefined") {
                     executeId = ExecuteMeta.set({
                        model,
                        action: "ADD_COLUMN",
                        modelType: "main",
                        args: { column }
                     });
                  }

                  const buildColumn = this.TableMigration.buildColumn(table, column);
                  const sql = `ALTER TABLE ${quote(engine, table)} ADD COLUMN ${buildColumn};`;
                  await xansql.execute(sql, executeId);
               }
            }

            for (let rc of raw_columns) {
               if (!(rc.name in model_columns)) {
                  let executeId = undefined;
                  if (typeof window !== "undefined") {
                     executeId = ExecuteMeta.set({
                        model,
                        action: "DROP_COLUMN",
                        modelType: "main",
                        args: { column: rc.name }
                     });
                  }

                  const sql = `ALTER TABLE ${quote(engine, table)} DROP COLUMN ${quote(engine, rc.name)};`;
                  await xansql.execute(sql, executeId);
               }
            }

            for (let column in model_columns) {
               if (model_columns[column] instanceof XqlIDField || Foreign.isArray(model_columns[column])) continue;

               const has_column = raw_columns.find((rc: any) => rc.name === column);
               if (has_column) {
                  const buildColumnSql = this.TableMigration.buildColumn(table, column).split(' ').slice(1).join(' ');
                  const raw_column_sql = `${has_column.type.toUpperCase()} ${has_column.notnull ? 'NOT NULL' : 'NULL'}${has_column.default_value ? ' DEFAULT ' + has_column.default_value : ''}${has_column.unique ? " UNIQUE" : ""}`.trim();
                  if (buildColumnSql !== raw_column_sql) {
                     let executeId = undefined;
                     if (typeof window !== "undefined") {
                        executeId = ExecuteMeta.set({
                           model,
                           action: "MODIFY_COLUMN",
                           modelType: "main",
                           args: { column }
                        });
                     }

                     const buildColumn = this.TableMigration.buildColumn(table, column);
                     const sql = `ALTER TABLE ${quote(engine, table)} ALTER COLUMN ${buildColumn};`;
                     await xansql.execute(sql, executeId);
                  }
               }
            }
         }
      }

      return true;
   }

   async generate() {
      const xansql = this.xansql;
      const models = Array.from(xansql.ModelFactory.values());
      const raw_schema: XansqlDialectSchemaType = await xansql.getRawSchema() as any
      const tables = Object.keys(raw_schema);
      const migration_sql: string[] = [];

      for (let model of models) {
         if (!tables.includes(model.table)) {
            const { sql } = this.TableMigration.buildCreate(model);
            migration_sql.push(sql);
         } else {
            const model_columns = model.schema;
            const raw_columns = raw_schema[model.table] || [];

            for (let column in model_columns) {
               if (model_columns[column] instanceof XqlIDField) continue;
               const has_column = raw_columns.find((rc: any) => rc.name === column);
               if (!has_column && !Foreign.isArray(model_columns[column])) {
                  const buildColumn = this.TableMigration.buildColumn(model.table, column);
                  const sql = `ALTER TABLE ${quote(xansql.config.dialect.engine, model.table)} ADD COLUMN ${buildColumn};`;
                  migration_sql.push(sql);
               }
            }

            for (let rc of raw_columns) {
               if (!(rc.name in model_columns)) {
                  const sql = `ALTER TABLE ${quote(xansql.config.dialect.engine, model.table)} DROP COLUMN ${quote(xansql.config.dialect.engine, rc.name)};`;
                  migration_sql.push(sql);
               }
            }

            for (let column in model_columns) {
               if (model_columns[column] instanceof XqlIDField || Foreign.isArray(model_columns[column])) continue;

               const has_column = raw_columns.find((rc: any) => rc.name === column);
               if (has_column) {
                  const buildColumnSql = this.TableMigration.buildColumn(model.table, column).split(' ').slice(1).join(' ');
                  const raw_column_sql = `${has_column.type.toUpperCase()} ${has_column.notnull ? 'NOT NULL' : 'NULL'}${has_column.default_value ? ' DEFAULT ' + has_column.default_value : ''}${has_column.unique ? " UNIQUE" : ""}`.trim();
                  if (buildColumnSql !== raw_column_sql) {
                     const buildColumn = this.TableMigration.buildColumn(model.table, column);
                     const sql = `ALTER TABLE ${quote(xansql.config.dialect.engine, model.table)} ALTER COLUMN ${buildColumn};`;
                     migration_sql.push(sql);
                  }
               }
            }
         }
      }

      return migration_sql;

   }
}

export default XansqlMigration;