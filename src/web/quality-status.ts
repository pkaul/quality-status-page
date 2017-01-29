// Entry point

import {HtmlSubstitution} from "./HtmlSubstitution";
import {JenkinsJobComponent} from "./JenkinsJobComponent";
import {StatusProviderComponent} from "./StatusProviderComponent";


document.addEventListener("DOMContentLoaded", () => {
    new HtmlSubstitution({
        "status-provider": StatusProviderComponent,
        "jenkins-job": JenkinsJobComponent
    }).substitute();
});








