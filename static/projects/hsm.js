/*
    Copyright (c) 2023 ninjamar
    https://github.com/ninjamar/hsm
*/


window.hsm = {components: []};
const interleave = (a, b) => a.reduce((arr, v, i) => arr.concat(v, b[i]), []).filter((x) => x  != undefined);
export default class Component extends HTMLElement {
    hsm = {
        fns: [],
    };
    constructor(){
        super();
    }
    connectedCallback(){
        if (this.parentNode instanceof ShadowRoot){
            // Normal instantiation
            this.hsm.id = window.hsm.components.length;
            window.hsm.components.push(this);
            this.id = "root";

            //this.hsm.properties = Object.fromEntries(Array.from(this.attributes).map(x => [x.nodeName, x.nodeValue]));
            this.append(...this.render());

            let sheet = new CSSStyleSheet();
            sheet.replaceSync(this.getstyle());
            this.parentNode.adoptedStyleSheets.push(sheet);

            this.onmount();
        } else {
            // Move element into shadow root
            // This if/else statement is for clarity of code
            let div = document.createElement("div");
            this.parentNode.replaceChild(div, this); // Not append
            div.attachShadow({mode: "open"});
            div.shadowRoot.appendChild(this);
        }
    }
    css(style, ...f){
        // Check if CSS is string
        if (typeof(style[0]) == "string"){
            return interleave(style, f).join("");
        }
        // Otherwise assume the CSS to be an object
        // For each outer key, return key {inner}
        return Object.entries(style).map(([k, v]) => `${k}{${
            // Return inner formatted as css
            Object.entries(v).map(([k, v]) => `${k}:${v}`).join(";")
        }}`).join("");
    }
    html(code, ...fn){
        // Check if f is a function
        fn = fn.map((x, i) => (typeof(x) == "function") ? 
            [
                // This allows us to run perform multiple expressions before returning
                this.hsm.fns.push(x),
                // TODO: Virtual dom should make window.hsm smaller and more efficient by deleting unused items
                // We could use use below instead
                // `((c) => c[${this.hsmid}].fns[${i}].bind(c[${this.hsmid}])(event))(window.hsm.components)`
                // `(function (c,d,i){c[d].fns[i].bind(c[d])(event)})(window.hsm.components,${this.hsmid}, ${i})`,
                `((c=window.hsm.components)=>c[${this.hsm.id}].hsm.fns[${i}].bind(c[${this.hsm.id}])(event??0))()`,
            ][1] : x
        );
        let element = document.createElement("div");
        element.innerHTML = interleave(code, fn).join("");
        return element.children;
    }
    delete(){
        // Remove all references to component
        window.hsm.components = window.hsm.components.map((x) => x.hsm.id != this.hsmid ? x : {hsmid: -1});
        this.remove();
    }
    render(){}
    onmount(args){}
    getstyle(){}
}