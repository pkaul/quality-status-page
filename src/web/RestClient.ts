import {Response} from "rest";
import {Client} from "rest";
import rest = require("rest");
import basicAuth = require("rest/interceptor/basicAuth");
import defaultRequest = require("rest/interceptor/defaultRequest");
import {Request} from "rest";
export class RestClient {

    protected _baseUrl:string;
    protected _userName:string;
    protected _password:string;

    constructor(baseUrl:string, userName:string, password:string) {
        this._baseUrl = baseUrl;
        this._userName = userName;
        this._password = password;
    }


    protected request(url:string):Promise<any> {

        let client: Client = rest.getDefaultClient();

        // if configured: send credentials via basic authorization
        if(!!this._userName && !!this._password ) {
            client = client.wrap(basicAuth, {username: this._userName, password: this._password});
        }


        client = client.wrap(defaultRequest, {
            "method":   "GET",
            "path":     url,
            // enabling sending existing authentication cookie via CORS
            "mixin":    {"withCredentials": true},
        });

        const request: Request = {
            // "method": "GET",
            // "path": url
        };


        return new Promise<any>((resolve:(r:any)=>void, reject:(reason:any) => void) => {

            client(request).then((response: Response) => {

                //console.info("Received " + JSON.stringify(response)+" from "+url);

                if (response.status.code === 200 && !!response.entity) {

                    let jsonEntity: Object = JSON.parse(response.entity);
                    // JenkinsClient.correctTimestamp(jsonEntity, response);
                    resolve(jsonEntity);
                }
                else {
                    reject(this.getErrorMessage(url, response));
                }
            }).catch((errorResponse: Object) => {

                reject(this.getErrorMessage(url, errorResponse));
            });
        });
    }

    protected getErrorMessage(url:string, response:Object):string {

        console.info("Error loading " + url +" ("+(response ? ": "+JSON.stringify(response): "")+")");

        if( !!response ) {

            if( response['error'] ) {
                return response['error'];
            }
            else if( !!response['status'] && !!response['status']['code'] ) {

                let code:number = response['status']['code'];
                let text:string = response['status']['text'];
                if( code == 404 ) {

                    text += "Not found or not authenticated / authorized."
                }

                let result:string = "Unexpected HTTP status "+code+": ("+text+") while loading "+url+". Check JavaScript console and/or web traffic.";

                return result;

            }
            else {
                return "Unknown error while loading "+url+". Check JavaScript console and/or web traffic.";
            }
        }
        else {
            return "Unknown error while loading "+url+". Check JavaScript console and/or web traffic.";
        }
    }


    /**
     * Correct timestamp property from Jenkins entity based on server "Date".
     * TODO: requires "Date" to be allowed via CORS
     */
    protected correctTimestamp(entity:Object, response:Response):void {

        try {
            const serverTimeString: string = response.headers["Date"];
            if (entity.hasOwnProperty("timestamp") && !!serverTimeString) {
                // server has sent a Date header
                let currentTime: number = new Date().getTime();

                let serverTime: number = new Date(serverTimeString).getTime();
                let timeOffset: number = serverTime - currentTime;

                console.info("Correcting time " + timeOffset);

                entity['timestamp'] = entity['timestamp'] + timeOffset;
            }
        }
        catch(e) {
            console.info("Error correcting timestamp", e);
        }
    }


}