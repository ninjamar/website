"use strict";

/* 
    Text Editor
    Copyright (c) 2024 ninjamar

    [ ] TODO: Allow properties
    [ ] TODO: Support links using properties
    [x] TODO: Turn into module
    [ ] TODO: Allow links
    [x] TODO: Don't use lucide icons
    [x] TODO: Make the selection menu pretty
    [ ] TODO: Filter based on uniqueness (only on header tag)
    [x] TODO: Clean up file
    [x] TODO: Handle comment nodes?
    [ ] TODO: Context menu moves after using header
    [x] TODO: Preload menu
    [ ] TODO: Big and small text
    [ ] TODO: Document this code
    [ ] TODO: Spin this code into it's own repo and use git submodules
    [ ] TODO: Multiline selection doesn't work
    [x] TODO: Handle tab key
    [x] TODO: Handle tab deletion
    [x] TODO: Configuration for editor
    [x] TODO: Turn this into a class
*/

let menuOptions = {
    html: `
        <div id="editor-context-menu">
            <ul>
                <li>
                    <button name="bold">
                        <i class="ph ph-text-b"></i>
                    </button>
                </li>
                <li>
                    <button name="italic">
                        <i class="ph ph-text-italic"></i>
                    </button>
                </li>
                <li>
                    <button name="strikethrough">
                        <i class="ph ph-text-strikethrough"></i>
                    </button>
                </li>
                <li>
                    <button name="underline">
                        <i class="ph ph-text-underline"></i>
                    </button>
                </li>
                <li>
                    <button name="header-2">
                        <i class="ph ph-text-h-two"></i>
                    </button>
                </li>
            </ul>
        </div>
    `,
    // Set event listeners based on the name attribute
    listeners: {
        "bold": (() => toggleStyle("B")),
        "italic": (() => toggleStyle("font-style", "italic")),
        "strikethrough": (() => toggleStyle("text-decoration-line", "line-through")),
        "underline": (() => toggleStyle("text-decoration-line", "underline")),
        "header-2": (() => toggleStyle("H2"))
    }
};
let ICON_URL = new URL("https://unpkg.com/@phosphor-icons/web").href;
let CSS_URL = new URL("./editor.css", import.meta.url).href;


/**
 * Initialize external libraries
 */
function initializeDependencies(){
    // Check if icon library has been loaded
    if (!document.querySelector(`script[src='${ICON_URL}']`)){
        // Load icon library
        let script = document.createElement("script");
        script.src = ICON_URL;
        document.head.appendChild(script);
    }
    // Check if css has been loaded
    if (window.getComputedStyle(document.body).getPropertyValue("--editor") != "1"){
        // Load CSS library
        let link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = CSS_URL;
        document.head.appendChild(link);
    }
}
if (document.readyState == "interactive"){
    initializeDependencies()
} else {
    document.addEventListener("DOMContentLoaded", initializeDependencies);
}

/**
 * Check object equality
 *
 * @param {object} x
 * @param {object} y
 * @return {boolean}
 */
function objectEquals(x, y) {
    // Taken from https://stackoverflow.com/a/16788517/21322342

    if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
    // after this just checking type of one would be enough
    if (x.constructor !== y.constructor) { return false; }
    // if they are functions, they should exactly refer to same one (because of closures)
    if (x instanceof Function) { return x === y; }
    // if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
    if (x instanceof RegExp) { return x === y; }
    if (x === y || x.valueOf() === y.valueOf()) { return true; }
    if (Array.isArray(x) && x.length !== y.length) { return false; }

    // if they are dates, they must had equal valueOf
    if (x instanceof Date) { return false; }

    // if they are strictly equal, they both need to be object at least
    if (!(x instanceof Object)) { return false; }
    if (!(y instanceof Object)) { return false; }

    // recursive object equality check
    var p = Object.keys(x);
    return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1; }) &&
        p.every(function (i) { return objectEquals(x[i], y[i]); });
}
// TODO: Use a dataclass for this
/**
 * Create options from default parameters
 * 
 * @typedef {object} Option
 * 
 * @param {object} [{tagName = null, props = {}, name = null, value = null}={}] - The default parameters
 * @return {Option} The created object
 */
function Option({tagName = null, props = {}, name = null, value = null} = {}){
    return {
        tagName: tagName,
        props : props,
        css: {
            name: name,
            value: value
        },
    };
}
/**
 * Turn an option into an html element
 *
 * @param {Option} option - The option to compute
 * @param {string} [text] - Optional text
 * @return {HTMLElement} The computed element
 */
function computeOption(option, text){
    let element;
    if (option.tagName){ // If style
        element = document.createElement(option.tagName);
    } else {
        element = document.createElement("SPAN");
        element.style[option.css.name] = option.css.value;
    }
    if (text){
        element.textContent = text;
    }
    return element;
}

/**
 * Generate a list of options from an element
 *
 * @param {HTMLElement} child - An element to generate options from
 * @return {Array.<Option>} A list of options
 */
