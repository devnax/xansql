import Model from "../model";
import { uid } from "../utils";

export type ExecuteMetaAction =
   | "SELECT"
   | "INSERT"
   | "UPDATE"
   | "DELETE"
   | "AGGREGATE"
   | "CREATE_TABLE"
   | "DROP_TABLE"
   | "DROP_COLUMN"
   | "ADD_COLUMN"
   | "RENAME_COLUMN"
   | "CREATE_INDEX"
   | "DROP_INDEX"
   | "DROP_FOREIGN_KEY"
   | "ADD_FOREIGN_KEY"
   | "UPLOAD_FILE"
   | "DELETE_FILE"


export type ExecuteMetaData = {
   model: Model;
   action: ExecuteMetaAction;
   modelType: "main" | "child";
   args: any;
}

const metas = new Map<string, ExecuteMetaData>();

class ExecuteMeta {
   static set(meta: ExecuteMetaData) {
      if (typeof window !== "undefined") {
         const executeId = uid(Math.random().toString() + Date.now().toString());
         metas.set(executeId, meta);
         return executeId
      }
   }
   static get(executeId: string): ExecuteMetaData | undefined {
      return metas.get(executeId);
   }
   static delete(executeId: string) {
      metas.delete(executeId);
   }
   static has(executeId: string) {
      return metas.has(executeId);
   }
   static clear() {
      metas.clear();
   }
}

export default ExecuteMeta;