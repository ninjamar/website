/* 
    TODO
        [x] 1. Better colors
        [x] 2. New note button
        [ ] 3. Titles
        [ ] 4. Collapseable notes
        [ ] 5. Handle tab character
        [x] 6. Move element into focus on click - change z-index
        [ ] 7. Fix URL's in text
*/
import Component from "./hsm.js";

class Note extends Component {
    urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    get content(){
        console.log("getting")
        return this.querySelector("#note-inner-content").innerHTML
    }
    set content(value){
        console.log("setting");
        return this.querySelector("#note-inner-content").innerHTML = value;
    }
    cacheValue = ""
    getstyle(){
        return this.css({
            "#note-draggable": {
                /*padding: 10px; */
                "padding-left": "10px",
                "padding-right": "10px",
                "padding-bottom": "10px",
                "font-family": "Consolas, Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace, serif"
            },
            "#note-content": {
                "color": "#4e4e4d"
            },
            "#note-inner-content": {
                "outline": "0px solid transparent",
                "line-height": "1.35px"
            },
            "note-toolbar": {
                "height": "10px"
            },
            "#root": {
                "position": "absolute",
                "resize": "both",
                "overflow": "hidden",
                "border-radius": "10px",
                "background-color": "#b9b8b7"
            }
        });
    }
    render(){
        return this.html`
            <div class="note-toolbar">
                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" onclick="${this.delete}"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:#4e4e4d}</style><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/></svg>
            </div>
            <div id="note-draggable">
                <div id="note-content">
                    <pre><code 
                        id="note-inner-content" 
                        contenteditable="true" 
                        ondblclick="${this.doubleClickHandler}" 
                        oninput="${this.inputUpdateHandler}">I'm draggable</code></pre>
                </div>
            </div>
        `;
    }
    delete(){
        /* Make sure that deletion is saved */
        super.delete();
        updateStorage();
    }
    inputUpdateHandler(event){
        if (event.data == "THIS SHOULDN'T BE TRIGGERED"){
            let q = this.querySelector("#note-inner-content");
            q.innerHTML = q.innerHTML.replace(this.urlRegex, '<a href="$1">$1</a>');
            // q.selectionStart = q.selectionEnd = (q.value || {length: 0}).value;
            // https://stackoverflow.com/a/3866442/21322342
            let range = document.createRange();//Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(q);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            let selection = window.getSelection();//get the selection object (allows you to change selection)
            selection.removeAllRanges();//remove any selections already made
            selection.addRange(range);//make the range you have just created the visible selection
            return updateStorage();
        }
        this.cacheValue += event.data;
    }
    doubleClickHandler(event){
        let elem = this.parentNode.elementFromPoint(event.clientX, event.clientY);
        if (elem.nodeName == "A"){
            window.open(elem.href, '_blank').focus();
        }
    }
    changeZIndexHandler(event){
        window.hsm.components.forEach((x) => {
            if (x instanceof Note){
                x.style.zIndex = 0;
            };
        });
        this.style.zIndex = 1;
    }
    onmount(){
        this.addEventListener("click", this.changeZIndexHandler);
        this.addEventListener("mousedown", this.changeZIndexHandler);
    }
}
class NewNoteButton extends Component {
    getstyle(){
        return this.css({
            "#root": {
                "position": "fixed",
                "top": "90%",
                "left": "1%",
            }
        });
    }
    spawn(){
        let note = document.createElement("note-elem");
        document.querySelector("#app").appendChild(note);
        draggable(note);
        updateStorage();
    }
    render(){
        return this.html`
            <svg onclick="${this.spawn}" xmlns="http://www.w3.org/2000/svg" height="4em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:#4e4e4d}</style><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>
        `;
    }
}

function draggable(elem){
    let mouseX = 0;
    let mouseY = 0;
    
    const mouseDownHandler = (e) => {
        // Get current position of mouse
        mouseX = e.clientX;
        mouseY = e.clientY;

        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);
    }
    const mouseMoveHandler = (e) => {
        elem.style.top = `${elem.offsetTop + (e.clientY - mouseY)}px`;
        elem.style.left = `${elem.offsetLeft + (e.clientX - mouseX)}px`;

        mouseX = e.clientX;
        mouseY = e.clientY;
    }
    const mouseUpHandler = (e) => {
        updateStorage();
        document.removeEventListener("mousemove", mouseMoveHandler);
        document.removeEventListener("mouseup", mouseUpHandler);
    }
    elem.children[0].addEventListener("mousedown", mouseDownHandler);
}
var prevSave = [];
function updateStorage(){
    let components = window.hsm.components.filter((x) => (x.hsm.id != -1) && (x instanceof Note));
    let save = [];
    components.forEach((x, i) => {
        save.push([
            x.querySelector("#note-inner-content").innerText, 
            x.style.top || 0, 
            x.style.left || 0,
            x.style.width || "auto",
            x.style.height || "auto"
        ]);
    });
    if (JSON.stringify(prevSave) != JSON.stringify(save)){
        localStorage.setItem("save", JSON.stringify(save));
    }
    prevSave = save;
    
}
document.addEventListener("DOMContentLoaded", (e) => {
    customElements.define("note-elem", Note);
    customElements.define("new-note", NewNoteButton);
    let save = localStorage.getItem("save");
    if (save){
        JSON.parse(save).forEach(([text, top, left, width, height], i) => {
            let note = document.createElement("note-elem");
            document.querySelector("#app").appendChild(note);

            let content = note.querySelector("#note-inner-content");

            content.innerText = text;
            content.dispatchEvent(new Event("input"));
            //note.inputUpdateHandler({data: " "}); // Make sure link is clickable on load
            note.style.top = top;
            note.style.left = left;
            note.style.width = width || "auto";
            note.style.height = height || "auto";
            draggable(note);
        });
    } else {
        let initial = document.createElement("note-elem");
        document.querySelector("#app").appendChild(initial);
        draggable(initial);
    }
    document.querySelector("#app").appendChild(document.createElement("new-note"));
    // TODO: Why does this fix the saving bug?
    // Saving of item position is broken; on second reload, it sometimes breaks
    updateStorage();
    setInterval(updateStorage, 1500);
});