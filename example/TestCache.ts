import xansql from "../src";
import Model from "../src/model";


const TestCache = (xansql: xansql) => {

   return {
      onCache: async (info: any) => {
         // console.log("Cache hit for:", info.sql);

         // return [{ id: 1, name: "Test User" }];
      },

      onFind: async (info: any) => {
      },

      onDestroy: async (info: any) => {
         // console.log("Cache destroyed for:", info.model.table);
      },

      // onCreate: async (data: any, model: Model) => {
      //    console.log("onCreate", data, model);
      //    return data;
      // },
      // onUpdate: async (data: any, where: any) => {
      //    console.log("onUpdate", data, where);
      //    return { data, where };
      // },

      // onDelete: (key: string) => {
      //    console.log("onFelete", key);
      // },
      // onDestroy: () => {
      //    console.log("onDestroy");
      // }
   }
}

export default TestCache;