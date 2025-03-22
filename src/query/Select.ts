import { Dialects } from "../schema/types"


class SelectQuery {
   private dialect: Dialects;
   option = {
      table: '',
      distinct: false,
      columns: '*',
      limit: 0,
      offset: 0,
      orderBy: '',
      groupBy: '',
      having: ''
   }

   constructor(dialect: Dialects) {
      this.dialect = dialect;
   }

   from(table: string): this {
      this.option.table = table;
      return this
   }

   where(table: string, condition: string): string {

   }
}


export default SelectQuery