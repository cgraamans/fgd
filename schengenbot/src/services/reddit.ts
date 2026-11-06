// import Snoowrap from 'snoowrap';

export class reddit {

    private static instance:reddit;

    // public client:Snoowrap;

    private token:string | null = null;
    private tokenExpiry:Date | null = null;

    constructor(){

        this.getAccessToken();
        // this.client = require("snoowrap");
        // this.client = new Snoowrap({
        //     userAgent: 'Eurobot',
        //     clientId: process.env.EUROBOT_REDDIT_CLIENT_ID,
        //     clientSecret: process.env.EUROBOT_REDDIT_CLIENT_SECRET,
        //     username: process.env.EUROBOT_REDDIT_USER,
        //     password: process.env.EUROBOT_REDDIT_PASSWORD
        // });

    }

    async getAccessToken() {

        try {
            const tokenResponse = await fetch(`https://www.reddit.com/api/v1/access_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    "User-Agent": "EuroBotClient/16.0 by sn0r",
                    "Authorization": "Basic " + Buffer.from(`${process.env.EUROBOT_REDDIT_CLIENT_ID}:${process.env.EUROBOT_REDDIT_CLIENT_SECRET}`).toString('base64')
                },
                body: new URLSearchParams({
                    grant_type: "client_credentials"
                })
            }).catch((error:any) => {
                console.error("Error fetching Reddit token:", error);
                return null;
            });

            if(!tokenResponse) return null;

            const tokenData = await tokenResponse.json().catch((error) => {
                console.error("Error parsing Reddit token response:", error);
                return null;
            });

            if(!tokenData || !tokenData.access_token) {
                console.error("Invalid token data:", tokenData);
                return null;
            }

            this.token = tokenData.access_token;
            this.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

        } catch(error) {

            console.error("Error in getAccessToken:", error);
            return null;

        }

    }

    async getPostById(id:string) {

        try {

            if(!this.token) {

                if(this.tokenExpiry && this.tokenExpiry <= new Date()) {
                    console.log("Reddit token expired, fetching new token");
                    await this.getAccessToken();
                }

            }

            const postResponse = await fetch(`https://oauth.reddit.com/api/info?id=t3_${id}`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${this.token}`
                }
            }).catch((error:any) => {
                console.error("Error fetching Reddit post:", error);
                return null;
            });

            if(!postResponse) return null;

            const postData = await postResponse.json().catch((error:any) => {
                console.error("Error parsing Reddit post response:", error);
                return null;
            });

            if(!postData || !postData.data || !postData.data.children || postData.data.children.length < 1) {
                console.error("Invalid post data:", postData);
                return null;
            }

            return postData.data.children[0].data;

        } catch(error) {

            console.error("Error in getPostById:", error);
            return null;

        }

    }

    // Service Instance Initialization
    static getInstance() {
        
        if (!reddit.instance) {
            reddit.instance = new reddit();
        }
        return reddit.instance;

    }

}

export default reddit.getInstance();