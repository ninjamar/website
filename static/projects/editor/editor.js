"use strict";

/* 
    Text Editor
    Copyright (c) 2023 ninjamar

    TODO: Allow properties
    TODO: Allow links
    TODO: Don't use lucide icons
    TODO: Make the selection menu pretty
    TODO: Filter based on uniqueness (only on header tag)
    TODO: Organize this file
*/

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
function applyStyle(){
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

function edit(menu, element){
    let is_menu_shown = false;

    let repositionMenu = (cords) => (menu.style.top = `calc(${cords.top}px - 2em)`) && (menu.style.left = `calc(${cords.left}px + (${cords.width}px * 0.5))`);

    element.addEventListener("mouseup", e => {
        let selection = window.getSelection();
        if (selection != ""){
            menu.classList.remove("hidden");
            is_menu_shown = true;
            let cords = selection.getRangeAt(0).getBoundingClientRect();
            repositionMenu(cords);
        }
    });
    element.addEventListener("mousedown", e => {
        if (is_menu_shown && document.elementFromPoint(e.clientX, e.clientY) != menu){
            is_menu_shown = false;
            menu.classList.add("hidden");
        }
    });
    window.addEventListener("resize", () => {
        let selection = window.getSelection();
        if (selection != ""){
            repositionMenu(selection.getRangeAt(0).getBoundingClientRect());
        }
    });

}

document.addEventListener("DOMContentLoaded", function(event){
    edit(document.querySelector("#context-menu"), document.querySelector("#editor"));
})