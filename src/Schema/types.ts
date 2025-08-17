import Schema from "./Schema"
import XqlAny from "./fields/Any"
import XqlArray from "./fields/Array"
import XqlBoolean from "./fields/Boolean"
import XqlDate from "./fields/Date"
import XqlEnum from "./fields/Enum"
import XqlFile from "./fields/File"
import XqlIDField from "./fields/IDField"
import XqlMap from "./fields/Map"
import XqlNumber from "./fields/Number"
import XqlObject from "./fields/Object"
import XqlRecord from "./fields/Record"
import XqlJoin from "./fields/Join"
import XqlSet from "./fields/Set"
import XqlString from "./fields/String"
import XqlTuple from "./fields/Tuple"
import XqlUnion from "./fields/Union"

export type XqlFields =
   | XqlAny
   | XqlArray
   | XqlBoolean
   | XqlDate
   | XqlEnum
   | XqlFile
   | XqlMap
   | XqlNumber
   | XqlObject
   | XqlRecord
   | XqlSet
   | XqlString
   | XqlTuple
   | XqlUnion

   | XqlIDField
   | XqlJoin



export type XansqlSchemaObject = {
   [key: string]: XqlFields
}