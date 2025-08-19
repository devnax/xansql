import XqlNumber from "./Number";

class XqlJoin extends XqlNumber {
   constructor(readonly table: string) {
      super();
      this.table = table;
      this.integer().index();
   }
}

export default XqlJoin