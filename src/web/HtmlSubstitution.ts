import * as React from "react";
import * as ReactDOM from "react-dom";
import ReactElement = React.ReactElement;

/**
 * Parses HTML and replaces custom elements by React components
 */
export class HtmlSubstitution {

    private _elements:Object;

    /**
     * @param elements Mapping from element name to React class
     */
    constructor(elements:Object) {
        this._elements = elements;
    }

    public substitute(): void {

        for (const elementName in this._elements) {

            if (this._elements.hasOwnProperty(elementName)) {

                let reactComponentClass = this._elements[elementName];
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