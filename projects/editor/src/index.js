import { Editor } from "./editor/editor.js";
import dedent from 'https://cdn.jsdelivr.net/npm/dedent@1.5.3/+esm';

let contents = dedent`
    This div is editable
    Another line
    This <span style="font-style: italic;">word</span> is already italic
`;
document.addEventListener("DOMContentLoaded", () => {
    let editorElement = document.querySelector("#editor");
    editorElement.innerHTML = contents;

    let editor = new Editor(editorElement, {useTab: true});
    // editor.load(btoa(contents));
});