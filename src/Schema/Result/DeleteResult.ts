import Schema from "..";
import BuildLimit from "../Query/BuildLimit";
import BuildOrderby from "../Query/BuildOrderby";
import BuildSelect, { BuildSelectJoinInfo } from "../Query/BuildSelect";
import BuildWhere from "../Query/BuildWhere";
import { DeleteArgs } from "../type";

class DeleteResult {
   constructor(readonly schema: Schema) {
   }

   async result(args: DeleteArgs) {

   }

   private async excuteJoin(column: string, join: BuildSelectJoinInfo, ids: any[]) {

   }
}

export default DeleteResult;