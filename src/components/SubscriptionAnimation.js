/**
 * Subscription Animation Module
 * Handles animation when subscribing or managing subscriptions
 */
window.SubscriptionAnimation = (() => {
    // DOM elements
    let overlay = null;
    let particlesContainer = null;
    let processingText = null;
    
    // Animation state
    let animationFrameId = null;
    let particles = [];
    const maxParticles = 30;
    
    /**
     * Initialize the subscription animation
     */
    function initialize() {
      // Create overlay if it doesn't exist
      if (!document.querySelector('.subscription-processing-overlay')) {
        createOverlay();
      }
      
      // Cache DOM elements
      overlay = document.querySelector('.subscription-processing-overlay');
      particlesContainer = document.querySelector('.particles-container');
      processingText = document.querySelector('.processing-text');
    }
    
    /**
     * Create the overlay HTML structure
     */
    function createOverlay() {
      const overlayDiv = document.createElement('div');
      overlayDiv.className = 'subscription-processing-overlay';
      
      overlayDiv.innerHTML = `
        <div class="processing-animation">
          <div class="processing-circle">
            <img src="./logo_white.svg" alt="Vaata Mind Logo" />
          </div>
          <div class="particles-container"></div>
          <div class="processing-text">Processing Subscription</div>
        </div>
      `;
      
      document.body.appendChild(overlayDiv);
    }
    
    /**
     * Show the animation overlay
     * @param {string} [text="Processing Subscription"] - Custom text to display
     * @returns {Promise} Resolves when animation is fully visible
     */
    function show(text = "Processing Subscription") {
      return new Promise((resolve) => {
        initialize();
        
        // Update text if provided
        if (processingText) {
          processingText.textContent = text;
        }
        
        // Clear any existing particles
        if (particlesContainer) {
          particlesContainer.innerHTML = '';
          particles = [];
        }
        
        // Ensure overlay is in the DOM
        if (overlay) {
          // Force a reflow before adding the active class for better animation
          overlay.style.display = 'flex';
          void overlay.offsetWidth; // Trigger reflow
          
          // Show overlay
          overlay.classList.add('active');
          
          // Start particle animation
          startParticleAnimation();
          
          // Resolve when animation is fully visible (including blur transition)
          setTimeout(resolve, 800);
        } else {
          resolve();
        }
      });
    }
    
    /**
     * Hide the animation overlay
     * @returns {Promise} Resolves when animation is fully hidden
     */
    function hide() {
      return new Promise((resolve) => {
        // Stop particle animation
        stopParticleAnimation();
        
        // Hide overlay
        if (overlay) {
          overlay.classList.remove('active');
          
          // Resolve when animation is fully hidden (including blur transition)
          setTimeout(() => {
            // Hide completely when animation is done
            overlay.style.display = 'none';
            resolve();
          }, 500);
        } else {
          resolve();
        }
      });
    }
    
    /**
     * Start the particle animation
     */
    function startParticleAnimation() {
      // Stop any existing animation
      stopParticleAnimation();
      
      // Create initial particles
      createInitialParticles();
      
      // Start animation loop
      animateParticles();
    }
    
    /**
     * Stop the particle animation
     */
    function stopParticleAnimation() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
    
    /**
     * Create initial particles
     */
    function createInitialParticles() {
      if (!particlesContainer) return;
      
      // Clear existing particles
      particlesContainer.innerHTML = '';
      particles = [];
      
      // Create initial set of particles
      for (let i = 0; i < maxParticles / 2; i++) {
        createParticle();
      }
    }
    
    /**
     * Create a single particle
     */
    function createParticle() {
      if (!particlesContainer) return;
      
      // Create particle element
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random position, size, and animation duration
      const size = Math.random() * 8 + 2;
      const left = Math.random() * 100;
      const duration = Math.random() * 3 + 2;
      const delay = Math.random() * 2;
      
      // Apply styles
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${left}%`;
      particle.style.bottom = '0';
      particle.style.opacity = '0';
      particle.style.animation = `particle-float ${duration}s ${delay}s ease-out infinite`;
      
      // Add to container and particles array
      particlesContainer.appendChild(particle);
      particles.push({
        element: particle,
        createdAt: Date.now()
      });
    }
    
    /**
     * Animate the particles
     */
    function animateParticles() {
      const now = Date.now();
      
      // Add new particles occasionally
      if (particles.length < maxParticles && Math.random() > 0.9) {
        createParticle();
      }
      
      // Remove particles that are beyond their lifespan
      particles = particles.filter(particle => {
        const age = now - particle.createdAt;
        if (age > 5000) {
          if (particle.element.parentNode) {
            particle.element.parentNode.removeChild(particle.element);
          }
          return false;
        }
        return true;
      });
      
      // Continue animation
      animationFrameId = requestAnimationFrame(animateParticles);
    }
    
    /**
     * Show animation, simulate processing, then hide
     * @param {string} [text="Processing Subscription"] - Custom text to display
     * @param {number} [duration=3000] - Duration to show animation in ms
     * @returns {Promise} Resolves when animation is complete
     */
    function simulateProcessing(text = "Processing Subscription", duration = 3000) {
      return new Promise(async (resolve) => {
        // Show animation
        await show(text);
        
        // Wait for specified duration
        setTimeout(async () => {
          // Hide animation
          await hide();
          resolve();
        }, duration);
      });
    }
    
    // Public API
    return {
      initialize,
      show,
      hide,
      simulateProcessing
    };
  })();