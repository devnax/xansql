import SchemaBase from "./Base";
import BuildWhere from "./Query/BuildWhere";
import { FindArgs } from "./type";

class Schema extends SchemaBase {

   find(args: FindArgs) {
      BuildWhere(args.where, this);
   }
}

export default Schema;
