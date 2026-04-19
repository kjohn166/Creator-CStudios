(function () {
    const btn  = document.getElementById('nav-hamburger');
    const menu = document.getElementById('nav-menu');
    if (!btn || !menu) return;

    function close() {
        menu.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const open = menu.classList.toggle('open');
        btn.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', function (e) {
        if (!btn.contains(e.target) && !menu.contains(e.target)) close();
    });

    menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', close);
    });
})();
