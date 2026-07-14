document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Loading screen ----------
       Fixed-duration brand moment, deliberately NOT tied to window.load: this
       page pulls fonts/Three.js/images from external CDNs, and a visitor on a
       slow connection would otherwise be stuck behind the overlay for however
       long every last one of those takes. */
    var loadingScreen = document.getElementById('loadingScreen');
    var loadingBarFill = document.getElementById('loadingBarFill');
    var loadingPercent = document.getElementById('loadingPercent');
    var progress = 0;

    var loadingTimer = setInterval(function () {
        progress += Math.random() * 18;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingTimer);
            setTimeout(function () { loadingScreen.classList.add('hide'); }, 250);
        }
        loadingBarFill.style.width = progress + '%';
        loadingPercent.textContent = Math.floor(progress) + '%';
    }, 140);

    /* ---------- Header solid on scroll ---------- */
    var header = document.getElementById('siteHeader');
    function updateHeader() {
        header.classList.toggle('solid', window.scrollY > 60);
    }
    window.addEventListener('scroll', updateHeader);
    updateHeader();

    /* ---------- Mobile nav ---------- */
    var navToggle = document.getElementById('navToggle');
    var navMenu = document.getElementById('navMenu');
    navToggle.addEventListener('click', function () {
        var isOpen = navMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen);
    });
    navMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () { navMenu.classList.remove('open'); });
    });

    /* ---------- Scroll reveal ---------- */
    var revealEls = document.querySelectorAll('.reveal');
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealEls.forEach(function (el) { observer.observe(el); });

    /* ---------- Go to top ---------- */
    var gotoTop = document.getElementById('gotoTop');
    window.addEventListener('scroll', function () {
        gotoTop.classList.toggle('show', window.scrollY > 700);
    });
    gotoTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

});
