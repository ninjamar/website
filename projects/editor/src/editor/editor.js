/* 
    Text Editor
    Copyright (c) 2024 ninjamar
    https://github.com/ninjamar/editor
*/
import { toggleStyle, styles,  styleAction, ElementOptions, createOptionsFromElement, extractGreatestParent, removeStyle } from "./style.js";

// Set options for the context menu
const menuOptions = {
    html: `
        <div id="editor-context-menu">
            <ul>
                <li>
                    <button name="BOLD">
                        <i class="ph ph-text-b"></i>
                    </button>
                </li>
                <li>
                    <button name="ITALIC">
                        <i class="ph ph-text-italic"></i>
                    </button>
                </li>
                <li>
                    <button name="STRIKETHROUGH">
                        <i class="ph ph-text-strikethrough"></i>
                    </button>
                </li>
                <li>
                    <button name="HEADER2">
                        <i class="ph ph-text-h-two"></i>
                    </button>
                </li>
                <li>
                    <button name="LINK">
                        <i class="ph ph-link"></i>
                    </button>
                </li>
                <li>
                    <button name="LEFT">
                        <i class="ph ph-text-align-left"></i>
                    </button>
                </li>
                <li>
                    <button name="CENTER">
                        <i class="ph ph-text-align-center"></i>
                    </button>
                </li>
            </ul>
        </div>
    `,
    // Set event listeners based on the name attribute
    listeners: {
        "BOLD": (() => toggleStyle(styles.BOLD)),
        "ITALIC": (() => toggleStyle(styles.ITALIC)),
        "STRIKETHROUGH": (() => toggleStyle(styles.STRIKETHROUGH)),
        "HEADER2": (() => toggleStyle(styles.HEADER2)),
        "LINK": (() => {
            /*
                A tags have special behavior
                When an A tag gets added, it has a required href
                When the A tag gets toggled, it should remove all A tags, regardless of href
                Also, only prompt for url if the A tag is going to be added
            */
            styleAction(
                null,
                null, // Placeholder option, doesn't get used
                window.getSelection().getRangeAt(0), // Selection
                (childOptions, currOption) => { // Callback when there are existing styles
                    if (childOptions.some(x => x.tagName == "A")){ // If any of the existing styles are A tags
                        return childOptions.filter(x => x.tagName != "A"); // Then remove all A tags
                    } else { // Otherwise add A tag
                        let url = prompt("URL?");
                        if (url){ // Make sure prompt hasn't been cancelled
                            childOptions.push(new ElementOptions("A", {"href": url}));
                        }
                        return childOptions;
                    }
                },
                (option, contents) => { // Callback when there isn't any existing styling
                    let url = prompt("URL?");
                    if (url){ // Make sure prompt hasn't been cancelled
                        return new ElementOptions("A", {"href": url}).compute(contents.textContent);
                    } else {
                        return document.createTextNode(contents.textContent);
                    }
                },
                (appliedStyles) => appliedStyles.some(x => x instanceof HTMLElement && x.tagName == "A"),
                false
            );
        }),
        "LEFT": () => removeStyle(styles.CENTER), // remove style center
        "CENTER": () => toggleStyle(styles.CENTER)
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

// Initialize dependencies once DOM has been loaded
if (document.readyState == "interactive" || document.readyState == "complete"){
    initializeDependencies()
} else {
    document.addEventListener("DOMContentLoaded", initializeDependencies);
}

/**
 * The Editor
 *
 * @class Editor
 */
export class Editor {
    /**
     * Creates an instance of Editor.
     *
     * @constructor
     * @param {HTMLElement} element - The element to put the editor on
     * @param {*} [param0={}] - Options
     * @param {*} [param0.useTab=true] - Whether tabs should be handled
     */
    constructor(element, {useTab = true} = {}){
        this.element = element;
        this.element.classList.add("editor"); // Add the editor class for identification

        /* Add inline styling */
        this.element.style.whiteSpace = "pre-wrap";
        this.element.style.cursor = "text";

        this.useTab = useTab;
        this.isMenuShown = false;

        // Initialize the context menu
        this.initializeContextMenu();
        this.initialize();
    }

    
    /**
     * Initialize elements
     */
    initialize(){
        if (this.useTab){
            this.element.addEventListener("keydown", (event) => {
                // https://stackoverflow.com/a/32128448/21322342
                if (event.key == "Tab"){
                    event.preventDefault();

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
        
        this.element.addEventListener("keydown", (event) => {
            // https://stackoverflow.com/a/50603191/21322342

            let nodes = Array.from(this.element.childNodes).filter(x => x.data != ""); // Sometimes there are empty nodes
            if (nodes.length > 0){     
                if (nodes.at(-1).nodeType != Node.TEXT_NODE){
                    this.element.appendChild(document.createTextNode("\uFEFF"));
                }
                if (nodes.at(0).nodeType != Node.TEXT_NODE){
                    this.element.prepend(document.createTextNode("\uFEFF"));
                }
            }
        });
        
        if (this.useCopy){
            this.element.addEventListener("copy", (event) => {
                // Don't automatically copy
                event.preventDefault();
                // Get the range
                let range = window.getSelection().getRangeAt(0);
                // Extract greatest parent
                let parent = extractGreatestParent(range);
                // Create a wrapper, since DocumentFragment doesn't have innerHTML
                let wrapper = document.createElement("div");
                // Add a copy of the extracted contents to wrapper
                wrapper.appendChild(parent.cloneNode(true));
                // Copy the wrapper's innerHTML
                event.clipboardData.setData("text/html", wrapper.innerHTML)
                event.clipboardData.setData("text/plain", wrapper.textContent)
                // Replace the parent
                range.insertNode(parent)
            });
        }
    }

    /**
     * Initialize context menus
     *
     */
    initializeContextMenu(){
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
            let item = this.menu.querySelector(`[name='${type}']`);
            item.addEventListener("click", () => {
                // Call toggleStyle, then update menu
                menuOptions.listeners[type]();
                item.parentElement.classList.toggle("editor-context-menu-active");
            });
        }

        // Function to reposition menu
        const repositionMenu = (cords) => (this.menu.style.top = `calc(${cords.top}px - 2.3em)`) && (this.menu.style.left = `calc(${cords.left}px + (${cords.width}px * 0.5))`);
        // Make context menu hover above text
        document.addEventListener("mouseup", e => {
            let selection = window.getSelection();
            if (selection != ""){
                let range = selection.getRangeAt(0);
                // Make sure that the range is inside the element, this is cleaner than having the event listener on document
                // console.log(!this.menu.contains(document.elementFromPoint(e.clientX, e.clientY)))
                if (this.element.contains(range.commonAncestorContainer) && !this.menu.contains(document.elementFromPoint(e.clientX, e.clientY))){
                    this.menu.style.visibility = "visible";
                    this.isMenuShown = true;
                    this.loadMenuStyling(range);
                    window.requestAnimationFrame(() => repositionMenu(range.getBoundingClientRect()));
                }
            }
        });

        // Mouse down for selectiojn
        document.addEventListener("mousedown", e => {
            // Only close the menu if it is shown and we aren't hovering over the menu
            if (this.isMenuShown && !this.menu.contains(document.elementFromPoint(e.clientX, e.clientY))){
                this.isMenuShown = false;
                this.menu.style.visibility = "hidden";
            }
        });

        // Move the menu on resizesss
        window.addEventListener("resize", () => {
            let selection = window.getSelection();
            if (selection != ""){
                window.requestAnimationFrame(() => repositionMenu(selection.getRangeAt(0).getBoundingClientRect()));
            }
        });
    }

    
    /**
     * Load styling for menu
     *
     * @param {Range} range - Range of selection
     */
    loadMenuStyling(range){
        let items = Array.from(this.menu.querySelectorAll("ul > li"));
        for (let item of items){
            item.classList.remove("editor-context-menu-active");
        }
        let parent = extractGreatestParent(range);
        if (parent.firstElementChild){
            let options = createOptionsFromElement(parent.firstElementChild);
            for (let option of options){
                // Special handling for A tags
                if (option.tagName == "A"){
                    this.menu.querySelector("[name='LINK']").parentElement.classList.add("editor-context-menu-active");
                } else {
                    // Iterate over every tag in the menu bar
                    for (let key of Object.keys(menuOptions.listeners)){
                        // Check equality with styles[key]
                        // Use optional chaining
                        if (styles[key]?.applied.equals(option)){
                            this.menu.querySelector(`[name='${key}']`).parentElement.classList.add("editor-context-menu-active");
                        }
                    }
                }
            }
        }
        // Add parent back (due to extractGreatestParent)
        range.insertNode(parent);
    }

    /**
     * Export this.element as a string
     *
     * @returns {string}
     */
    export(){
        // Inline styles are from constructor
        return `<div style="white-space: pre-wrap; cursor: text;">${this.element.innerHTML}</div>`
    }
}