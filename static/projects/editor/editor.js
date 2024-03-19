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
*/
function applyStyle(style){     
    let range = window.getSelection().getRangeAt(0);   
    let contents = range.extractContents();
    let newContents;

    if (contents.firstElementChild){
        let arr = [];
        let current_element = contents.children[0];
        while (current_element){
            arr.push(current_element.tagName);
            current_element = current_element.firstElementChild;
        }

        if (arr.includes(style)){
            arr = arr.filter(x => x != style);
        } else {
            arr.push(style);
        }

        // If multiple children
        if (arr.length >= 1){
            newContents = document.createElement(arr[0]);
            let curr = newContents;
            for (let name of arr.slice(1)){
                curr = curr.appendChild(document.createElement(name));
            }
            curr.appendChild(document.createTextNode(contents.textContent));

        } else {
            newContents = document.createTextNode(contents.textContent);
        }

    } else {
        newContents = document.createElement(style);
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
    elements.addEventListener("mousedown", e => {
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