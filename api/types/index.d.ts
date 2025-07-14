import { RowDataPacket } from 'mysql2';

export namespace T {
    
    export interface Item extends RowDataPacket {

        id: number;
        message_id: string;
        user: string;
        category_id: number;
        content: string;
        dt:number;
        urls?: string[]
        category?: ItemCategory;
    
    }

    export interface ItemCategory extends RowDataPacket {
    
        id: number;
        name: string;
        channel_id: string;
    
    }

    export interface getItemOptions {
    
        id?: number;
        from?:number;
        user?:string;
        category?:number;
        limit:number;
    
    }

}