import { RowDataPacket } from 'mysql2';
import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
      user: T.User
    }
  }
}

export namespace T {

    export interface User extends RowDataPacket {
        id: number;
        username: string;
        password: string;
        roles?: Role[];
    }
    
    export interface Role extends RowDataPacket {
        id: number;
        name: string;
    }

    export interface Item extends RowDataPacket {

        id: number;
        message_id: string;
        reply_to: string|null;
        user: string;
        category_id: number;
        content: string;
        dt:number;

        links?: ItemLink[]
        category?: ItemCategory;
        reply?: Item;

    }

    export interface ItemCategory extends RowDataPacket {
    
        id: number;
        name: string;
        channel_id: string;
    
    }

    export interface ItemLink extends RowDataPacket {

        id: number;
        item_id: number;
        url: string
        metadata?: ItemMetadata;
    
    }

    export interface ItemMetadata extends RowDataPacket {
        link_id: number;
        title: string;
        description: string;
        image: string;
        video: string;
    }

    export interface getItemOptions {
    
        id?: number;
        message_id?: string;
        from?:number;
        user?:string;
        category?:number;
        limit?:number;
        dir?: 'asc' | 'desc';

    }

}