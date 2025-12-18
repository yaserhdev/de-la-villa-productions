document.addEventListener('DOMContentLoaded', () => {
  // Navbar burger code
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  $navbarBurgers.forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.target;
      const $target = document.getElementById(target);
      el.classList.toggle('is-active');
      $target.classList.toggle('is-active');
    });
  });

  // Tab switching functionality
  const tabs = document.querySelectorAll('.tabs li');
  const categoryDivs = {
    'Mixtape Tour': document.querySelector('.mixtape-tour'),
    'Mini Docs': document.querySelector('.mini-docs'),
    'City Is Mine': document.querySelector('.city-is-mine'),
    'Run It Back': document.querySelector('.run-it-back')
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      
      const categoryName = tab.querySelector('a').textContent;
      
      Object.values(categoryDivs).forEach(div => {
        if (div) div.classList.add('is-hidden');
      });
      
      if (categoryDivs[categoryName]) {
        categoryDivs[categoryName].classList.remove('is-hidden');
      }
    });
  });

  // Unmute/Mute toggle button functionality
  const video = document.getElementById('homeVideo');
  const btn = document.getElementById('unmuteBtn');
  const shopNowBtn = document.getElementById('shopNowBtn');

  if (video && btn) {
    btn.addEventListener('click', () => {
      video.muted = !video.muted;
      btn.classList.toggle('muted');
    });
  }

  if (video) {
    video.addEventListener('timeupdate', () => {
      // Pause 0.5 seconds before the end
      if (video.currentTime >= video.duration - 0.5) {
        video.pause();
        // shopNowBtn.classList.remove('is-hidden');
        btn.classList.add('is-hidden');
      }
      if (video.currentTime >= 18.8) {
        shopNowBtn.classList.remove('is-hidden');
      }
    });
  }

  const contactForm = document.querySelector('form[action*="formspree"]');
  const successModal = document.getElementById('success-modal');
  const closeModalBtn = document.getElementById('close-success-modal');
  const modalClose = successModal?.querySelector('.modal-close');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          // Show success modal
          successModal.classList.add('is-active');
          // Reset form
          contactForm.reset();
        } else {
          alert('Oops! There was a problem submitting your form');
        }
      } catch (error) {
        alert('Oops! There was a problem submitting your form');
      }
    });

    // Close modal handlers
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        successModal.classList.remove('is-active');
      });
    }

    if (modalClose) {
      modalClose.addEventListener('click', () => {
        successModal.classList.remove('is-active');
      });
    }
  }
});