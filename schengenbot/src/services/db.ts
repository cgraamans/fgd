import mysql from 'mysql2/promise';

export class DB {

    private static instance:DB;

    public connection:mysql.Connection;

    constructor() {
        this.Connect();
    }

    private async Connect() {
        
        this.connection = await mysql.createConnection({
            user:process.env.EUROBOT_DB_USERNAME,
            password:process.env.EUROBOT_DB_PASSWD,
            database:"fgd",
            host:"localhost",
            multipleStatements: true,
            charset:'utf8mb4',
        });

        console.log("Connected to database: " + process.env.CORE_DB);

    }

    static getInstance() {
        
        if (!DB.instance) {
            DB.instance = new DB();
        }
        return DB.instance;

    }

    public where(arr:Array<string>){

        let rtn = "";
        
        for(let i=0;i<arr.length;i++){
            if (i === 0) {
                rtn += "WHERE " + arr[i];
            } else {
                rtn += " AND " + arr[i];
            }
        }
        
        return rtn;

    }

}

export default DB.getInstance();