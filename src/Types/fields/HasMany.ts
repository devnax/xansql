import XqlNumber from "./Number";

class XqlHasMany extends XqlNumber {
   readonly table: string;
   readonly column: string;
   constructor(table: string, column: string) {
      super();
      this.table = table;
      this.column = column;
      this.integer().index();
   }
}

export default XqlHasMany