
class Relation {
   table: string | null;
   column: string;

   constructor(table_or_column: string, column?: string) {
      if (column) {
         this.column = column;
         this.table = table_or_column;
      } else {
         this.table = null;
         this.column = table_or_column;
      }
   }
}

export default Relation;