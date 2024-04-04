import { Editor } from "./editor/editor.js";

document.addEventListener("DOMContentLoaded", () => {
    let editorElement = document.querySelector("#editor");
    editorElement.innerHTML = editorElement.innerHTML.replaceAll("\n            ", "\n"); // TODO: Fix - wrong number of indentation
    let editor = new Editor(editorElement, {useTab: true});
});