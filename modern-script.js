/**
 * Sahaya Modern UI Scripts
 * Handles Theme, Particles, Toast Notifications, and Ripple Effects.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    lucide.createIcons();
  
    // 2. Dark Mode Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const html = document.documentElement;
    
    // Check for saved preference or OS preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  
    themeToggleBtn.addEventListener('click', () => {
      html.classList.toggle('dark');
      const isDark = html.classList.contains('dark');
      localStorage.theme = isDark ? 'dark' : 'light';
      showToast(`${isDark ? 'Dark' : 'Light'} mode activated`, 'info');
    });
  
    // 3. Particle Background Generator
    const particlesContainer = document.getElementById('particles');
    const particleCount = 20; // Subtle number of particles
  
    for (let i = 0; i < particleCount; i++) {
      createParticle();
    }
  
    function createParticle() {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      
      // Randomize properties
      const size = Math.random() * 8 + 4; // 4px to 12px
      const left = Math.random() * 100; // 0% to 100%
      const duration = Math.random() * 15 + 10; // 10s to 25s
      const delay = Math.random() * 5; // 0s to 5s delay
      
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${left}%`;
      particle.style.animationDuration = `${duration}s`;
      particle.style.animationDelay = `${delay}s`;
      
      particlesContainer.appendChild(particle);
    }
  
    // 4. Ripple Effect on Buttons
    const buttons = document.querySelectorAll('.ripple');
    buttons.forEach(button => {
      button.addEventListener('click', function(e) {
        const x = e.clientX - e.target.getBoundingClientRect().left;
        const y = e.clientY - e.target.getBoundingClientRect().top;
        
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.background = 'rgba(255, 255, 255, 0.4)';
        ripple.style.borderRadius = '50%';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        ripple.style.width = '100px';
        ripple.style.height = '100px';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.animation = 'ripple-effect 0.6s linear';
        
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  
    // Add CSS for ripple animation dynamically
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes ripple-effect {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
      }
      .ripple { position: relative; overflow: hidden; }
    `;
    document.head.appendChild(style);
  
    // 5. Live Location Toggle Handler
    const liveToggle = document.getElementById('live-toggle');
    if(liveToggle) {
      liveToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          showToast('Live tracking activated. Location is visible to drivers.', 'success');
        } else {
          showToast('Live tracking paused.', 'warning');
        }
      });
    }
  });
  
  // 6. Global Toast Notification System
  window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const colors = { info: 'bg-blue-500', success: 'bg-green-500', warning: 'bg-orange-500', emergency: 'bg-red-600 animate-pulse' };
    const iconColor = colors[type] || colors.info;
    
    toast.className = `glass flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border-white/20 transform transition-all duration-500 translate-x-10 opacity-0 bg-white/60 dark:bg-slate-800/80 text-sm font-semibold text-slate-800 dark:text-slate-100`;
    toast.innerHTML = `<div class="w-3 h-3 rounded-full ${iconColor}"></div> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-10', 'opacity-0');
      toast.classList.add('translate-x-0', 'opacity-100');
    });
  
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('translate-x-0', 'opacity-100');
      toast.classList.add('translate-x-10', 'opacity-0');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  };