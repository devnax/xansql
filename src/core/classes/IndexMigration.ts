import { quote } from "../../utils";
import Xansql from "../Xansql";


class IndexMigration {
   xansql: Xansql;
   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   identifier(table: string, column: string) {
      const model = this.xansql.models.get(table);
      const field = model?.schema[column];
      const meta = field?.meta || {};
      return `${table}_${column}${meta.unique ? '_unique_index' : '_index'}`;
   }

   indexes() {
      const models = this.xansql.models;
      let statements: string[] = [];

      for (const model of models.values()) {
         const schema = model?.schema || {};
         for (const column in schema) {
            const field = schema[column];
            const meta = field.meta || {};
            if (meta.index) {
               const indexSql = this.create(model.table, column);
               statements.push(indexSql);
            }
         }
      }

      return statements
   }

   create(table: string, column: string) {
      const engine = this.xansql.config.dialect.engine;
      const model = this.xansql.models.get(table);
      const field = model?.schema[column];
      const meta = field?.meta || {};
      const unique = meta.unique ? 'UNIQUE' : '';
      const indexName = this.identifier(table, column);
      let sql = `CREATE ${unique} INDEX ${indexName} ON ${quote(engine, table)} (${quote(engine, column)});`
      return sql;
   }

   drop(table: string, column: string) {
      const engine = this.xansql.config.dialect.engine;
      const indexName = this.identifier(table, column);
      let sql = '';
      if (engine === 'postgresql' || engine === 'sqlite') {
         sql += `DROP INDEX IF EXISTS ${indexName};`;
      } else {
         sql += `DROP INDEX IF EXISTS ${indexName} ON ${table};`;
      }
      return sql;
   }
}

export default IndexMigration;