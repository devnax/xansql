import Schema from "../../Schema";
import { quote } from "../../utils";
import Foreign from "../classes/ForeignInfo";
import Xansql from "../Xansql";

class ForeignKeyGenerator {
   xansql: Xansql;
   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   generate() {
      const engine = this.xansql.config.dialect.engine;
      const models = this.xansql.models;
      const tables = models.keys();
      const sqlStatements: string[] = [];

      for (const table of tables) {
         const model = models.get(table) as Schema
         const schema = model?.schema || {};

         for (let column in schema) {
            const field = schema[column];
            const meta = field?.meta || {};
            if (Foreign.isSchema(field)) {
               const foreignInfo = Foreign.get(model, column);
               if (foreignInfo) {
                  const foreignTable = foreignInfo.table;
                  const foreignColumn = foreignInfo.relation.main;
                  const constraintName = `fk_${table}_${column}_to_${foreignTable}_${foreignColumn}`
                  let sql = ''
                  sql = `ALTER TABLE ${table} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${column}) REFERENCES ${foreignTable}(${foreignColumn})`;

                  if (meta.onDelete) {
                     sql += ` ON DELETE ${meta.onDelete.toUpperCase()}`;
                  }
                  if (meta.onUpdate) {
                     sql += ` ON UPDATE ${meta.onUpdate.toUpperCase()}`;
                  }
                  sql += ';';
                  sqlStatements.push(sql);
               }
            }
         }
      }
      return sqlStatements;
   }
}

export default ForeignKeyGenerator;