import { Editor } from "./editor/editor.js";

document.addEventListener("DOMContentLoaded", () => {
    let editor = new Editor(document.querySelector("#editor"), {useTab: true});
});