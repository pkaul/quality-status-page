import * as React from "react";
import {TravisClient, TravisBuildResponse} from "./TravisClient";
import {StatusComponent, StatusProperties, Status, ErrorSource} from "./StatusComponent";

/**
 * React component for rendering Jenkins job status
 *
 * ** EXPERIMENTAL **
 */
export class TravisBuildComponent extends StatusComponent {

    private client:TravisClient = new TravisClient();

    constructor(props: StatusProperties) {
        super(props);
    }

    protected loadStatus(): Promise<Status> {

        const url:string = this.props.url;
        const client:TravisClient = this.client;

        return client.read(url).then((response: TravisBuildResponse) => {
            return {
                url: url,
                name: this.getDisplayNameFromPropOrState(),
                loading: false
            } as Status;
        });
    }
}





