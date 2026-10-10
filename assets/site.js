(() => {
  const root = document.documentElement;
  root.classList.add('js');
  try { root.dataset.theme = localStorage.getItem('afonso-theme') === 'light' ? 'light' : 'dark'; }
  catch { root.dataset.theme = 'dark'; }
  const themeButton = document.querySelector('[data-theme-toggle]');
  if (themeButton) {
    const updateLabel = () => {
      const dark = root.dataset.theme !== 'light';
      themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
      themeButton.setAttribute('title', `Switch to ${dark ? 'light' : 'dark'} theme`);
      themeButton.querySelector('[data-sun]').toggleAttribute('hidden', !dark);
      themeButton.querySelector('[data-moon]').toggleAttribute('hidden', dark);
    };
    themeButton.hidden = false;
    updateLabel();
    themeButton.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('afonso-theme', root.dataset.theme); } catch { /* Theme works without storage. */ }
      updateLabel();
    });
  }
  const menuButton = document.querySelector('[data-menu-toggle]');
  const navigation = document.getElementById('site-nav');
  if (menuButton && navigation) {
    menuButton.hidden = false;
    const closeMenu = () => {
      navigation.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
    };
    menuButton.addEventListener('click', () => {
      const open = navigation.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', `${open ? 'Close' : 'Open'} navigation`);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
        closeMenu();
        menuButton.focus();
      }
    });
    navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  }
  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const slides = [...carousel.querySelectorAll('[data-slide]')];
    const rotationButton = carousel.querySelector('[data-rotation]');
    let index = 0;
    let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let hovered = false;
    const showSlide = next => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, position) => {
        const active = position === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      carousel.querySelector('[data-slide-count]').textContent = `${index + 1} / ${slides.length}`;
    };
    const updateRotationLabel = () => {
      rotationButton.textContent = paused ? 'Play' : 'Pause';
      rotationButton.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} automatic photo changes`);
    };
    carousel.querySelectorAll('button, [data-playback]').forEach(control => control.hidden = false);
    carousel.querySelector('[data-previous]').addEventListener('click', () => showSlide(index - 1));
    carousel.querySelector('[data-next]').addEventListener('click', () => showSlide(index + 1));
    carousel.addEventListener('mouseenter', () => { hovered = true; });
    carousel.addEventListener('mouseleave', () => { hovered = false; });
    carousel.addEventListener('focusin', event => {
      if (event.target !== rotationButton) { paused = true; updateRotationLabel(); }
    });
    rotationButton.addEventListener('click', () => { paused = !paused; updateRotationLabel(); });
    carousel.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        showSlide(index + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    updateRotationLabel();
    setInterval(() => {
      if (!paused && !hovered && !document.hidden) showSlide(index + 1);
    }, 5000);
  }

  const gallery = document.querySelector('[data-outreach-gallery]');
  if (gallery) {
    const track = gallery.querySelector('[data-gallery-track]');
    const photos = [...track.children];
    for (let index = photos.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [photos[index], photos[other]] = [photos[other], photos[index]];
    }
    photos.forEach(photo => track.append(photo));
    const rotationButton = gallery.querySelector('[data-gallery-rotation]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let paused = reducedMotion.matches;
    let hovered = false;
    let shifting = false;
    const updateVisiblePhotos = () => {
      [...track.children].forEach((photo, index) => photo.setAttribute('aria-hidden', String(index >= 3)));
    };
    const updateRotationLabel = () => {
      rotationButton.textContent = paused ? 'Play' : 'Pause';
      rotationButton.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} automatic outreach photo changes`);
    };
    const finishShift = () => {
      track.style.transition = 'none';
      if (shifting === 1) track.append(track.firstElementChild);
      track.style.transform = '';
      updateVisiblePhotos();
      // Apply the reset before restoring the next animated shift.
      track.getBoundingClientRect();
      track.style.transition = '';
      shifting = false;
    };
    track.addEventListener('transitionend', event => {
      if (event.target === track && event.propertyName === 'transform' && shifting) finishShift();
    });
    const shiftPhotos = direction => {
      if (shifting) return;
      shifting = direction;
      const distance = track.children[1].getBoundingClientRect().left - track.children[0].getBoundingClientRect().left;
      if (direction === -1) {
        track.style.transition = 'none';
        track.prepend(track.lastElementChild);
        track.style.transform = `translateX(-${distance}px)`;
        track.getBoundingClientRect();
        track.style.transition = '';
        track.style.transform = '';
      } else {
        track.style.transform = `translateX(-${distance}px)`;
      }
      if (reducedMotion.matches) finishShift();
    };
    const manualShift = direction => {
      paused = true;
      updateRotationLabel();
      shiftPhotos(direction);
    };
    ['previous', 'next'].forEach(control => {
      const button = gallery.querySelector(`[data-gallery-${control}]`);
      button.hidden = false;
      button.addEventListener('click', () => manualShift(control === 'previous' ? -1 : 1));
    });
    gallery.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        manualShift(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    rotationButton.hidden = false;
    rotationButton.addEventListener('click', () => { paused = !paused; updateRotationLabel(); });
    gallery.addEventListener('mouseenter', () => { hovered = true; });
    gallery.addEventListener('mouseleave', () => { hovered = false; });
    gallery.addEventListener('focusin', event => {
      if (event.target !== rotationButton) { paused = true; updateRotationLabel(); }
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) {
        paused = true;
        if (shifting) finishShift();
        updateRotationLabel();
      }
    });
    updateVisiblePhotos();
    updateRotationLabel();
    setInterval(() => {
      if (paused || hovered || document.hidden || shifting) return;
      shiftPhotos(1);
    }, 3000);
  }

  const publicationList = document.querySelector('[data-publications]');
  if (publicationList) {
    const filters = [...document.querySelectorAll('[data-publication-filter]')];
    const filterPublications = selected => {
      publicationList.querySelectorAll('[data-first-author]').forEach(article => {
        article.hidden = selected === 'first' && article.dataset.firstAuthor !== 'true';
      });
      publicationList.querySelectorAll('.year-group').forEach(group => {
        group.hidden = !group.querySelector('.publication:not([hidden])');
      });
      filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.publicationFilter === selected)));
    };
    filters.forEach(button => button.addEventListener('click', () => filterPublications(button.dataset.publicationFilter)));
    filterPublications('first');
  }
})();
