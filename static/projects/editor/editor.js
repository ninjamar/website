"use strict";

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

/* 
    TODO: Allow options
    Don't use lucide icons
*/
const arrequal = (array1, array2) => array1.length === array2.length && array1.every((value, index) => value === array2[index]);
const has = (array, value) => array.some(x=>arrequal(x, value));


function applyStyle(rule, value){

    let is_tag = arguments.length == 1;

    let range = window.getSelection().getRangeAt(0);   
    let contents = range.extractContents();
    let newContents;

    if (contents.firstElementChild){
        let arr = [];
        let current_element = contents.children[0];
        let name;
        while (current_element){
            name = current_element.style[0];
            arr.push([name, current_element.style[name]]); // name, style
            current_element = current_element.firstElementChild;
        }

        // Make unique of: current style - eg remove all with style

        // arr = arr.filter(x => x[0] != rule && !arrequal(x, [rule, value]));
        // If the array has our rule
        //  Remove it
        // else
        //  Add our rule

        if (has(arr, [rule, value])){
            arr = arr.filter(x => !arrequal(x, [rule, value]));
        } else {
            arr.push([rule, value]);
        }
        console.log(arr);

        // If multiple children
        if (arr.length >= 1){
            newContents = document.createElement("SPAN");
            if (arr[0]){
                newContents.style[arr[0][0]] = arr[0][1];
            }

            let curr = newContents;
            let elem;
            for (let pair of arr.slice(1)){
                elem = document.createElement("SPAN");
                curr.style[pair[0]] = pair[1];
                curr = curr.appendChild(elem);
            }

            curr.appendChild(document.createTextNode(contents.textContent));
        } else {
            newContents = document.createTextNode(contents.textContent);
        }

    } else {
        // This works
        newContents = document.createElement("SPAN");
        newContents.style[rule] = value;
        newContents.textContent = contents.textContent;
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