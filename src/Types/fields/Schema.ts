import XqlNumber from "./Number";

class XqlSchema extends XqlNumber {
   constructor(readonly table: string, readonly column: string) {
      super();
      this.table = table;
      this.column = column;
      this.integer().index();
   }
}

export default XqlSchema