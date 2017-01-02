import * as React from "react";
import {
    JenkinsClient, JenkinsJobResponse, isError, isWarning, isSuccessful, isBuilding,
    JenkinsBuildResponse, getProgressPercent
} from "./JenkinsClient";
import {getConfig, ServerConfig} from "./ServerConfigComponent";



export interface JobProperties {
    server: string,
    name: string
}

export interface JobState {

    loadStatus: string;
    buildCount?: number;
    buildStatus?: string;
    building?:boolean;
    buildProgress?:number;
    jobUrl?:string;
    buildTimestamp?;
}


/**
 * Renders application version
 *
 * Requires Plugin "CORS support for Jenkins" with "Access-Control-Allow-Methods": "GET", "Access-Control-Allow-Headers": "authorization", "Access-Control-Allow-Origins": "*"
 *
 */
export class JenkinsJobComponent extends React.Component<JobProperties, JobState> {

    private _period:number = 2000;
    private _triggerHandle:number;

    constructor(props: JobProperties) {
        super(props);
        if( !props.server || !props.name ) {
            throw new Error("Missing property 'server' and/or 'name': "+JSON.stringify(props));
        }
    }

    public componentWillMount():void {
        this.triggerLoadJob(this._period);
    }

    public componentWillUnmount():void {
        window.clearTimeout(this._triggerHandle);
    }

    public render() {

        // const jobUrl = this.state.jobUrl;
        let className:string = `build ${this.state.loadStatus} ${this.state.buildStatus}`;
        if( this.state.building ) {
            className += " building";
        }

        let progressBar = null;
        if( this.state.buildProgress < 1 ) {
            progressBar =  <progress value={this.state.buildProgress} max="100"></progress>;
        }
        const infoString:string = "Date: "+new Date(this.state.buildTimestamp)+"\nTest: Hello";


        return <div className={className} title={infoString}>
                    <h3><a href={this.state.jobUrl} target="_blank">{this.props.name}</a></h3>
                    {progressBar}
                </div>;
    }

    // --------------

    private triggerLoadJob(interval:number):void {
        this.setState({
            "loadStatus": "loading"
        });
        this.loadJob().then((state: JobState) => {
                this.setState(state);
                this._triggerHandle = window.setTimeout(() => this.triggerLoadJob(interval), interval);
            }).catch(() => {
                this._triggerHandle = window.setTimeout(() => this.triggerLoadJob(interval), interval);
            });
    }



    private loadJob(): Promise<JobState> {

        const client:JenkinsClient = this.getClient();
        return client.readJob(this.props.name).then((job: JenkinsJobResponse) => {

                return client.readBuild(job.lastBuild).then((build:JenkinsBuildResponse) => {

                    return {
                        "name": this.props.name,
                        "jobUrl": job.url,
                        "loadStatus": "loading-done",
                        "buildCount": job && job.builds ? job.builds.length : 0,
                        "buildStatus": JenkinsJobComponent.asBuildStatus(job),
                        "building": isBuilding(job),
                        "buildProgress": getProgressPercent(build),
                        "buildTimestamp": build.timestamp,
                    }
                });


            }, (error: any) => {
                console.log("Error " + error);
                return {"loadStatus": "loading-error"};
            }
        );
    }

    // -----------

    private getClient():JenkinsClient {
        let config:ServerConfig = this.getConfig();
        return new JenkinsClient(config.url, config.username, config.password);
    }

    private getConfig():ServerConfig {
        return getConfig(this.props.server);
    }

    private static asBuildStatus(job:JenkinsJobResponse):string {

        if( isError(job) ) {
            return "build-error";
        }
        else if( isWarning(job) ) {
            return "build-warn";
        }
        else if( isSuccessful(job) ) {
            return "build-success";
        }
        else {
            return "build-unknown";
        }
    }
}


