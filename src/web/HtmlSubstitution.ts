import * as React from "react";
import * as ReactDOM from "react-dom";
import {JenkinsJobComponent} from "./JenkinsJobComponent";
import {ServerConfigComponent} from "./ServerConfigComponent";
import ReactElement = React.ReactElement;

export class HtmlSubstitution {

    // Maps Html element to React component
    private static ELEMENT_MAPPINGS: Object = {
        "server": ServerConfigComponent,
        "jenkins_job": JenkinsJobComponent
    };

    public substitute(): void {

        for (const elementName in HtmlSubstitution.ELEMENT_MAPPINGS) {

            if (HtmlSubstitution.ELEMENT_MAPPINGS.hasOwnProperty(elementName)) {

                let reactComponentClass = HtmlSubstitution.ELEMENT_MAPPINGS[elementName];
                let elements: NodeListOf<Element> = document.getElementsByTagName(elementName);

                //console.info("Substituting elements "+elementName+" ...");

                for (let i: number = 0; i < elements.length; i++) {

                    let element: Element = elements.item(i);
                    let elementAttributes: Object = {};

                    for (let j: number = 0; j < element.attributes.length; j++) {

                        let attribute: Attr = element.attributes.item(j);
                        elementAttributes[attribute.name] = attribute.value;
                    }

                    console.info("Creating React element from "+elementName+" with "+JSON.stringify(elementAttributes));

                    let reactElement: ReactElement<any> = React.createElement(reactComponentClass, elementAttributes, null);
                    ReactDOM.render(reactElement, element);
                }
            }
        }
    }
}