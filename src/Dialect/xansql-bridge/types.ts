import { ListenerInfo, SecurequServerConfig } from "securequ";
import Model from "../../model";

export type XansqlBridgeAuthorizedInfo = {
   method: "GET" | "POST" | "PUT" | "DELETE";
   model: Model | null;
   action: string;
}

export type XansqlBridgeInfo = {
   body: any;
   headers: { [key: string]: string };
}

export type XansqlBridgeResponse = {
   status: number;
   body: any;
   headers?: { [key: string]: string };
};

export type XansqlBridgeServerConfig = {
   basePath: string;
   model?: "production" | "development";
   isAuthorized?: (info: XansqlBridgeAuthorizedInfo) => Promise<boolean>;
   file?: SecurequServerConfig["file"];
};

export type ListenOptions = ListenerInfo