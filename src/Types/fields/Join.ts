import XqlNumber from "./Number";

class XqlJoin extends XqlNumber {
   constructor(readonly table: string, readonly foreginColumn: string) {
      super();
      this.table = table;
      this.foreginColumn = foreginColumn;
      this.integer().index();
   }
}

export default XqlJoin