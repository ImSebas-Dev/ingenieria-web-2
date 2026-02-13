// Material Design Resume Interactive Features

// Drawer Toggle
function toggleDrawer() {
    const drawer = document.getElementById('drawer');
    const drawerContent = document.getElementById('drawerContent');
    
    if (drawer.classList.contains('hidden')) {
        drawer.classList.remove('hidden');
        // Force reflow
        drawer.offsetHeight;
        drawer.classList.remove('opacity-0');
        drawerContent.classList.remove('-translate-x-full');
        document.body.style.overflow = 'hidden';
    } else {
        drawer.classList.add('opacity-0');
        drawerContent.classList.add('-translate-x-full');
        setTimeout(() => {
            drawer.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }
}

// Close drawer when clicking outside
document.getElementById('drawer')?.addEventListener('click', function(e) {
    if (e.target === this) {
        toggleDrawer();
    }
});

// App Bar Scroll Effect
const appBar = document.getElementById('appBar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        appBar.classList.add('scrolled');
    } else {
        appBar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// Scroll Reveal Animation
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            // Unobserve after revealing
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all elements with scroll-reveal class
document.querySelectorAll('.scroll-reveal').forEach((el) => {
    observer.observe(el);
});

// Toast Notification System
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
        const offsetTop = element.offsetTop - 80; // Account for fixed header
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Scroll to Top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Ripple Effect Handler
document.querySelectorAll('.ripple').forEach(button => {
    button.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const circle = document.createElement('span');
        circle.style.position = 'absolute';
        circle.style.width = '0';
        circle.style.height = '0';
        circle.style.borderRadius = '50%';
        circle.style.background = 'rgba(255, 255, 255, 0.3)';
        circle.style.left = x + 'px';
        circle.style.top = y + 'px';
        circle.style.pointerEvents = 'none';
        circle.style.transform = 'translate(-50%, -50%)';
        circle.style.transition = 'width 0.6s, height 0.6s';
        
        this.appendChild(circle);
        
        // Force reflow
        circle.offsetWidth;
        
        const size = Math.max(rect.width, rect.height) * 2;
        circle.style.width = size + 'px';
        circle.style.height = size + 'px';
        
        setTimeout(() => {
            circle.remove();
        }, 600);
    });
});

// Active Navigation Link Update
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('text-indigo-200');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('text-indigo-200');
        }
    });
});

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const drawer = document.getElementById('drawer');
        if (!drawer.classList.contains('hidden')) {
            toggleDrawer();
        }
    }
});

// Performance: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized scroll handler
const optimizedScroll = debounce(() => {
    // Additional scroll-based animations can be added here
}, 16);

window.addEventListener('scroll', optimizedScroll);

// Initialize Lucide icons on load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Handle print functionality
window.addEventListener('beforeprint', () => {
    document.body.classList.add('printing');
});

window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing');
});

// Lazy load images for better performance
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}