import { Editor } from "./editor/editor.js";
import dedent from 'https://cdn.jsdelivr.net/npm/dedent@1.5.3/+esm';

/*
let contents = dedent`
    This div is editable
    Another line
    This <span style="font-style: italic;">word</span> is already italic
`;
*/
let contents = dedent`
    This is a text editor built using JavaScript.
    Simply select some text, and the toolbar will appear.
    The column on the right is a live updating HTML preview

    <a href="https://github.com/ninjamar/editor">GitHub</a>
    <a href="https://ninjamar.dev/projects/editor">Live demo</a>
`;

document.addEventListener("DOMContentLoaded", () => {
    let editor = document.querySelector("#editor");
    let output = document.querySelector("#output");
    let copyHTML = document.querySelector("#copyHTML");

    editor.innerHTML = contents;
    let instance = new Editor(editor, {useTab: true});

    output.textContent = instance.export();

    let config = {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true
    };
    // Update output whenever the editor changes
    let observer = new MutationObserver((mutation, obs) => {
        // To prevent an infinite loop, detach the observer, modify the DOM, and then reobserve
        obs.disconnect();
        output.textContent = instance.export();
        obs.observe(document.body, config);
    });

    observer.observe(document.body, config);

    copyHTML.addEventListener("click", () => {
        let parser = new DOMParser().parseFromString(output.innerHTML, 'text/html');
        navigator.clipboard.writeText(parser.documentElement.textContent)
    });
});