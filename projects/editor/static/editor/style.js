import { objectEquals } from "./utils.js";

/**
 * A class representing options for an element
 *
 * @class ElementOptions
 */
class ElementOptions {
    /**
     * Creates an instance of ElementOptions.
     * @param {string} tagName - The tagname of the element
     * @param {Object} [attributes={}] -- All of the elements attributes
     * @memberof ElementOptions
     */
    constructor(tagName, attributes = {}){
        this.tagName = tagName;
        this.attributes = attributes;
    }

    /**
     * Check equality with this instance and another options
     *
     * @param {ElementOptions} b - The object to compare with this
     * @return {boolean} The result of the comparison
     * @memberof ElementOptions
     */
    equals(b){
        return this.tagName == b.tagName &&
            objectEquals(this.attributes, b.attributes);
    }

    /**
     * Compute this option to an HTMLElement
     *
     * @param {*} [text] - Optional text
     * @return {HTMLElement} The computed element
     * @memberof ElementOptions
     */
    compute(text){ // optional text
        let element = document.createElement(this.tagName);
        for (let [key, value] of Object.entries(this.attributes)){
            element.setAttribute(key, value);
        }
        if (text){
            element.textContent = text;
        }
        return element;
    }
}

/**
 * Like ElementOptions, but just for when we need to use a singular style
 *
 * @class StyledElementOptions
 * @extends {ElementOptions}
 */
class StyledElementOptions extends ElementOptions {
    /**
     * Creates an instance of StyledElementOptions.
     * @param {string} name - A CSS rule name
     * @param {string} value - The value for the CSS rule
     * @memberof StyledElementOptions
     */
    constructor(name, value){
        super("SPAN", {
            "style": name + ":" + value + ";"
        });
    }
}

/**
 * Generate a list of options from an element
 *
 * @param {HTMLElement} child - An element to generate options from
 * @return {Array.<ElementOptions|StyledElementOptions} A list of options
 */
function createOptionsFromChild(child){
    let ret = [];
    let curr = child;

    while (curr){
        ret.push(curr)
        curr = curr.firstElementChild;
    }
    ret = ret.map(elem => {
        // Properties would have to be changed here
        if (elem.style.length > 0){
            // TODO: Won't work for when there are more than one styles
            // Get the first style, then get the value for it
            return new StyledElementOptions(elem.style[0], elem.style[elem.style[0]]); // TODO: only handles singular styles
        }
        return new ElementOptions(elem.tagName);
    });
    return ret;
}
/**
 * Toggle an option
 *
 * @param {Array.<ElementOptions|StyledElementOptions>} childOptions - An array of options
 * @param {ElementOptions|StyledElementOptions} currOption - The option to toggle
 * @return {Array.<ElementOptions|StyledElementOptions>}
 */
function toggleOption(childOptions, currOption){
    // if currOption is inside child options
    // Array.contains doesn't work for objects
    if (childOptions.some(x => x.equals(currOption))){
        // Remove all references to the object
        childOptions = childOptions.filter(x => !x.equals(currOption));
    } else {
        // Add the current option to the array
        childOptions.push(currOption);
    }
    return childOptions;
}
/**
 * Recursively compute every option from an array
 *
 * @param {Array.<ElementOptions|StyledElementOptions>} options - A list of options
 * @param {string} text - Text of element
 * @return {HTMLElement} 
 */
function computeAll(options, text){
    // [a, b, c] -> a.b.c
    if (options.length > 0){
        let ret = options[0].compute();
        let curr = ret;

        for (let option of options.slice(1)){ // We have already computed the first item
            curr = curr.appendChild(option.compute()); // Add the computed option
        }
        curr.appendChild(document.createTextNode(text));
        return ret;

    }
    return new ElementOptions("SPAN").compute(text);
}

/**
 * Find the greatest parent element for a range
 *
 * @param {Range} range - The range
 * @return {DocumentFragment} The contents from the range
 */
function findGreatestParent(range){
    let ancestor = range.commonAncestorContainer;
    // If the ancestor's parent is the editor, return the contents
    if (ancestor.parentElement.classList.contains("editor")){
        return range.extractContents();
    }

    let text = range.cloneContents().textContent;
    // If the parent of the ancestor has the same text
    if (text == ancestor.parentElement.textContent){
        let curr = ancestor.parentElement;

        // recusrively check, then return parent in a document fragment
        while (curr.parentElement.textContent == text){
            curr = curr.parentElement;
        }
        // need toggleStyle expects a document fragment from range.extractContents()
        let fragment = document.createDocumentFragment();
        // append child removes the element from the dom, so use range.extractContents()
        fragment.appendChild(curr);
        return fragment;
    } else {
        return range.extractContents();
    }
}
/**
 * Toggle a style on an element
 * 
 * This function can be called with either 1 or 2 arguments
 * TODO: Use object destructuring here
 *
 * @param {string} [tagName] - The tag to toggle
 * 
 * @param {string} [rule] - The rule to toggle
 * @param {string} [value] - The value for the rule
 */
export function toggleStyle(){
    /* 
        Replacement for document exec command
        if contents.firstElementChild

            For every child of contents.children[0]
                add element name to array

            If the current style isn't in this array, add it
            If current style is in this array, remove it
            Create a new element from this array
        else
            Create a new element with only style
    */

    let currOption;
    if (arguments.length == 1){
        currOption = new ElementOptions(arguments[0]);
    } else if (arguments.length == 2){
        currOption = new StyledElementOptions(arguments[0], arguments[1]);
    } else {
        throw new Error("Need 1 or 2 arguments");
    }
    
    let range = window.getSelection().getRangeAt(0);
    let contents = findGreatestParent(range); // Find the greatest element, see #9

    let newContents;

    if (contents.firstElementChild){
        let childOptions = createOptionsFromChild(contents.firstElementChild);
        let filteredChildren = toggleOption(childOptions, currOption);
        newContents = computeAll(filteredChildren, contents.textContent);
    } else {
        newContents = currOption.compute(contents.textContent);
    }
    range.insertNode(newContents);
}