
class MysqlSchema {

   tableName: string;
   constructor(tableName: string) {
      this.tableName = tableName;
   }

   schema() {
      return `
         CREATE TABLE IF NOT EXISTS \`schema\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`name\` VARCHAR(255) NOT NULL,
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         );
      `;
   }

   sql() {
      return `
         CREATE TABLE IF NOT EXISTS \`sql\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`query\` TEXT NOT NULL,
            \`params\` JSON DEFAULT NULL,
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         );
      `;
   }

   createTable(tableName: string, columns: string[]): string {
      return `CREATE TABLE ${tableName} (${columns.join(", ")});`;
   }

   dropTable(tableName: string): string {
      return `DROP TABLE ${tableName};`;
   }

}