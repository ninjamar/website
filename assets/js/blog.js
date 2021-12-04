(() => {
    var css_elem = document.createElement('link');
    css_elem.rel = 'stylesheet';
    css_elem.href = '/assets/css/blog.css';
    document.head.appendChild(css_elem);

    tags = document.querySelectorAll('.post > pre');
    for (var i = 0;i < tags.length;i++){
        tags[i].innerHTML = '<div class = "pre_wrapper">'+tags[i].innerHTML+'</div>';
    }
})()

// MAKE THIS RUN AFTER THE DOM IS LOADED NOT BEFORE BECAUSE THERE ARE NO ELEMENTD