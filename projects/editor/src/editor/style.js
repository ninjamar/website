import { objectEquals, attributesToDict } from "./utils.js";

let NOT_UNIQUE = ["SPAN"];

/**
 * A class representing options for an element
 *
 * @export
 * @class ElementOptions
 */
export class ElementOptions {
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
     * Check if tag of this instance and another option are the same
     *
     * @param {ElementOptions} b - The object to compare tags with
     * @return {boolean} The result of the comparison 
     * @memberof ElementOptions
     */
    softEquals(b){
        return this.tagName == b.tagName;
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
 * Generate a list of options from an element
 *
 * @param {HTMLElement} child - An element to generate options from
 * @return {Array.<ElementOptions} A list of options
 */
function createOptionsFromElement(element){
    let ret = [];
    let curr = element;

    while (curr){
        ret.push(curr)
        curr = curr.firstElementChild;
    }
    ret = ret.map(elem => new ElementOptions(elem.tagName, attributesToDict(elem.attributes)));
    return ret;
}

/**
 * Toggle an option
 *
 * @param {Array.<ElementOptions>} childOptions - An array of options
 * @param {ElementOptions} currOption - The option to toggle
 * @return {Array.<ElementOptions>}
 */
export function toggleOption(childOptions, option){
    // if currOption is inside child options
    // Array.contains doesn't work for objects

    // TODO: This doesn't need to be here
    let tag = option.tagName;
    if (!NOT_UNIQUE.includes(tag)){
        // Keep all items that don't have the same tag name (exclude elements of the same tag)
        childOptions = childOptions.filter(x => x.tagName != tag || x.equals(option));
        // tagName is the same and they aren't equal
    }

    if (childOptions.some(x => x.equals(option))){
        // Remove all references to the object
        childOptions = childOptions.filter(x => !x.equals(option));
    } else {
        // Add the current option to the array
        childOptions.push(option);
    }
    return childOptions;
}

/**
 * Recursively compute every option from an array
 *
 * @param {Array.<ElementOptions>} options - A list of options
 * @param {string} text - Text of element
 * @return {HTMLElement|Text} 
 */
function computeAllOptions(options, text){
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
 * Extract the greatest parent element for a range
 *
 * @param {Range} range - The range
 * @return {DocumentFragment} The contents from the range
 */
function extractGreatestParent(range){
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
 * Callback when there is a existing styles
 * 
 * @callback existingStylesCallback
 * @param {Array.<ElementOptions>} childOptions
 * @param {ElementOptions} currOption
 * @returns {Array.<ElementOptions>} Modified element options
*/

/** 
 * Callback when there aren't any existing styles
 * 
 * @callback noExistingStylesCallback
 * @param {ElementOptions} option
 * @param {HTMLElement|Text} contents
 * @returns {HTMLElement} Modified element options
*/

/**
 * Modify a style on a range
 *
 * @export
 * @param {ElementOptions} option - The option to add
 * @param {Range} range - The range
 * @param {existingStylesCallback} callback - Callback when there is a existing styles
 * @param {noExistingStylesCallback} [callback2=((o, c) => o.compute(c.textContent))] - callback
 */
export function styleAction(option, range, callback, callback2 = ((o, c) => o.compute(c.textContent))){
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
    
    let contents = extractGreatestParent(range); // Find the greatest element, see #9
    
    let newContents;
    if (contents.firstElementChild){
        let childOptions = createOptionsFromElement(contents.firstElementChild);
        // let filteredChildren = toggleOption(childOptions, option);
        let filteredChildren = callback(childOptions, option);
        newContents = computeAllOptions(filteredChildren, contents.textContent);
    } else {
        // newContents = option.compute(contents.textContent);
        newContents = callback2(option, contents);
    }
    range.insertNode(newContents);
}

/**
 * Toggle a style on the current selection
 *
 * @export
 * @param {string} tag - Tagname to toggle
 * @param {Object} [attributes={}] - The attributes for the element
 * @returns {*}
 */
export function toggleStyle(tag, attributes = {}){
    return styleAction(new ElementOptions(tag, attributes), window.getSelection().getRangeAt(0), toggleOption);
}

/**
 * Toggle a style on the current selection (without replacing it)
 *
 * @export
 * @param {string} tag - Tagname to toggle
 * @param {Object} [attributes={}] - The attributes for the element
 * @returns {*}
 */
export function toggleStyleNoReplace(tag, attributes = {}){
    return styleAction(new ElementOptions(tag, attributes), window.getSelection().getRangeAt(0), (childOptions, currOption) => {
        if (childOptions.some(x => x.tagName == tag)){
            return childOptions.filter(x => x.tagName != tag);
        } else {
            return toggleOption(childOptions, currOption);
        }
    });
}

/**
 * Remove a style on the current selections
 *
 * @export
 * @param {string} tag - Tagname to remove
 * @param {Object} [attributes={}] - The attributes for the element
 * @returns {*}
 */
export function removeStyle(tag, attributes = {}){
    return styleAction(new ElementOptions(tag, attributes), window.getSelection().getRangeAt(0), (childOptions, currOption) => childOptions.filter(x => !x.equals(currOption)));
}


/**
 * Remove all styles on the current selection
 *
 * @export
 */
export function removeAllStyles(){
    return styleAction(new ElementOptions("div", {}), window.getSelection().getRangeAt(0), (childOptions, currOption) => []);
}