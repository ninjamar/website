import { Editor } from "./editor/editor.js";

let contents = btoa(`
This div is editable
Another line
This <span style="font-style: italic;">word</span> is already italic
`);

document.addEventListener("DOMContentLoaded", () => {
    let editor = new Editor(document.querySelector("#editor"), {useTab: true});
    editor.load(contents);
});