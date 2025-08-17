class Relation {
   table: string | null;
   column: string;

   constructor(column: string, foreginTable?: string) {
      this.column = column;
      this.table = foreginTable || null;
   }
}

export default Relation;