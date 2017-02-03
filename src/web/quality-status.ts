// Entry point

import {HtmlSubstitution} from "./HtmlSubstitution";
import {JenkinsJobComponent} from "./JenkinsJobComponent";
import {StatusProviderComponent} from "./StatusProviderComponent";
import {TravisBuildComponent} from "./TravisBuildComponent";


document.addEventListener("DOMContentLoaded", () => {
    new HtmlSubstitution({
        "status-provider": StatusProviderComponent,
        "jenkins-job": JenkinsJobComponent,
        "travis-build": TravisBuildComponent
    }).substitute();
});








