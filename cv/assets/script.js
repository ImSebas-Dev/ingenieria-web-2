// Material Design Resume Interactive Features

// Drawer Toggle
let lastFocusedElement;

function toggleDrawer() {
    const drawer = document.getElementById('drawer');
    const drawerContent = document.getElementById('drawerContent');
    const toggleButton = document.querySelector('[aria-controls="drawer"]');

    const isOpen = !drawer.classList.contains('hidden');

    if (!isOpen) {
        lastFocusedElement = document.activeElement;
        drawer.classList.remove('hidden');
        drawer.offsetHeight;
        drawer.classList.remove('opacity-0');
        drawerContent.classList.remove('-translate-x-full');

        drawer.setAttribute('aria-hidden', 'false');
        toggleButton.setAttribute('aria-expanded', 'true');

        document.body.style.overflow = 'hidden';
        drawerContent.focus();
    } else {
        drawer.classList.add('opacity-0');
        drawerContent.classList.add('-translate-x-full');

        drawer.setAttribute('aria-hidden', 'true');
        toggleButton.setAttribute('aria-expanded', 'false');

        setTimeout(() => {
            drawer.classList.add('hidden');
            document.body.style.overflow = '';
            if (lastFocusedElement) {
                lastFocusedElement.focus();
            }
        }, 300);
    }
}

// Close drawer when clicking outside
document.getElementById('drawer')?.addEventListener('click', function (e) {
    if (e.target === this) {
        toggleDrawer();
    }
});

// App Bar Scroll Effect
const appBar = document.getElementById('appBar');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
        appBar.classList.add('scrolled');
    } else {
        appBar.classList.remove('scrolled');
    }
});

// Scroll Reveal Animation
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.scroll-reveal').forEach((el) => {
    observer.observe(el);
});

// Toast Notification
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');

    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0', 'pointer-events-none');
    }, duration);
}

// Smooth Scroll to Section
function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        const offsetTop = element.offsetTop - 80;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
            top: offsetTop,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    }
}

// Scroll to Top
function scrollToTop() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
}

// Focus Trap for Drawer
function trapFocus(element) {
    const focusable = element.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    element.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
}

// Initialize focus trap for drawer
const drawerContent = document.getElementById('drawerContent');
if (drawerContent) {
    trapFocus(drawerContent);
}

// Ripple Effect
document.querySelectorAll('.ripple').forEach(button => {
    button.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const circle = document.createElement('span');
        const size = Math.max(rect.width, rect.height);

        circle.style.position = 'absolute';
        circle.style.width = size + 'px';
        circle.style.height = size + 'px';
        circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
        circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
        circle.style.background = 'rgba(255,255,255,0.3)';
        circle.style.borderRadius = '50%';
        circle.style.pointerEvents = 'none';
        circle.style.transform = 'scale(0)';
        circle.style.transition = 'transform 0.5s ease';
        circle.setAttribute('aria-hidden', 'true');

        this.appendChild(circle);

        requestAnimationFrame(() => {
            circle.style.transform = 'scale(2)';
        });

        setTimeout(() => circle.remove(), 500);
    });
});


// Navigation Link Highlighting
const navLinks = document.querySelectorAll('header nav a[href^="#"]');
const sections = document.querySelectorAll('#profile, #experience, #education, #contact');

if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.remove('active-link')
                    link.removeAttribute('aria-current');
                });

                const id = entry.target.getAttribute('id');
                const activeLink = document.querySelector(`header nav a[href="#${id}"]`);

                if (activeLink) {
                    activeLink.classList.add('active-link');
                    activeLink.setAttribute('aria-current', 'page');
                }
            }
        });
    }, {
        root: null,
        rootMargin: "-40% 0px -50% 0px",
        threshold: 0
    });

    sections.forEach(section => {
        navObserver.observe(section);
    });
}


// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const drawer = document.getElementById('drawer');
        if (!drawer.classList.contains('hidden')) {
            toggleDrawer();
        }
    }
});

// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});