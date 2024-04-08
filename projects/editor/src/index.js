import { Editor } from "./editor/editor.js";

let contents = btoa(`
This div is editable
Another line
This <e-italic>word</e-italic> is already italic
`);

document.addEventListener("DOMContentLoaded", () => {
    let editor = new Editor(document.querySelector("#editor"), {useTab: true});
    editor.load(contents);
});