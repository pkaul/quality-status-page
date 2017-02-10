import {RestClient} from "./RestClient";
/**
 * (REST-) client for fetching build data from TravisCI
 *
 * ** EXPERIMENTAL **
 */
export class TravisClient extends RestClient {

    // "/repositories/" + encodeURIComponent(userId) + "/"+encodeURIComponent(repositoryId)+"

    /**
     * Fetches build data
     */
    public read(uri: string): Promise<TravisBuildResponse> {
        const url: string = this._baseUrl + "/"+RestClient.urlEncodeIdOrPath(uri)+".json";
        return this.request(url).then((entity: any) => {
            return entity;
        });
    }
}

export interface TravisBuildResponse {

    "id": number
    "slug": string
    "description": string
    "public_key": string
    "last_build_id": number,
    "last_build_number": string,
    "last_build_status": number,
    "last_build_result": number,
    "last_build_duration": number,
    "last_build_language": string,
    "last_build_started_at": string,
    "last_build_finished_at": string,
    "active": boolean
}