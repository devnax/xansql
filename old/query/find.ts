import xansql from "..";

const Samplefind = {
   take: 10,
   skip: 0,
   orderBy: {
      id: "asc",
      name: "desc"
   },
   where: {
      id: 1,
      age: {
         lt: 30,
         gt: 20,
         lte: 30,
         gte: 20,
         equals: 25,
         not: 25,
         in: [20, 25, 30],
         notIn: [20, 25, 30],
         between: [20, 30],
         notBetween: [20, 30],
         //... other operators
      },
      name: {
         contains: "John Doe",
         startsWith: "John",
         endsWith: "Doe",
         equals: "John Doe",
         in: ["John Doe", "Jane Doe"],
         notIn: ["John Doe", "Jane Doe"],
         not: "John Doe",
         notContains: "John Doe",
         notStartsWith: "John",
         notEndsWith: "Doe",
         is: "John Doe",
         isNot: "John Doe",
         isNull: true,
         isNotNull: true,
         isEmpty: true,
         isNotEmpty: true,
         isTrue: true,
         isFalse: true,
      },
      create_at: {
         equals: "2023-01-01",
         not: "2023-01-01",
         in: ["2023-01-01", "2023-02-01"],
         notIn: ["2023-01-01", "2023-02-01"],
         between: ["2023-01-01", "2023-12-31"],
         notBetween: ["2023-01-01", "2023-12-31"],
         isNull: true,
         isNotNull: true,
         isEmpty: true,
         isNotEmpty: true,
         isTrue: true,
         isFalse: true,
         before: "2023-01-01",
         after: "2023-01-01",
         beforeOrEqual: "2023-01-01",
         afterOrEqual: "2023-01-01",
         isToday: true,
         isTomorrow: true,
      }
   },
   select: {
      id: true,
      name: true,
      age: true,
   }
}


const find = async (args: any, xansql: xansql) => {
   const { table, where, limit, offset } = args;
   const query = `SELECT * FROM ${table} WHERE ${where} LIMIT ${limit} OFFSET ${offset}`;

}