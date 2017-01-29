// StatusCI entry point

import {HtmlSubstitution} from "./HtmlSubstitution";
import {JenkinsJobComponent} from "./JenkinsJobComponent";
import {ServerConfigComponent} from "./ServerConfigComponent";


document.addEventListener("DOMContentLoaded", () => {
    new HtmlSubstitution({
        "server": ServerConfigComponent,
        "jenkins_job": JenkinsJobComponent
    }).substitute();
});








