import XqlArray from "./fields/Array"
import XqlBoolean from "./fields/Boolean"
import XqlDate from "./fields/Date"
import XqlEnum from "./fields/Enum"
import XqlFile from "./fields/File"
import XqlIDField from "./fields/IDField"
import XqlNumber from "./fields/Number"
import XqlObject from "./fields/Object"
import XqlRecord from "./fields/Record"
import XqlString from "./fields/String"
import XqlTuple from "./fields/Tuple"
import XqlUnion from "./fields/Union"
import XqlSchema from "./fields/Schema"

export type XqlFields =
   | XqlArray
   | XqlBoolean
   | XqlDate
   | XqlEnum
   | XqlFile
   | XqlNumber
   | XqlObject
   | XqlRecord
   | XqlString
   | XqlTuple
   | XqlUnion
   | XqlSchema
   | XqlIDField

export type XansqlSchemaObject = {
   [key: string]: XqlFields
}