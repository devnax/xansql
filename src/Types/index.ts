import { XVEnumValues, XVObjectType } from "xanv";
import XqlString from "./fields/String";
import XqlBoolean from "./fields/Boolean";
import XqlArray from "./fields/Array";
import XqlDate from "./fields/Date";
import XqlEnum from "./fields/Enum";
import XqlNumber from "./fields/Number";
import XqlObject from "./fields/Object";
import XqlRecord from "./fields/Record";
import XqlTuple from "./fields/Tuple";
import XqlUnion from "./fields/Union";
import XqlIDField from "./fields/IDField";
import XqlFile from "./fields/File";
import XqlSchema from "./fields/Schema";
import { XqlFields } from "./types";
import sha256 from "../utils/sha256";

export const x = {
   id: () => new XqlIDField(),
   array: (type: XqlFields, length?: number) => new XqlArray(type as any, length),
   boolean: () => new XqlBoolean(),
   date: () => new XqlDate(),
   enum: (values: XVEnumValues) => new XqlEnum(values),
   number: (length?: number) => new XqlNumber(length),
   object: (arg?: XVObjectType) => new XqlObject(arg),
   record: (key: XqlFields, value: XqlFields) => new XqlRecord(key as any, value as any),
   string: (length?: number) => new XqlString(length),
   tuple: (type: XqlFields[]) => new XqlTuple(type as any),
   union: (type: XqlFields[]) => new XqlUnion(type as any),
   file: (size?: number) => new XqlFile(size),
   schema: (table: string, column: string) => new XqlSchema(table, column),

   createdAt: () => x.date().create(),
   updatedAt: () => x.date().update(),
   // Custom Types
   name: () => {
      const inst = x.string().min(1).max(100)
      inst.set("name" as any, (v: any) => {
         const nameRegex = /^[a-zA-Z\s'-]+$/;
         if (!nameRegex.test(v)) {
            throw new Error("Invalid name format.");
         }
      });
      return inst;
   },
   password: () => {
      const inst = x.string().min(8).max(32).index().transform(v => sha256(v).slice(0, 32));
      (inst as any).strong = function () {
         inst.set("strong" as any, (v: any) => {
            const hasUpperCase = /[A-Z]/.test(v);
            const hasLowerCase = /[a-z]/.test(v);
            const hasNumber = /[0-9]/.test(v);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(v);

            if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
               throw new Error('Password should contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            }
         });
         return this;
      }
      return inst;
   },
   email: () => x.string().email(),
   status: (statuses: string[]) => x.enum(statuses).index(),
   gender: () => x.enum(['male', 'female', 'other']).index(),
   role: (roles: string[]) => x.enum(roles).index(),
   username: () => {
      const inst = x.string().index().min(3).max(30).index().unique()
      inst.set("username" as any, (v: any) => {
         const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
         if (!usernameRegex.test(v)) {
            throw new Error("Invalid username format.");
         }
      });
      return inst;
   },
   slug: () => {
      const inst = x.string().index().min(3).max(100)
      inst.set("slug" as any, (v: any) => {
         const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
         if (!slugRegex.test(v)) {
            throw new Error("Invalid slug format.");
         }
      });
      return inst;
   },
   url: () => {
      const inst = x.string().max(2048).min(10)
      inst.set("url" as any, (v: any) => {
         try {
            new URL(v);
         } catch {
            throw new Error("Invalid URL format.");
         }
      });
      return inst;
   },
   photo: () => {
      const inst = x.file(2 * 1024 * 1024); // 2 MB
      inst.set("photo" as any, (v: any) => {
         const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
         if (!allowedTypes.includes(v.mimetype)) {
            throw new Error("Invalid photo file type.");
         }
      });
      return inst;
   },
   avatar: () => {
      const inst = x.file(1 * 1024 * 1024); // 1 MB
      inst.set("avatar" as any, (v: any) => {
         const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
         if (!allowedTypes.includes(v.mimetype)) {
            throw new Error("Invalid avatar file type.");
         }
      });
      return inst;
   },
   amount: () => x.number().float().min(0).max(1000000000),
   phone: () => {
      const inst = x.string().min(7).max(15)
      inst.set("phone" as any, (v: any) => {
         const phoneRegex = /^\+?[1-9]\d{1,14}$/;
         if (!phoneRegex.test(v)) {
            throw new Error("Invalid phone number format.");
         }
      });
      return inst;
   },
   title: () => x.string().min(1).max(200),
   description: () => x.string().max(1000),
   type: (types: string[]) => x.enum(types).index(),
   metadata: () => x.record(x.string(), x.union([x.string(), x.number(), x.boolean(), x.date()])),
   ip: () => {
      const inst = x.string().index()
      inst.set("ip" as any, (v: any) => {
         const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
         const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]|)[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]|)[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]|)[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]|)[0-9]))$/;
         if (!ipv4Regex.test(v) && !ipv6Regex.test(v)) {
            throw new Error("Invalid IP address format.");
         }
      });
      return inst;
   },

   key: () => x.string().max(100).index().unique(),
   value: () => x.string().max(1000),
   token: () => x.string(64).index().unique(),
}

export default x;