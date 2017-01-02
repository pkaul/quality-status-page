
import rest = require("rest");
import basicAuth = require("rest/interceptor/basicAuth");
import defaultRequest = require("rest/interceptor/defaultRequest");
import {Client} from "rest";
import {Request} from "rest";
import {Response} from "rest";


import {Promise} from 'es6-shim';


export class JenkinsClient {

    private _baseUrl:string;
    private _userName:string;
    private _password:string;

    constructor(baseUrl:string, userName:string, password:string) {
        this._baseUrl = baseUrl;
        this._userName = userName;
        this._password = password;
    }

    public readJob(jobName: string): Promise<JenkinsJobResponse> {

        const url:string = this._baseUrl + "/job/" + encodeURIComponent(jobName) + "/api/json";
        return this.request(url).then((entity:any) => {
            return <JenkinsJobResponse> entity;
        });
    }

    public readBuild(buildRef:JenkinsBuildRefResponse):Promise<JenkinsBuildResponse> {

        const url:string = buildRef.url + "/api/json";
        return this.request(url).then((entity:any) => {
            return <JenkinsBuildResponse> entity;
        });
    }

    // -------------

    private request(url:string):Promise<any> {

        const client: Client = rest.wrap(basicAuth, {username: this._userName, password: this._password});
        const request: Request = {
            "method": "GET",
            "path": url,
            "headers": {
                // "Access-Control-Request-Headers": "authorization",
                // "Access-Control-Expose-Headers": "Date"
            }
        };

        return new Promise<JenkinsJobResponse>((resolve:(r:any)=>void, reject:(reason:any) => void) => {

            client(request).then((response: Response) => {

                //console.info("Received " + JSON.stringify(response)+" from "+url);

                if (response.status.code === 200 && !!response.entity) {

                    let jsonEntity: Object = JSON.parse(response.entity);
                    // JenkinsClient.correctTimestamp(jsonEntity, response);
                    resolve(jsonEntity);
                }
                else {
                    reject("Error loading " + url + ": " + (!!response ? JSON.stringify(response) : null));
                }
            }).catch((e: Error) => {
                console.info("Error accessing " + url +": "+JSON.stringify(e));
                reject("Error loading " + url + ": " + (!!e ? JSON.stringify(e) : null));
            });
        });
    }

    /**
     * Correct timestamp property from Jenkins entity based on server "Date".
     * TODO: requires "Date" to be allowed via CORS
     */
    private static correctTimestamp(entity:Object, response:Response):void {

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


// ----------------------------

export interface JenkinsBuildRefResponse {

    _class: string,
    number: number,
    url: string
}

export interface JenkinsJobResponse {

    builds: JenkinsBuildRefResponse[],
    lastBuild: JenkinsBuildRefResponse,
    color: string,
    description: string,
    displayName: string,
    displayNameOrNull: string,
    name:string,
    url:string
}


export interface JenkinsBuildResponse {

    id: string,
    building: boolean,
    number: number,
    duration: number,
    estimatedDuration:number,
    timestamp:number
}

// ----------------------------


export function isError(job:JenkinsJobResponse):boolean {
    return !!job.color && job.color.startsWith("red");
}

export function isWarning(job:JenkinsJobResponse):boolean {
    return !!job.color && job.color.startsWith("yellow");
}

export function isSuccessful(job:JenkinsJobResponse):boolean {
    return !!job.color && job.color.startsWith("blue");
}


// TODO support notbuilt, aborted, disabled

export function isBuilding(job:JenkinsJobResponse):boolean {
    return !!job.color && job.color.indexOf("_anime") > -1;
}

/**
 * Age of a build in milliseconds
 */
export function getAge(build:JenkinsBuildResponse):number {

    let now:number = new Date().getTime();
    return now - (!!build.timestamp ? build.timestamp : 0)
}

/**
 * @param build
 * @return {number} Progress of job. Value between 0 (just started) and 100 (finished)
 */
export function getProgressPercent(build:JenkinsBuildResponse):number {

    if( !build.building || !build.timestamp || !build.estimatedDuration ) {
        return 100;
    }

    let now:number = new Date().getTime();
    let elapsedMillis:number = now-build.timestamp;
    let result:number = Math.round(elapsedMillis * 100 / build.estimatedDuration);

    //console.log("Progress: ts="+(new Date(build.timestamp).toDateString())+" now="+now+" elapsed="+elapsedMillis+" estimated="+build.estimatedDuration+" result="+result);

    if( result < 0 || result > 100 ) {
        // wrong system time?
        return 0;
    }
    return elapsedMillis / build.estimatedDuration;
}


