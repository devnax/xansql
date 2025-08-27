import Schema from "..";
import BuildLimit from "../Query/BuildLimit";
import BuildOrderby from "../Query/BuildOrderby";
import BuildSelect, { BuildSelectJoinInfo } from "../Query/BuildSelect";
import BuildWhere from "../Query/BuildWhere";
import { UpdateArgs } from "../type";

class UpdateResult {
   constructor(readonly schema: Schema) {
   }

   async result(args: UpdateArgs) {

   }

   private async excuteJoin(column: string, join: BuildSelectJoinInfo, ids: any[]) {

   }
}

export default UpdateResult;