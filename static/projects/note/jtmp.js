window.q = document.querySelector.bind(document);

var jtmp = {};
jtmp.templates = {};

document.addEventListener("DOMContentLoaded", (event) => {
    let templates = document.getElementById("templates").children;
    for (let template of templates){
        let identifier = template.classList[0];
        jtmp.templates[identifier] = {};
        jtmp.templates[identifier].constructor = template;
        jtmp.templates[identifier].instances = Array.from(q("." + identifier));
    }
});

let _render = function(template, ctx){
    let elem = document.createElement("div");
    elem.innerHTML = nunjucks.renderString(String(template.innerHTML), ctx);
    // elem.classList = template.classList;
    Array.from(template.attributes).map(x => elem.setAttribute(x.name, x.value));

    jtmp.templates[template.classList[0]].instances.push(elem);
    
    return elem;
}
jtmp.render = function(tname, ctx){
    return _render(jtmp.templates[tname].constructor, ctx)
}
export default jtmp;