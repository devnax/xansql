import { quote } from "../../../utils";
import Foreign from "../ForeignInfo";
import Xansql from "../../Xansql";


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
               const fkSql = this.buildCreate(model.table, column);
               statements.push(fkSql);
            }
         }
      }

      return statements;
   }

   buildCreate(table: string, column: string, refTable: string = '', refColumn: string = '') {
      const engine = this.xansql.config.dialect.engine;
      const model = this.xansql.models.get(table);
      const schema = model?.schema || {};
      const field = schema[column];
      const meta = field.meta || {};
      const isOptional = meta.nullable || meta.optional;
      const fk = this.identifier(table, column);

      let sql = `ALTER TABLE ${table} ADD CONSTRAINT ${fk} FOREIGN KEY (${quote(engine, column)}) REFERENCES ${quote(engine, refTable)}(${quote(engine, refColumn)})`;
      if (isOptional) {
         sql += ` ON DELETE SET NULL ON UPDATE CASCADE`;
      } else {
         sql += ` ON DELETE CASCADE ON UPDATE CASCADE`;
      }

      return sql;
   }

   buildDrop(table: string, column: string) {
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