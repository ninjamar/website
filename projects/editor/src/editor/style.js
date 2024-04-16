import { objectEquals, attributesToDict } from "./utils.js";

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


// Strikethrough and underline doesnt work - inverted

/**
 * @typedef {Object} Style 
 * @property {ElementOptions} applied - Applied style
 * @property {ElementOptions} inverted - Inverted style
 */
export const styles = {
    BOLD: {
        applied: new ElementOptions("SPAN", {"style": "font-weight: bold;"}),
        inverted: new ElementOptions("SPAN", {"style": "font-weight: normal;"})
    },
    ITALIC: {
        applied: new ElementOptions("SPAN", {"style": "font-style: italic;"}),
        inverted: new ElementOptions("SPAN", {"style": "font-style: normal;"})
    },
    STRIKETHROUGH: {
        applied: new ElementOptions("SPAN", {"style": "text-decoration: line-through; text-decoration-skip: object;"}),
        inverted: new ElementOptions("SPAN", {"style": "display: inline-block"})
    },
    HEADER2: {
        applied: new ElementOptions("H2") // there is no inverted of header 2
    },
    CENTER: {
        applied: new ElementOptions("SPAN", {"style": "text-align: center; display: block;"})
    }

}

/**
 * Generate a list of options from an element
 *
 * @param {HTMLElement} child - An element to generate options from
 * @return {Array.<ElementOptions} A list of options
 */
export function createOptionsFromElement(element){
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
 * @export
 * @param {Range} range - The range
 * @return {DocumentFragment} The contents from the range
 */
export function extractGreatestParent(range){
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
 * Get all applied style for an element
 * TODO: This should probably be called getAllParentElements
 *
 * @param {HTMLElement} element - Element to check
 * @param {HTMLElement} [max=document.body] - Maxomum parent
 * @returns {Array.<HTMLElement>} - All applied styles
 */
function getAllAppliedStyles(element, max = document.body){
    let curr = element;
    let styles = [curr];
    while (curr.parentElement && curr.parentElement != max){
        curr = curr.parentElement;
        styles.push(curr);
    }
    return styles;
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
 * Callback after AppliedStyles
 * @callback appliedStylesCallback
 * @param {Array} - Applied styles
 * @returns {boolean} - Whether function should return
 */

/**
 * Modify a style on a range
 *
 * @export
 * @param {ElementOptions} applied - Applied version of style
 * @param {ElementOptions} inverted - Inverted version of style
 * @param {Range} range - Range
 * @param {existingStylesCallback} callback
 * @param {noExistingStylesCallback} [callback2=((o, c) => o.compute(c.textContent))]
 * @param {appliedStylesCallback} [callback3=() => false]
 * @param {boolean} [checkInverse=true]
 */
export function styleAction(applied, inverted, range, callback, callback2 = ((o, c) => o.compute(c.textContent)), callback3 = () => false, checkInverse = true){
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
    // Extract greatest parent
    let contents = extractGreatestParent(range);
    // Get all applied styles above text - I can't use contents because extractGreatestParent detaches element from the DOM
    let appliedStyles = getAllAppliedStyles(range.commonAncestorContainer);

    // Callback to return from appliedStyles - eg style is already applied
    if (callback3(appliedStyles)){
        range.insertNode(contents);
        return;
    }

    let forceInverse;
    // option to disable inverse
    if (checkInverse){
        // Get all HTMLElements, and turn them into ElementOptions
        appliedStyles = appliedStyles.filter(x => x instanceof HTMLElement).map(x => new ElementOptions(x.tagName, attributesToDict(x.attributes)));
        // If the inverted parameter is not null
        if (inverted){
            // Filter applied styles to applied and inverted
            appliedStyles = appliedStyles.filter(x => x.equals(applied) || x.equals(inverted));
            // Force inverse if appliedStyles has more than one element
            forceInverse = appliedStyles.length > 0;
        } else {
            // No force inverse
            forceInverse = false;
        }
    } else {
        // Don't force inverse if checkInverse is false
        forceInverse = false;
    }

    let newContents;
    // If contents has a firstElementChild or forceInverse
    if (contents.firstElementChild || forceInverse){
        // Create Options
        let childOptions = createOptionsFromElement(contents.firstElementChild);
        let filteredChildren;
        // force inverse
        if (forceInverse){
            // Since new styles are at the beginning, callback based on first element
            if (appliedStyles[0].equals(applied)){
                // applied -> inverted
                filteredChildren = callback(childOptions, inverted);
            } else {
                // inverted -> applied
                filteredChildren = callback(childOptions, applied);   
            }
        } else {
            // Proceed normally, using callback with applied
            filteredChildren = callback(childOptions, applied);   
        }
        // Compute the options
        newContents = computeAllOptions(filteredChildren, contents.textContent);
    } else {
        // Compute applied style
        newContents = callback2(applied, contents);
    }
    // Insert contents
    range.insertNode(newContents);
}

/**
 * Toggle a style on the current selection
 *
 * @export
 * @param {Style} option - Option to toggle
 * @returns {*}
 */
export function toggleStyle(option){
    return styleAction(
        option.applied, 
        option.inverted, 
        window.getSelection().getRangeAt(0), 
        toggleOption,
    );
}


/**
 * Remove a style on the current selections
 *
 * @export
 * @param {Style} option - Option to to remove
 * @returns {*}
 */
export function removeStyle(option){
    return styleAction(
        option.applied, 
        option.inverted,
        window.getSelection().getRangeAt(0), 
        (childOptions, currOption) => childOptions.filter(x => !x.equals(currOption)),
        (applied, contents) => document.createTextNode(contents.textContent)
    );
}

/**
 * Remove all styles on the current selection
 *
 * @export
 */
export function removeAllStyles(){
    return styleAction(
        null, 
        null, 
        window.getSelection().getRangeAt(0), 
        (childOptions, currOption) => [],
        (applied, contents) => document.createTextNode(contents.textContent)
    );
}