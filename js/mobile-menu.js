document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const body = document.body;

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            if (navLinks) navLinks.classList.toggle('nav-active');
            if (mobileDrawer) mobileDrawer.classList.toggle('nav-active');
            hamburger.classList.toggle('toggle');
            
            // Optional: Prevent scrolling when menu is open
            if ((navLinks && navLinks.classList.contains('nav-active')) || 
                (mobileDrawer && mobileDrawer.classList.contains('nav-active'))) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = 'initial';
            }
        });

        const closeMenu = () => {
            if (navLinks) navLinks.classList.remove('nav-active');
            if (mobileDrawer) mobileDrawer.classList.remove('nav-active');
            hamburger.classList.remove('toggle');
            body.style.overflow = 'initial';
        };

        // Close menu when clicking on a link
        if (navLinks) {
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', closeMenu);
            });
        }
        if (mobileDrawer) {
            mobileDrawer.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', closeMenu);
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && 
                (!navLinks || !navLinks.contains(e.target)) &&
                (!mobileDrawer || !mobileDrawer.contains(e.target))) {
                closeMenu();
            }
        });
    }
});
