import * as React from "react";
import {
    JenkinsClient, JenkinsJobResponse, isBuilding, JenkinsBuildResponse, getProgressPercent, JenkinsBuildStatus, getBuildStatus, isSingleJob, isMultiJob,
    JenkinsJobRefResponse, JenkinsMultiJobResponse, getHealth
} from "./JenkinsClient";
import {getConfig, ServerConfig} from "./StatusProviderComponent";
import {Styles} from "./Styles";
import {TravisClient, TravisBuildResponse} from "./TravisClient";
import {StatusComponent, StatusProperties, Status, ErrorSource} from "./StatusComponent";

/**
 * React component for rendering Jenkins job status
 */
export class TravisBuildComponent extends StatusComponent {

    constructor(props: StatusProperties) {
        super(props);
    }


    protected loadStatus(): Promise<Status> {

        // TODO remove this duplicate code
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

        const client:TravisClient = new TravisClient(config.url, config.username, config.password);
        return client.read(this.props['id-ref']).then((job: TravisBuildResponse) => {

            return null; // TODO
        });
    }
}





