import * as React from "react";
import {
    JenkinsClient, JenkinsJobResponse, isBuilding, JenkinsBuildResponse, getProgressPercent, JenkinsBuildStatus, getBuildStatus, isSingleJob, isMultiJob,
    JenkinsJobRefResponse, JenkinsMultiJobResponse, getHealth
} from "./JenkinsClient";
import {getConfig, ServerConfig} from "./StatusProviderComponent";
import {Styles} from "./Styles";
import {StatusComponent, StatusProperties, Status, ErrorSource} from "./StatusComponent";


/**
 * React component for rendering Jenkins job status
 */
export class JenkinsJobComponent extends StatusComponent {


    constructor(props: StatusProperties) {
        super(props);
    }

    public render():JSX.Element {

        if( !!this.state.error ) {
            return this.renderStatus(this.state);
        }
        else if( !!(this.state as JobState).buildStatus ) {
            return this.renderJob(this.state as JobState);
        }
        else if( !!(this.state as MultiJobState).jobs ) {
            return this.renderMultiJob(this.state as MultiJobState);
        }
        else {
            return this.renderStatus(this.state);
        }
    }

    // --------------


    private renderMultiJob(jobs:MultiJobState):JSX.Element {

        return <div className="status-group">
                    <h3><a href={this.state.url ? this.state.url : ""}>{this.getDisplayNameFromPropOrState()}</a></h3>
                    {
                        jobs.jobs.map(item =>
                            // dynamically create a React component with a virtual job id
                            React.createElement(JenkinsJobComponent, {"provider-ref": this.props['provider-ref'], "id-ref": this.props['id-ref']+"/job/"+item.name}, null)
                        )
                    }
                </div>;
    }

    private renderJob(job:JobState):JSX.Element {

        const now:number = new Date().getTime();

        // age: distinct value between 0 and 5
        let age:number = null;
        if( !job.building && job.buildTimestamp ) {

            age = Math.round((now - job.buildTimestamp) / JenkinsJobComponent.AGE_INTERVAL_MILLIS);
            if (age < 0) {
                age = 0;
            }
            if (age > 5) {
                age = 5;
            }
        }

        let className:string = `status ${job.buildStatus}`;
        if( job.building ) {
            className += " building";
        }
        if( age ) {
            className += " age-"+age;
        }

        if( job.loading ) {
            className += " "+Styles.LOADING;
        }


        let progressBar = null;
        if( job.building ) {
            progressBar =  <progress value={job.buildProgress} max="100"></progress>;
        }

        let info:string[] = ["Last built: "+new Date(job.buildTimestamp)];
        if( job.buildHealth != null ) {
             info.push("Health: "+job.buildHealth+"%");
        }

        return <div className={className} title={info.join("\n")}>
            <h3><a href={job.url} target="_blank">{job.name}</a></h3>
            {progressBar}
        </div>;
    }

    protected loadStatus(): Promise<Status> {

        const providerRef:string = this.props['provider-ref'];
        let config: ServerConfig = getConfig(providerRef);
        if(!config) {
            return Promise.resolve({
                name: this.getDisplayNameFromPropOrState(),
                loading: false,
                error: ErrorSource.CONFIG,
                errorMessage: "No provider config '"+providerRef+"' found"
            });
        }

        // load job from provider
        const client:JenkinsClient = new JenkinsClient(config.url, config.username, config.password);
        return client.read(this.props['id-ref']).then((job: JenkinsJobResponse | JenkinsMultiJobResponse) => {

                // determine name: lookup explicit name from properties, from job definition and (fallback) use id
                let name: string = !!this.props.name ? this.props.name : job.displayName;
                if (!name) {
                    name = this.props['id-ref'];
                }
                //
                if (isSingleJob(job)) {

                    let singleJob: JenkinsJobResponse = job as JenkinsJobResponse;
                    return client.readBuild(singleJob.lastBuild).then((build: JenkinsBuildResponse) => {

                        return Promise.resolve({
                            "name": name,
                            "url": job.url,
                            "loading": false,
                            "buildCount": singleJob && singleJob.builds ? singleJob.builds.length : 0,
                            "buildStatus": JenkinsJobComponent.asStatusStyle(singleJob),
                            "building": isBuilding(singleJob),
                            "buildProgress": getProgressPercent(build),
                            "buildTimestamp": build.timestamp,
                            "buildHealth": getHealth(singleJob)
                        } as JobState) as Promise<JobState | MultiJobState>
                    });
                }
                else if (isMultiJob(job)) {

                    let multiJob: JenkinsMultiJobResponse = job as JenkinsMultiJobResponse;
                    return Promise.resolve({
                        "name": this.getDisplayNameFromPropOrState(),
                        "loading": false,
                        "jobs": multiJob.jobs
                    } as MultiJobState) as Promise<JobState | MultiJobState>;
                }
                else {

                    return Promise.resolve({
                        name: this.getDisplayNameFromPropOrState(),
                        loading: false,
                        error: ErrorSource.PROVIDER,
                        errorMessage: "Unexpected response format: "+JSON.stringify(job)
                    } as Status) as Promise<Status>;
                }

            }, (error: any) => {

                return Promise.resolve({
                    url: error['url'], // might be available. or not.
                    name: this.getDisplayNameFromPropOrState(),
                    loading: false,
                    error: ErrorSource.LOADING,
                    errorMessage: "Error: "+JSON.stringify(error)
                } as JobState);
            }
        );
    }

    // -----------

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



interface JobState extends Status {

    buildCount: number;
    buildStatus: string;
    // whether job is currently building
    building:boolean;
    // progress (0..100) for build to finish
    buildProgress:number;
    buildTimestamp:number;
    buildHealth:number;
}

interface MultiJobState extends Status {
    jobs:JenkinsJobRefResponse[]
}



