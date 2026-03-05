
import XqlArray from "./fields/Array"
import XqlBoolean from "./fields/Boolean"
import XqlDate from "./fields/Date"
import XqlEnum from "./fields/Enum"
import XqlFile from "./fields/File"
import XqlIDField from "./fields/IDField"
import XqlNumber from "./fields/Number"
import XqlObject from "./fields/Object"
import XqlRecord from "./fields/Record"
import XqlRelationMany from "./fields/RelationMany"
import XqlRelationOne from "./fields/RelationOne"
import XqlString from "./fields/String"
import XqlTuple from "./fields/Tuple"
import XqlUnion from "./fields/Union"

export type XqlField =
   | XqlArray<any>
   | XqlBoolean
   | XqlDate
   | XqlEnum<any>
   | XqlFile
   | XqlIDField
   | XqlNumber
   | XqlObject<any>
   | XqlRecord<any, any>
   | XqlRelationMany<any>
   | XqlRelationOne<any>
   | XqlString
   | XqlTuple
   | XqlUnion


// export type XqlSchemaShape = Record<string, any>;
// export type XT = typeof xt

