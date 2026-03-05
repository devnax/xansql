import XqlFile from "../../xt/fields/File";
import Xansql from "../Xansql";
import { iof } from "../../utils";

class XansqlMigration {
   readonly xansql: Xansql

   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   async migrate(force?: boolean) {
      const xansql = this.xansql;
      const engine = xansql.dialect.engine;
      if (force) {
         await this.deleteFiles();
         await this.dropAll();

         if (engine === 'sqlite') {
            await xansql.execute(`PRAGMA foreign_keys = ON;`);
            await xansql.execute(`PRAGMA journal_mode = WAL;`);
            await xansql.execute(`PRAGMA wal_autocheckpoint = 1000;`);
            await xansql.execute(`PRAGMA synchronous = NORMAL;`);
         } else if (engine === 'postgresql') {
            await xansql.execute(`SET client_min_messages TO WARNING;`);
            await xansql.execute(`SET standard_conforming_strings = ON;`);
         } else if (engine === 'mysql') {
            await xansql.execute(`SET sql_mode = 'STRICT_ALL_TABLES';`);
            await xansql.execute(`SET FOREIGN_KEY_CHECKS = 1;`);
            await xansql.execute(`SET sql_safe_updates = 1;`);
         }
      }

      for (let model of xansql.models.values()) {
         const migrations = model.migrations.up()
         await model.execute(migrations.table)
      }

      for (let model of xansql.models.values()) {
         const migrations = model.migrations.up()
         // create all indexes
         for (let index in migrations.indexes) {
            try {
               await xansql.execute(migrations.indexes[index]);
            } catch (error) { }
         }

         // create all fks
         for (let fk in migrations.foreign_keys) {
            try {
               await xansql.execute(migrations.foreign_keys[fk]);
            } catch (error) { }
         }
      }
   }

   async deleteFiles() {
      const xansql = this.xansql;
      const dialect = xansql.config.dialect;
      const models = Array.from(xansql.models.values()).reverse();

      if (dialect.file && typeof dialect.file.delete === "function") {
         let is = dialect.file.deleteFileOnMigration ?? true;
         if (is) {
            for (let model of models) {
               const fileWhere: any[] = [];
               for (let column in model.schema) {
                  const field = model.schema[column];
                  if (iof(field, XqlFile)) {
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
         }
      }
   }

   async dropAll() {
      const xansql = this.xansql;
      const models = Array.from(xansql.models.values()).reverse();

      for (let model of models) {
         const migrations = model.migrations.down()
         for (let index in migrations.indexes) {
            try {
               await xansql.execute(migrations.indexes[index]);
            } catch (error) { }
         }

         // remove all fks
         for (let fk in migrations.foreign_keys) {
            try {
               await xansql.execute(migrations.foreign_keys[fk]);
            } catch (error) { }
         }

         // remove all types
         for (let type in migrations.types) {
            try {
               await xansql.execute(migrations.types[type]);
            } catch (error) {

            }
         }
      }

      for (let model of models) {
         try {
            await model.drop()
         } catch (error) { }
      }
   }
}

export default XansqlMigration;