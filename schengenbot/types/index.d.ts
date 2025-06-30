import { Collection } from "discord.js";
import { RowDataPacket } from "mysql2";

declare module '*';

declare module "discord.js" {
    export interface Client {
      commands: Collection<any, any>
    }
}

export namespace T {
  
  interface itemId extends RowDataPacket {
    id: number
  }

}