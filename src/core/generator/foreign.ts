import Xansql from "../Xansql";

class ForeignKeyGenerator {
   xansql: Xansql;
   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   generate() {
      const engine = this.xansql.config.dialect.engine;
      switch (engine) {
         case 'mysql':
            return `CONSTRAINT FOREIGN KEY ({foregin_column}) REFERENCES {main_table}({main_column}) ON DELETE CASCADE ON UPDATE CASCADE`;
         case 'postgresql':
            return `FOREIGN KEY ({foregin_column}) REFERENCES {main_table}({main_column}) ON DELETE CASCADE ON UPDATE CASCADE`;
         case 'sqlite':
            return `FOREIGN KEY ({foregin_column}) REFERENCES {main_table}({main_column}) ON DELETE CASCADE ON UPDATE CASCADE`;
         case 'mssql':
            return `FOREIGN KEY ({foregin_column}) REFERENCES {main_table}({main_column}) ON DELETE CASCADE ON UPDATE CASCADE`;
      }
   }
}

export default ForeignKeyGenerator;