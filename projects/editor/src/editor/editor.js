/* 
    Text Editor
    Copyright (c) 2024 ninjamar
    https://github.com/ninjamar/editor
*/
import { toggleStyle, styleAction, ElementOptions, extractGreatestParent } from "./style.js";

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
                <li>
                    <button name="link">
                        <i class="ph ph-link"></i>
                    </button>
                </li>
            </ul>
        </div>
    `,
    // Set event listeners based on the name attribute
    listeners: {
        "bold": (() => toggleStyle("B")),
        "italic": (() => toggleStyle("I")),
        "strikethrough": (() => toggleStyle("S")),
        "underline": (() => toggleStyle("U")),
        "header-2": (() => toggleStyle("H2")),
        "link": (() => {
            /*
                A tags have special behavior
                When an A tag gets added, it has a required href
                When the A tag gets toggled, it should remove all A tags, regardless of href
                Also, only prompt for url if the A tag is going to be added
            */
            styleAction(
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
                }
            );
        })
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
if (document.readyState == "interactive"){
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
     * @param {*} [param0.useContextMenu=true] - Is there a context menu?
     * @param {*} [param0.contextMenu="built-in"] - Contetxt menu options
     */
    constructor(element, {useTab = true, useContextMenu = true, useCopy = true, contextMenu = "built-in"} = {}){
        this.element = element;
        this.element.classList.add("editor"); // Add the editor class for identification

        this.useTab = useTab;
        this.useCopy = useCopy;
        this.isMenuShown = false;
        this.useContextMenu = useContextMenu;

        // Initialize the context menu
        if (this.useContextMenu){
            this.initializeContextMenu(contextMenu);
        }
        this.initialize();
    }

    
    /**
     * Initialize elements
     */
    initialize(){
        // Add handler for tabs
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
     * @param {string} [contextMenu="built-in"] - Custom context menu
     */
    initializeContextMenu(contextMenu = "built-in"){
        if (contextMenu == "built-in"){
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
        } else {
            this.menu = contextMenu;
        }
        // Add event listeners to context menu
        for (let type of Object.keys(menuOptions.listeners)){
            this.menu.querySelector(`[name='${type}']`).addEventListener("click", menuOptions.listeners[type]);
        }
        // Function to reposition menu
        let repositionMenu = (cords) => (this.menu.style.top = `calc(${cords.top}px - 2.3em)`) && (this.menu.style.left = `calc(${cords.left}px + (${cords.width}px * 0.5))`);
        // Make context menu hover above text
        if (contextMenu == "built-in"){
            document.addEventListener("mouseup", e => {
                let selection = window.getSelection();
                if (selection != ""){
                    let range = selection.getRangeAt(0);
                    // Make sure that the range is inside the element, this is cleaner than having the event listener on document
                    if (this.element.contains(range.commonAncestorContainer)){
                        this.menu.style.visibility = "visible";
                        this.isMenuShown = true;
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
    }
    
    /**
     * Save the state of the editor
     *
     * @returns {string} - The save
     */
    save(){
        return btoa(this.element.innerHTML);
    }
    
    /**
     * Load a save into the editor
     *
     * @param {string} data - The save
     */
    load(data){
        this.element.innerHTML = atob(data);
    }
}