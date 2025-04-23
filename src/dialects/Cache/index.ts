import { isServer } from "../../utils";
import SqliteDialect from "../Sqlite";

class CacheDialect extends SqliteDialect {
   driver: any = "cache"
   async excute(sql: any) {
      const xanconfig = this.xansql.config
      if (isServer) {
         return await super.excute(sql);
      } else {

      }
   }

}

export default CacheDialect