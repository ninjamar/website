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
    [ ] TODO: Handle comment nodes?
    [ ] TODO: Context menu moves after using header
    [ ] TODO: Briefly show menu to allow icons to preload
    [ ] TODO: Big and small text
*/

window.Editor = (function(window){
    // Set options for the context menu
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
        // Set event listenrs based on the name attribute
        listeners: {
            "bold": (() => toggleStyle("B")),
            "italic": (() => toggleStyle("font-style", "italic")),
            "strikethrough": (() => toggleStyle("text-decoration-line", "line-through")),
            "underline": (() => toggleStyle("text-decoration-line", "underline")),
            "header-2": (() => toggleStyle("H2"))
        }
    };
    let currentScript = document.currentScript;
    let menu; // We set menu during initialization

    // Taken form https://stackoverflow.com/a/16788517/21322342
    function objectEquals(x, y) {
        'use strict';
    
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

    // Create options for each element
    function createOption({tagName = null, props = {}, name = null, value = null} = {}){
        return {
            tagName: tagName,
            props : props,
            css: {
                name: name,
                value: value
            },
        };
    }
    
    // Compute an option
    function getComputedOption(option, text){
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

    // Generate a list of options from an element
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
                return createOption({ name: x.style[0], value: x.style[x.style[0]]});
            }
            return createOption({tagName: x.tagName});
        });
        return ret;
    }

    // Toggle an option
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

    // Recursively compute every option from an array
    function computeAll(arr, text){
        // [a, b, c] -> a.b.c
        if (arr.length > 0){
            let ret = getComputedOption(arr[0]);
            let curr = ret;
            let elem;

            for (let option of arr.slice(1)){ // We have already computed the first item
                elem = getComputedOption(option);
                curr = curr.appendChild(elem);    
            }
            curr.appendChild(document.createTextNode(text));
            return ret;

        }
        return getComputedOption(createOption({tagName: "SPAN"}), text);
    }

    // Replacement for document exec command
    /* 
        if contents.firstElementChild

            For every child of contents.children[0]
                add element name to array

            If the current style isn't in this array, add it
            If current style is in this array, remove it
            Create a new element from this array
        else
            Create a new element with only style
    */

    // Toggle a style on an element
    function toggleStyle(){
        let currOption;
        if (arguments.length == 1){
            currOption = createOption({tagName: arguments[0]})
        } else if (arguments.length == 2){
            currOption = createOption({ name: arguments[0], value: arguments[1] })
        } else {
            throw new Error("Need 1 or 2 arguments");
        }
        
        let range = window.getSelection().getRangeAt(0);   
        let contents = range.extractContents();
        let newContents;
        
        if (contents.firstElementChild){
            let childOptions = createOptionsFromChild(contents.children[0]);
            let filteredChildren = toggleOption(childOptions, currOption);
            newContents = computeAll(filteredChildren, contents.textContent);

        } else {
            newContents = getComputedOption(currOption, contents.textContent);
        }
        
        range.insertNode(newContents);
    }

    // Add context menu triggers to an element
    function edit(element){
        let is_menu_shown = false;

        let repositionMenu = (cords) => (menu.style.top = `calc(${cords.top}px - 2.5em)`) && (menu.style.left = `calc(${cords.left}px + (${cords.width}px * 0.5))`);

        document.addEventListener("mouseup", e => {
            let selection = window.getSelection();
            if (selection != ""){

                let range = selection.getRangeAt(0);
                // Make sure that the range is inside the element, this is cleaner than having the event listener on document
                if (element.contains(range.commonAncestorContainer)){
                    // menu.classList.remove("editor-hidden");
                    menu.style.visibility = "visible";

                    is_menu_shown = true;
                    let cords = range.getBoundingClientRect();
                    repositionMenu(cords);
                }
            }
        });
        document.addEventListener("mousedown", e => {
            // Only close the menu if it is shown and we aren't hovering over the menu
            if (is_menu_shown && !menu.contains(document.elementFromPoint(e.clientX, e.clientY))){
                is_menu_shown = false;
                // menu.classList.add("editor-hidden");
                menu.style.visibility = "hidden";
            }
        });
        window.addEventListener("resize", () => {
            let selection = window.getSelection();
            if (selection != ""){
                repositionMenu(selection.getRangeAt(0).getBoundingClientRect());
            }
        });

    }
    
    // Initialize external libraries
    // Load icon library
    // Make sure css is loaded
    // Inject context menu onto page
    // Add onclick to element
    function initialize(){
        // File constants
        let ICON_URL = new URL("https://unpkg.com/@phosphor-icons/web").href;
        let CSS_URL = new URL("./editor.css", currentScript.src).href;

        // Check if icon library has been loaded
        if (!document.querySelector(`script[src='${ICON_URL}']`)){
            let script = document.createElement("script");
            script.src = ICON_URL;
            document.head.appendChild(script);
        }
        // Check if css has been loaded
        if (window.getComputedStyle(document.body).getPropertyValue("--editor") != "1"){
            let link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = CSS_URL;
            document.head.appendChild(link);
        }
        // Check if context menu has been loaded
        if (!document.querySelector("#editor-context-menu")){
            let div = document.createElement("div");
            div.innerHTML = menuOptions.html;
            // Hide the element to prevent DOM flashes
            div.firstElementChild.style.visibility = "hidden";
            // Menu is all the way from the top
            menu = document.body.appendChild(div.firstElementChild);
        }
        // Add event listenrs to context menu
        for (let type of Object.keys(menuOptions.listeners)){
            document.querySelector(`#editor-context-menu > ul > li > button[name='${type}']`).addEventListener("click", menuOptions.listeners[type]);
        }
    }

    document.addEventListener("DOMContentLoaded", initialize);

    return edit;
})(window);