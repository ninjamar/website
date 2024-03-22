"use strict";

/* 
    Text Editor
    Copyright (c) 2023 ninjamar

    [ ] TODO: Allow properties
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
        listeners: {
            "bold": (() => toggleStyle("B")),
            "italic": (() => toggleStyle("font-style", "italic")),
            "strikethrough": (() => toggleStyle("text-decoration-line", "line-through")),
            "underline": (() => toggleStyle("text-decoration-line", "underline")),
            "header-2": (() => toggleStyle("H2"))
        }
    };
    let menu; // We set menu during initialization

    // https://stackoverflow.com/a/16788517/21322342
    function objectEquals(e,n){"use strict";if(null==e||null==n)return e===n;if(e.constructor!==n.constructor)return!1;if(e instanceof Function)return e===n;if(e instanceof RegExp)return e===n;if(e===n||e.valueOf()===n.valueOf())return!0;if(Array.isArray(e)&&e.length!==n.length)return!1;if(e instanceof Date)return!1;if(!(e instanceof Object))return!1;if(!(n instanceof Object))return!1;var r=Object.keys(e);return Object.keys(n).every((function(e){return-1!==r.indexOf(e)}))&&r.every((function(r){return objectEquals(e[r],n[r])}))}

    // Support a tag in future (using props)
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
    function getComputedOption(opt, text){
        let e;
        if (opt.tagName){ // If style
            e = document.createElement(opt.tagName);
        } else {
            e = document.createElement("SPAN");
            e.style[opt.css.name] = opt.css.value;
        }
        if (text){
            e.textContent = text;
        }
        return e;
    }

    // TODO: This fails for strikethrugh
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
                return createOption({ name: x.style[0], value: x.style[x.style[0]]});
            }
            return createOption({tagName: x.tagName});
        });
        return ret;
    }

    // TODO: Comparison is totally broken (for strikethrough)
    function toggleOption(options_of_children, opt){

        // Get a copy of the array
        if (options_of_children.some(x => objectEquals(x, opt))){
            options_of_children = options_of_children.filter(x => !objectEquals(x, opt));
        } else {
            options_of_children.push(opt);
        }
        return options_of_children;

        // if the option is inside options_of_children
        //  remove it
        // else
        //  add it
    }

    function computeAll(arr, text){
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
    function toggleStyle(){
        let opt;
        if (arguments.length == 1){
            opt = createOption({tagName: arguments[0]})
        } else if (arguments.length == 2){
            opt = createOption({ name: arguments[0], value: arguments[1] })
        } else {
            throw new Error("Need 1 or 2 arguments");
        }
        
        let range = window.getSelection().getRangeAt(0);   
        let contents = range.extractContents();
        let newContents;
        
        if (contents.firstElementChild){
            let options_of_children = createOptionsFromChild(contents.children[0]);
            let filtered_children = toggleOption(options_of_children, opt);
            newContents = computeAll(filtered_children, contents.textContent);

        } else {
            newContents = getComputedOption(opt, contents.textContent);
        }
        
        range.insertNode(newContents);
    }

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
    
    // Load icon library
    // Make sure css is loaded
    // Inject context menu onto page
    // Add onclick to element
    let currentScript = document.currentScript;
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