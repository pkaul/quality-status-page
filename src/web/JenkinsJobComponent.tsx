import * as React from "react";
import {
    JenkinsClient, JenkinsJobResponse, isBuilding, JenkinsBuildResponse, getProgressPercent, JenkinsBuildStatus, getBuildStatus
} from "./JenkinsClient";
import {getConfig, ServerConfig} from "./ServerConfigComponent";
import {Styles} from "./Styles";



/**
 * React component for rendering Jenkins job status
 *
 * Requires Jenkins to have plugin "CORS support for Jenkins" installed with config:
 *  "Access-Control-Allow-Methods": "GET",
 *  "Access-Control-Allow-Headers": "authorization",
 *  "Access-Control-Allow-Origins": "*"
 *
 */
export class JenkinsJobComponent extends React.Component<JobProperties, JobState> {

    private _refreshInterval:number = 3000;
    private _triggerHandle:number;

    constructor(props: JobProperties) {
        super(props);
        if( !props.server || !props.name ) {
            throw new Error("Missing property 'server' and/or 'name': "+JSON.stringify(props));
        }
    }

    public componentWillMount():void {
        this.triggerLoadJob();
    }

    public componentWillUnmount():void {
        window.clearTimeout(this._triggerHandle);
    }

    public render() {

        const now:number = new Date().getTime();

        // age: distinct value between 0 and 5
        let age:number = null;
        if( !this.state.building && this.state.buildTimestamp ) {

            // distinct age values are based on 6-hours intervals
            age = Math.round((now - this.state.buildTimestamp) / 6 * 60 * 60 * 1000);
            if (age < 0) {
                age = 0;
            }
            if (age > 5) {
                age = 5;
            }
        }


        // const jobUrl = this.state.jobUrl;
        let className:string = `build ${this.state.loadStatus} ${this.state.buildStatus}`;
        if( this.state.building ) {
            className += " building";
        }
        if( age ) {
            className += " age-"+age;
        }

        let progressBar = null;
        if( this.state.buildProgress < 1 ) {
            progressBar =  <progress value={this.state.buildProgress} max="100"></progress>;
        }
        const infoString:string = "Date: "+new Date(this.state.buildTimestamp)+"\nTest: Hello";   // TODO


        return <div className={className} title={infoString}>
                    <h3><a href={this.state.jobUrl} target="_blank">{this.props.name}</a></h3>
                    {progressBar}
                </div>;
    }

    // --------------

    private triggerLoadJob():void {

        let interval:number = this._refreshInterval+Math.random()*500;
        this.setState({
            "loadStatus": "loading",
        });
        this.loadJob().then((state: JobState) => {
                this.setState(state);
                this._triggerHandle = window.setTimeout(() => this.triggerLoadJob(), interval);
            }).catch(() => {
                this._triggerHandle = window.setTimeout(() => this.triggerLoadJob(), interval);
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
                        "buildStatus": JenkinsJobComponent.asStatusStyle(job),
                        "building": isBuilding(job),
                        "buildProgress": getProgressPercent(build),
                        "buildTimestamp": build.timestamp,
                    }
                });


            }, (error: any) => {
                console.log("Error " + error);
                return {
                    "loadStatus": "loading-error",
                    "buildStatus": Styles.STATUS_NONE
                };
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

    private static asStatusStyle(job:JenkinsJobResponse):string {

        let status:JenkinsBuildStatus = getBuildStatus(job);
        if( status === JenkinsBuildStatus.SUCCESS ) {
            return Styles.STATUS_SUCCESS;
        }
        else if( status === JenkinsBuildStatus.WARN ) {
            return Styles.STATUS_WARN;
        }
        else if( status === JenkinsBuildStatus.ERROR ) {
            return Styles.STATUS_ERROR;
        }
        else {
            return Styles.STATUS_NONE;
        }
    }
}





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
    buildTimestamp?:number;
}

