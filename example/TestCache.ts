import xansql from "../src";

const TestCache = (xansql: xansql) => {
   const models = new Map<string, any>();
   return {
      onCache: async ({ sql, model }: any) => {
         if (!models.has(model.table)) {
            models.set(model.table, new Map());
         }
         const data = models.get(model.table);
         if (data.has(sql)) {
            // return data.get(sql);
         }
      },

      onFind: async (info: any) => {
         const { sql, result, model } = info;
         if (!models.has(model.table)) {
            models.set(model.table, new Map());
         }
         const data = models.get(model.table);
         data.set(sql, result);
         return result;
      },
      onCreate: async ({ model }) => {
         if (!models.has(model.table)) {
            models.set(model.table, new Map());
         }
         const tableData = models.get(model.table);
         tableData.clear();
      },
      onUpdate: async ({ model }) => {
         if (!models.has(model.table)) {
            models.set(model.table, new Map());
         }
         const tableData = models.get(model.table);
         tableData.clear();
      },

      // onDelete: (key: string) => {
      //    console.log("onFelete", key);
      // },
      // onDestroy: () => {
      //    console.log("onDestroy");
      // }
   }
}

export default TestCache;