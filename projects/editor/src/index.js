import { Editor } from "./editor/editor.js";

let contents = btoa(`
This div is editable
Another line
This <e-italic>word</e-italic> is already italic
`);

document.addEventListener("DOMContentLoaded", () => {
    let editorElement = document.querySelector("#editor");
    // editorElement.innerHTML = editorElement.innerHTML.replaceAll("\n            ", "\n"); // TODO: Fix - wrong number of indentation
    let editor = new Editor(editorElement, {useTab: true});
    editor.load(contents);
});