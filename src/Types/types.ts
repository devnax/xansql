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
import XqlHasMany from "./fields/HasMany"
import XqlHasOne from "./fields/HasOne"
import XqlCreatedAt from "./fields/CreatedAt"
import XqlUpdatedAt from "./fields/UpdatedAt"

export type XqlFields =
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
   | XqlHasMany
   | XqlHasOne
   | XqlCreatedAt
   | XqlUpdatedAt



export type XansqlSchemaObject = {
   [key: string]: XqlFields
}