function createOptionsFromChild(child){
    let ret = [];
    let curr = child;

    while (curr){
        ret.push(curr)
        curr = curr.firstElementChild;
    }
    ret = ret.map(x => {
        // Properties would have to be changed here
        if (x.style.length > 0){
            // TODO: Won't work for when there are more than one styles
            // Get the first style, then get the value for it
            return Option({ name: x.style[0], value: x.style[x.style[0]]});
        }
        return Option({tagName: x.tagName});
    });
    return ret;
}
/**
 * Toggle an option
 *
 * @param {Array.<Option>} childOptions - An array of options
 * @param {Option} currOption - The option to toggle
 * @return {Array.<Option>}
 */
function toggleOption(childOptions, currOption){

    // Get a copy of the array
    if (childOptions.some(x => objectEquals(x, currOption))){
        childOptions = childOptions.filter(x => !objectEquals(x, currOption));
    } else {
        childOptions.push(currOption);
    }
    return childOptions;

    // if the option is inside childOptions
    //  remove it
    // else
    //  add it
}
/**
 * Recursively compute every option from an array
 *
 * @param {Array.<Option>} options - A list of options
 * @param {string} text - Text of element
 * @return {HTMLElement} 
 */
function computeAll(options, text){
    // [a, b, c] -> a.b.c
    if (options.length > 0){
        let ret = computeOption(options[0]);
        let curr = ret;
        let elem;

        for (let option of options.slice(1)){ // We have already computed the first item
            elem = computeOption(option);
            curr = curr.appendChild(elem);    
        }
        curr.appendChild(document.createTextNode(text));
        return ret;

    }
    return computeOption(Option({tagName: "SPAN"}), text);
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
function toggleStyle(){
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
        currOption = Option({tagName: arguments[0]})
    } else if (arguments.length == 2){
        currOption = Option({ name: arguments[0], value: arguments[1] })
    } else {
        throw new Error("Need 1 or 2 arguments");
    }
    
    let range = window.getSelection().getRangeAt(0);   
    let contents = range.extractContents();
    let newContents;

    if (contents.firstElementChild){
        let childOptions = createOptionsFromChild(contents.firstElementChild);
        let filteredChildren = toggleOption(childOptions, currOption);
        newContents = computeAll(filteredChildren, contents.textContent);

    } else {
        newContents = computeOption(currOption, contents.textContent);
    }
    
    range.insertNode(newContents);
}

export default class Editor {
    constructor(element, options){
        this.element = element;
        this.isMenuShown = false;

        this.menu = document.querySelector("#editor-context-menu") || null;
        // Check if context menu has been loaded
        if (!document.querySelector("#editor-context-menu")){
            // Load context menu
            let div = document.createElement("div");
            div.innerHTML = menuOptions.html;
            // Hide the element to prevent DOM flashes
            div.firstElementChild.style.visibility = "hidden";
            // Menu is all the way from the top
            this.menu = document.body.appendChild(div.firstElementChild);
        }
        // Add event listeners to context menu
        for (let type of Object.keys(menuOptions.listeners)){
            document.querySelector(`#editor-context-menu.button[name='${type}']`).addEventListener("click", menuOptions.listeners[type]);
        }
        // Initialize the context menu
        this._initialize(options);
    }
    /**
     * Add context menu triggers to an element
     *
     * TODO: Fix jsdoc
     */
    _initialize({useTab = true, dedent = true} = {}){
        let repositionMenu = (cords) => (this.menu.style.top = `calc(${cords.top}px - 2.3em)`) && (this.menu.style.left = `calc(${cords.left}px + (${cords.width}px * 0.5))`);

        document.addEventListener("mouseup", e => {
            let selection = window.getSelection();
            if (selection != ""){
                let range = selection.getRangeAt(0);
                // Make sure that the range is inside the element, this is cleaner than having the event listener on document
                if (this.element.contains(range.commonAncestorContainer)){
                    this.menu.style.visibility = "visible";
                    this.isMenuShown = true;

                    let cords = range.getBoundingClientRect();
                    repositionMenu(cords);
                }
            }
        });
        document.addEventListener("mousedown", e => {
            // Only close the menu if it is shown and we aren't hovering over the menu
            if (this.isMenuShown && !this.menu.contains(document.elementFromPoint(e.clientX, e.clientY))){
                this.isMenuShown = false;
                this.menu.style.visibility = "hidden";
            }
        });
        window.addEventListener("resize", () => {
            let selection = window.getSelection();
            if (selection != ""){
                repositionMenu(selection.getRangeAt(0).getBoundingClientRect());
            }
        });

        if (dedent){
            this.element.innerHTML = this.element.innerHTML.replaceAll("\n            ", "\n"); // TODO: Fix - wrong number of indentation
        }

        if (useTab){
            this.element.addEventListener("keydown", e => {
                // https://stackoverflow.com/a/32128448/21322342
                if (e.key == "Tab"){
                    e.preventDefault();

                    let sel = window.getSelection();
                    let range = sel.getRangeAt(0);

                    let tabNode = document.createTextNode("\t");
                    range.insertNode(tabNode);
            
                    range.setStartAfter(tabNode);
                    range.setEndAfter(tabNode); 
                    sel.removeRange(range);
                    sel.addRange(range);

                }
            });
        }
    }
}