document.addEventListener("DOMContentLoaded", () => {
  const navbarBurgers = Array.prototype.slice.call(
    document.querySelectorAll(".navbar-burger"),
    0
  );

  navbarBurgers.forEach(burger => {
    burger.addEventListener("click", () => {
      const targetId = burger.dataset.target;
      const target = document.getElementById(targetId);
      burger.classList.toggle("is-active");
      target.classList.toggle("is-active");
    });
  });

  const tabLinks = document.querySelectorAll(".tabs li");
  const tabContents = {
    "Mixtape Tour": document.querySelector(".mixtape-tour"),
    "Mini Docs": document.querySelector(".mini-docs"),
    "City Is Mine": document.querySelector(".city-is-mine"),
    "Run It Back": document.querySelector(".run-it-back")
  };

  tabLinks.forEach(tab => {
    tab.addEventListener("click", event => {
      event.preventDefault();

      tabLinks.forEach(t => t.classList.remove("is-active"));
      
      tab.classList.add("is-active");

      const tabName = tab.querySelector("a").textContent;

      Object.values(tabContents).forEach(content => {
        if (content) {
          content.classList.add("is-hidden");
        }
      });

      if (tabContents[tabName]) {
        tabContents[tabName].classList.remove("is-hidden");
      }
    });
  });

  const homeVideo = document.getElementById("homeVideo");
  const unmuteBtn = document.getElementById("unmuteBtn");
  const shopNowBtn = document.getElementById("shopNowBtn");

  if (homeVideo && unmuteBtn) {
    unmuteBtn.addEventListener("click", () => {
      homeVideo.muted = !homeVideo.muted;
      unmuteBtn.classList.toggle("muted");
    });
  }

  if (homeVideo) {
    homeVideo.addEventListener("timeupdate", () => {
      if (homeVideo.currentTime >= homeVideo.duration - 0.5) {
        homeVideo.pause();
        unmuteBtn.classList.add("is-hidden");
      }

      if (homeVideo.currentTime >= 18.8) {
        // If not in limited drop mode, always show the button
        if (!SHOPIFY_CONFIG.limitedDropMode) {
          shopNowBtn.classList.remove("is-hidden");
        } else {
          // Limited drop mode - only show if shop is actually open
          const now = new Date();
          const opening = new Date(SHOPIFY_CONFIG.shopOpeningDate);
          const closing = new Date(SHOPIFY_CONFIG.shopClosingDate);
          const isShopOpen = now >= opening && now <= closing;
          
          if (isShopOpen) {
            shopNowBtn.classList.remove("is-hidden");
          }
        }
      }
    });
  }

  const videoBackground = document.querySelector(".video-background");
  
  if (homeVideo && videoBackground) {
    homeVideo.addEventListener("canplay", () => {
      videoBackground.classList.add("is-loaded");
    });

    setTimeout(() => {
      videoBackground.classList.add("is-loaded");
    }, 1000);
  }

  const contactForm = document.querySelector("form[action*=\"formspree\"]");
  const successModal = document.getElementById("success-modal");
  const closeSuccessModalBtn = document.getElementById("close-success-modal");
  const modalCloseX = successModal?.querySelector(".modal-close");

  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);

      try {
        const response = await fetch(contactForm.action, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json"
          }
        });

        if (response.ok) {
          successModal.classList.add("is-active");
          contactForm.reset();
        } else {
          alert("Oops! There was a problem submitting your form");
        }
      } catch (error) {
        alert("Oops! There was a problem submitting your form");
      }
    });

    if (closeSuccessModalBtn) {
      closeSuccessModalBtn.addEventListener("click", () => {
        successModal.classList.remove("is-active");
      });
    }

    if (modalCloseX) {
      modalCloseX.addEventListener("click", () => {
        successModal.classList.remove("is-active");
      });
    }
  }

  // Check if shop is open and hide/show shop links
  function checkShopStatus() {
    // Get shop buttons/links (not the films link)
    const shopNowBtn = document.getElementById("shopNowBtn");
    const storeLink = document.querySelector(".store-link:not(.films-link)");
    
    // If not in limited drop mode, shop is always open
    if (!SHOPIFY_CONFIG.limitedDropMode) {
      // Store link is always visible initially
      if (storeLink) {
        storeLink.style.display = "";
      }
      
      // For Shop Now button, respect the video timing (18.8s)
      if (shopNowBtn && homeVideo) {
        if (homeVideo.currentTime >= 18.8) {
          shopNowBtn.classList.remove("is-hidden");
          shopNowBtn.style.display = "";
          // Hide store link when Shop Now appears
          if (storeLink) {
            storeLink.style.display = "none";
          }
        }
      } else if (shopNowBtn && !homeVideo) {
        // If there's no video element, show Shop Now immediately
        shopNowBtn.classList.remove("is-hidden");
        shopNowBtn.style.display = "";
        // Hide store link
        if (storeLink) {
          storeLink.style.display = "none";
        }
      }
      return;
    }
    
    // Limited drop mode - use timing logic
    const now = new Date();
    const opening = new Date(SHOPIFY_CONFIG.shopOpeningDate);
    const closing = new Date(SHOPIFY_CONFIG.shopClosingDate);
    
    const isShopOpen = now >= opening && now <= closing;
    
    if (!isShopOpen) {
      // Hide shop elements when shop is closed
      if (shopNowBtn) {
        shopNowBtn.classList.add("is-hidden");
        shopNowBtn.style.display = "none";
      }
      if (storeLink) {
        storeLink.style.display = "none";
      }
    } else {
      // Show appropriate shop elements when shop is open
      if (shopNowBtn && homeVideo && homeVideo.currentTime >= 18.8) {
        // Show Shop Now button when video reaches timestamp
        shopNowBtn.classList.remove("is-hidden");
        shopNowBtn.style.display = "";
        // Hide store link when Shop Now appears
        if (storeLink) {
          storeLink.style.display = "none";
        }
      } else {
        // Before video timestamp, show store link
        if (storeLink) {
          storeLink.style.display = "";
        }
      }
    }
  }

  // Run the check on page load
  if (typeof SHOPIFY_CONFIG !== 'undefined') {
    checkShopStatus();
    
    // Check every second to catch video timing and shop status changes
    setInterval(checkShopStatus, 1000);
  }
});