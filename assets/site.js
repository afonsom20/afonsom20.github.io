(() => {
  const root = document.documentElement;
  root.classList.add('js');
  root.dataset.theme = 'dark';
  const itchEmbed = document.querySelector('[data-itch-embed]');
  const updateItchTheme = () => {
    if (!itchEmbed) return;
    const light = root.dataset.theme === 'light';
    const colors = light
      ? { bg_color: 'f0eeea', fg_color: '252427', link_color: 'a54116', border_color: 'd9d6d0' }
      : { bg_color: '222224', fg_color: 'f6f5f2', link_color: 'ff9a64', border_color: '3b3b40' };
    itchEmbed.src = 'https://itch.io/embed/1162797?' + new URLSearchParams(colors);
  };
  updateItchTheme();
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
      updateLabel();
      updateItchTheme();
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
  let imageViewer = null;
  const pictures = [...document.querySelectorAll('main img')];
  if (pictures.length) {
    imageViewer = document.createElement('dialog');
    imageViewer.className = 'image-viewer';
    imageViewer.setAttribute('aria-label', 'Enlarged image');
    imageViewer.innerHTML = '<figure><img alt=""></figure>';
    document.body.append(imageViewer);
    const enlarged = imageViewer.querySelector('img');
    let opener;
    imageViewer.addEventListener('click', () => imageViewer.close());
    imageViewer.addEventListener('close', () => {
      root.classList.remove('image-viewing');
      enlarged.removeAttribute('src');
      opener.focus({ preventScroll: true });
    });
    pictures.forEach(picture => {
      const link = picture.closest('a');
      const control = link || picture;
      control.setAttribute('role', 'button');
      control.setAttribute('aria-haspopup', 'dialog');
      control.setAttribute('aria-label', 'Enlarge image: ' + picture.alt);
      control.tabIndex = 0;
      const openImage = event => {
        event.preventDefault();
        opener = control;
        enlarged.width = picture.naturalWidth || picture.width;
        enlarged.height = picture.naturalHeight || picture.height;
        enlarged.alt = picture.alt;
        enlarged.src = picture.dataset.fullImage || (link && /\.(png|jpe?g|svg|webp)(?:[?#]|$)/i.test(link.href) ? link.href : picture.currentSrc || picture.src);
        imageViewer.showModal();
        root.classList.add('image-viewing');
      };
      control.addEventListener('click', openImage);
      control.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') openImage(event);
      });
    });
  }

  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const slides = [...carousel.querySelectorAll('[data-slide]')];
    const rotationButton = carousel.querySelector('[data-rotation]');
    let index = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let paused = reducedMotion.matches;
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
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) { paused = true; updateRotationLabel(); }
    });
    showSlide(0);
    updateRotationLabel();
    setInterval(() => {
      if (!paused && !hovered && !document.hidden && !imageViewer?.open) showSlide(index + 1);
    }, Number(carousel.dataset.interval) || 5000);
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
      [...track.children].forEach((photo, index) => {
        photo.setAttribute('aria-hidden', String(index >= 3));
        photo.tabIndex = index < 3 ? 0 : -1;
      });
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
      if (paused || hovered || document.hidden || imageViewer?.open || shifting) return;
      shiftPhotos(1);
    }, 3000);
  }

  const proximaStills = document.querySelector('.proxima-stills');
  if (proximaStills && proximaStills.children.length > 1) {
    const rotationButton = document.querySelector('[data-proxima-rotation]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let paused = reducedMotion.matches;
    let hovered = false;
    let previousTime;
    let progress = 0;
    const updateRotationLabel = () => {
      rotationButton.textContent = paused ? 'Play' : 'Pause';
      rotationButton.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} automatic Proxima artwork scrolling`);
    };
    const pause = () => { paused = true; updateRotationLabel(); };
    rotationButton.hidden = false;
    rotationButton.addEventListener('click', () => { paused = !paused; updateRotationLabel(); });
    proximaStills.addEventListener('mouseenter', () => { hovered = true; });
    proximaStills.addEventListener('mouseleave', () => { hovered = false; });
    proximaStills.addEventListener('focusin', pause);
    proximaStills.addEventListener('pointerdown', pause);
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) pause(); });
    proximaStills.classList.add('is-scrolling');
    updateRotationLabel();
    const scroll = time => {
      const elapsed = previousTime === undefined ? 0 : Math.min(time - previousTime, 100);
      previousTime = time;
      if (!paused && !hovered && !document.hidden && !imageViewer?.open) {
        // Carry fractional pixels so the speed stays at 20px/s on every display.
        progress += elapsed * .02;
        const pixels = Math.floor(progress);
        progress -= pixels;
        proximaStills.scrollLeft += pixels;
        const distance = proximaStills.children[1].getBoundingClientRect().left - proximaStills.children[0].getBoundingClientRect().left;
        // Reuse the original images and their viewer controls for a seamless loop.
        while (distance > 0 && proximaStills.scrollLeft >= distance) {
          const position = proximaStills.scrollLeft - distance;
          proximaStills.append(proximaStills.firstElementChild);
          proximaStills.scrollLeft = position;
        }
      }
      requestAnimationFrame(scroll);
    };
    requestAnimationFrame(scroll);
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
