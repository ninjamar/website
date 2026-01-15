function main(){
    const grid = document.querySelector('.grid');
    const msnry = new Masonry(grid, {
        itemSelector: '.grid-item',
        columnWidth: '.grid-item',

        percentPosition: true
    });

    imagesLoaded(grid).on('progress', function() {
        msnry.layout();
    });
}

// document.addEventListener("DOMContentLoaded", main);