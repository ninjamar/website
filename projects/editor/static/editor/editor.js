/* 
    Text Editor
    Copyright (c) 2024 ninjamar
    https://github.com/ninjamar/editor
*/
import { toggleStyle } from "./style.js";

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

class Editor {
    constructor(element, {useTab = true} = {}){
        this.element = element;
        this.element.classList.add("editor"); // Add the editor class for identification

        this.useTab = useTab;
        
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
            document.querySelector(`#editor-context-menu button[name='${type}']`).addEventListener("click", menuOptions.listeners[type]);
        }
        // Initialize the context menu
        this._initialize();
    }
    /**
     * Add context menu triggers to an element
     *
     * TODO: Fix jsdoc
     */
    _initialize(){
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

        if (this.useTab){
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

export { toggleStyle, Editor };