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
        // Only show if shop is actually open
        const now = new Date();
        const opening = new Date(SHOPIFY_CONFIG.shopOpeningDate);
        const closing = new Date(SHOPIFY_CONFIG.shopClosingDate);
        const isShopOpen = now >= opening && now <= closing;
        
        if (isShopOpen) {
          shopNowBtn.classList.remove("is-hidden");
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
    const now = new Date();
    const opening = new Date(SHOPIFY_CONFIG.shopOpeningDate);
    const closing = new Date(SHOPIFY_CONFIG.shopClosingDate);
    
    const isShopOpen = now >= opening && now <= closing;
    
    // Get shop buttons/links
    const shopNowBtn = document.getElementById("shopNowBtn");
    const storeLink = document.querySelector(".store-link");
    
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
      // Show shop elements when shop is open (in case they were hidden)
      if (shopNowBtn && homeVideo && homeVideo.currentTime >= 18.8) {
        // Only show if video has reached the right timestamp
        shopNowBtn.classList.remove("is-hidden");
        shopNowBtn.style.display = "";
      }
      if (storeLink) {
        storeLink.style.display = "";
      }
    }
  }

  // Run the check on page load
  if (typeof SHOPIFY_CONFIG !== 'undefined') {
    checkShopStatus();
    
    // Optional: Check every minute in case shop opens/closes while page is open
    setInterval(checkShopStatus, 60000); // 60000ms = 1 minute
  }
});