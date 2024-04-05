import { objectEquals, attributesToDict } from "./utils.js";

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
     * TODO: Allow for less strictness here
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
 * Like ElementOptions, but just for when we need to use a singular style (for convenience)
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
        // Styles are inside of attributes
        return new ElementOptions(elem.tagName, attributesToDict(elem.attributes));
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
 * @return {HTMLElement|Text} 
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
    // If there aren't any options, then return a text node
    return document.createTextNode(text); // 
}

/**
 * Find the greatest parent element for a range
 *
 * @param {Range} range - The range
 * @return {DocumentFragment} The contents from the range
 */
function findGreatestParent(range){
    let ancestor = range.commonAncestorContainer;
    let text = range.cloneContents().textContent;

    // If the parent of the ancestor has the same text
    if (ancestor.parentElement.textContent == text){
        // Store the parent element
        let curr = ancestor.parentElement;

        // Recurively check if the parent element of curr has the same text as the range
        while (curr.parentElement.textContent == text){
            curr = curr.parentElement;
        }

        // toggleStyle expects a document fragment from range.extractContents()
        let fragment = document.createDocumentFragment();
        // append child removes the element from the dom, so use range.extractContents()
        fragment.appendChild(curr);
        // Return a document fragment containing curr
        return fragment;
    } else {
        // If there isn't a parent with the same text, return the extracted contents
        return range.extractContents();
    }
}
/**
 * Toggle a style on an element
 * 
 * This function can be called with in the form of (tagName, attributes) or (rule, value) 
 * TODO: Use object destructuring here
 *
 * @param {string} [tagName] - The tag to toggle
 * @param {string} [attributes] - The attributes for the tag
 * 
 * @param {string} [rule] - The rule to toggle
 * @param {string} [value] - The value for the rule
 */
export function toggleStyle(first, second){
    /* 
        Replacement for document exec command
        Get selection
        Find greatest parent element
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
    if (typeof second == 'object'){ // toggleStyle("b", {})
        currOption = new ElementOptions(first, second);
    } else { // toggleStyle("font-size", "1.5em")
        currOption = new StyledElementOptions(first, second);
    }

    let range = window.getSelection().getRangeAt(0);
    let contents = findGreatestParent(range); // Find the greatest element, see #9

    let newContents;
    console.log("contents", contents);
    if (contents.firstElementChild){
        let childOptions = createOptionsFromChild(contents.firstElementChild);
        console.log("child options", childOptions);
        let filteredChildren = toggleOption(childOptions, currOption);
        console.log("filtered children", filteredChildren);
        newContents = computeAll(filteredChildren, contents.textContent);
        console.log("new contents", newContents);
    } else {
        newContents = currOption.compute(contents.textContent);
    }
    range.insertNode(newContents);
}