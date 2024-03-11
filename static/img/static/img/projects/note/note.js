/* import jtmp from "./jtmp.js"; */

var templates = {};
var instances = [];

function createTemplate(template){
    return function (data){
        // Create element
        let $elem = document.createElement("div");
        // Set inner html
        $elem.innerHTML = template.innerHTML;
        // Look for items to template
        let context = {};
        for (let $e of  $elem.querySelectorAll("[data-template]")){
            context[$e.getAttribute("data-template")] = $e;
        }

        // copy attributes
        Array.from(template.attributes).map(x => (x.name) != "id" ? $elem.setAttribute(x.name, x.value) : 0);
        // Template
        Object.entries(context).forEach(([key, $value]) => {
            $value.innerHTML = data[key];
        });
        return $elem;
    }
}
function newnote(event){
    let context = {
        body: document.querySelector("#new-note-body").innerHTML,
        title: new Date().toLocaleDateString(undefined, {month:"2-digit", day: "2-digit", year: "numeric", hour:"2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short"})
    };
    let $elem = templates.note(context);
    instances.push($elem);
    document.querySelector("#notes").appendChild($elem);
}
function updateStorage(){
    
}
document.addEventListener("DOMContentLoaded", (event) => {
    for (let $elem of document.getElementById("templates").children){
        templates[$elem.getAttribute("data-template-name")] = createTemplate($elem);
    }
    document.querySelector("#new-note-submit").addEventListener("click", newnote);
});