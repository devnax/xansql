import { quote } from "../../utils";
import Foreign from "../classes/ForeignInfo";
import Xansql from "../Xansql";


class ForeignKeyMigration {
   xansql: Xansql;

   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   identifier(table: string, column: string) {
      return `fk_${table}_${column}`;
   }

   foreigns() {
      const models = this.xansql.models;
      let statements: string[] = [];

      for (const model of models.values()) {
         const schema = model?.schema || {};
         for (const column in schema) {
            const field = schema[column];
            if (Foreign.isSchema(field)) {
               const fkSql = this.create(model.table, column);
               statements.push(fkSql);
            }
         }
      }

      return statements;
   }

   create(table: string, column: string) {
      const engine = this.xansql.config.dialect.engine;
      const model = this.xansql.models.get(table);
      const schema = model?.schema || {};
      const field = schema[column];
      const meta = field.meta || {};

      let sql = '';
      if (Foreign.isSchema(field)) {
         const isOptional = meta.nullable || meta.optional;
         const info = Foreign.get(model!, column)
         const fk = this.identifier(info.table, column);

         sql = `CONSTRAINT ${fk} FOREIGN KEY (${quote(engine, column)}) REFERENCES ${quote(engine, info.table)}(${quote(engine, info.relation.main)})`;
         if (isOptional) {
            sql += ` ON DELETE SET NULL ON UPDATE CASCADE`;
         } else {
            sql += ` ON DELETE CASCADE ON UPDATE CASCADE`;
         }
      }

      return sql;
   }

   drop(table: string, column: string) {
      const engine = this.xansql.config.dialect.engine;
      const fkName = this.identifier(table, column);
      let sql = '';
      if (engine === 'postgresql' || engine === 'sqlite') {
         sql += `ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${fkName};`;
      } else {
         sql += `ALTER TABLE ${table} DROP FOREIGN KEY IF EXISTS ${fkName};`;
      }
      return sql;
   }
}

export default ForeignKeyMigration;