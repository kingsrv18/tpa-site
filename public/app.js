const menuButton = document.querySelector('.menu-toggle');
const mobileNavigation = document.querySelector('#mobile-navigation');

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  mobileNavigation.hidden = true;
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  mobileNavigation.hidden = !open;
});
mobileNavigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 1001px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

const form = document.querySelector('#membership-form');
const handoff = document.querySelector('#registration-handoff');
const nameInput = document.querySelector('#member-name');
const emailInput = document.querySelector('#member-email');

function validate(input, errorId) {
  const error = document.getElementById(errorId);
  let message = '';
  if (input === nameInput && input.value.trim().length < 2) message = 'Please enter your full name.';
  if (input === emailInput && (!input.value.trim() || !input.validity.valid)) message = 'Please enter a valid email address.';
  error.textContent = message;
  error.hidden = !message;
  input.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  nameInput.value = nameInput.value.trim();
  emailInput.value = emailInput.value.trim();
  const nameValid = validate(nameInput, 'name-error');
  const emailValid = validate(emailInput, 'email-error');
  if (!nameValid || !emailValid) {
    (nameValid ? emailInput : nameInput).focus();
    return;
  }
  // No personal details are stored, sent in URLs or submitted to an unconfigured endpoint.
  document.querySelector('#review-name').textContent = nameInput.value;
  document.querySelector('#review-email').textContent = emailInput.value;
  form.hidden = true;
  handoff.hidden = false;
  handoff.focus({ preventScroll: true });
});
for (const [input, errorId] of [[nameInput, 'name-error'], [emailInput, 'email-error']]) {
  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') validate(input, errorId);
  });
}
document.querySelector('#edit-registration').addEventListener('click', () => {
  handoff.hidden = true;
  form.hidden = false;
  nameInput.focus({ preventScroll: true });
});

const programmes = {
  gst: { category: 'Knowledge session', title: 'GST In Practice. Perspectives Worth Sharing.', description: 'A sample programme for focused learning and practical discussion among professional peers, with room to compare experiences and ask questions.' },
  audit: { category: 'Peer discussion', title: 'Audit & Assurance Roundtable', description: 'A sample session for comparing perspectives and discussing the questions that arise in professional practice.' },
  fellowship: { category: 'Member fellowship', title: 'An Evening With The Community', description: 'A sample fellowship gathering to reconnect with professional peers and welcome new members to the community.' }
};
const eventDialog = document.querySelector('#event-dialog');
let eventTrigger;
document.querySelectorAll('[data-event]').forEach(button => {
  button.addEventListener('click', () => {
    const programme = programmes[button.dataset.event];
    if (!programme) return;
    eventTrigger = button;
    document.querySelector('#event-dialog-category').textContent = programme.category;
    document.querySelector('#event-dialog-title').textContent = programme.title;
    document.querySelector('#event-dialog-description').textContent = programme.description;
    eventDialog.showModal();
  });
});
document.querySelector('.dialog-close').addEventListener('click', () => eventDialog.close());
eventDialog.addEventListener('click', event => {
  if (event.target !== eventDialog) return;
  const bounds = eventDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) eventDialog.close();
});
eventDialog.addEventListener('close', () => eventTrigger?.focus({ preventScroll: true }));

// A locally rendered geographic atlas: no map SDK, network tiles or account connection.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const atlasBook = document.querySelector('#atlas-book');
const bookMap = document.querySelector('#book-map');
const tollygungeMarker = document.querySelector('#tollygunge-marker');
const atlasMessage = document.querySelector('#atlas-message');
const previousChapter = document.querySelector('#previous-chapter');
const nextChapter = document.querySelector('#next-chapter');
const bookCover = document.querySelector('#open-book');
const bookSpread = document.querySelector('#atlas-spread');
const bookNavigation = document.querySelector('#book-navigation');
const bookCredit = document.querySelector('#atlas-credit');
const bookImagePanels = [...document.querySelectorAll('[data-book-image]')];
const chapters = [
  { title: 'A City Of Ideas.', text: 'Kolkata is our shared setting. Tollygunge is where our community comes together, with room for new perspectives and lasting connections.', visual: 'map', imageHeading: 'Tollygunge', caption: 'Our community’s home in South Kolkata.', focused: true },
  { title: 'Our Professional Circle.', text: 'A shared profession becomes a community through conversation. In Tollygunge, we make room to learn from one another and build meaningful relationships.', visual: 'community', imageHeading: 'Our Community', caption: 'Shared purpose. Lasting connections.', focused: false },
  { title: 'Knowledge Worth Sharing.', text: 'Good practice begins with curiosity. Bring a question, share your experience and keep learning with people who understand the profession.', visual: 'knowledge', imageHeading: 'Shared Knowledge', caption: 'Books, notes and shared ideas.', focused: false }
];
let chapterIndex = 0;
let pageTurnTimeout;
let coverTimeout;

function renderChapter() {
  const chapter = chapters[chapterIndex];
  document.querySelector('#book-chapter-title').textContent = chapter.title;
  document.querySelector('#book-chapter-text').textContent = chapter.text;
  document.querySelector('#book-page-number').textContent = `Chapter ${chapterIndex + 1} of ${chapters.length}`;
  document.querySelector('#book-image-heading').textContent = chapter.imageHeading;
  document.querySelector('#book-image-caption').textContent = chapter.caption;
  bookImagePanels.forEach(panel => { panel.hidden = panel.dataset.bookImage !== chapter.visual; });
  document.querySelector('#book-map-north').hidden = chapter.visual !== 'map';
  bookCredit.hidden = chapter.visual !== 'map';
  previousChapter.disabled = chapterIndex === 0;
  nextChapter.disabled = chapterIndex === chapters.length - 1;
  setMapFocus(chapter.focused);
  if (chapterIndex < chapters.length - 1) atlasMessage.textContent = 'Click the right page or use the arrows to turn a page.';
  if (chapterIndex === chapters.length - 1) atlasMessage.textContent = 'The last chapter. Return to a previous page or close the book to begin again.';
}

function openBook({ focus = true } = {}) {
  if (atlasBook.dataset.open === 'true') return;
  clearTimeout(coverTimeout);
  atlasBook.dataset.open = 'true';
  bookCover.setAttribute('aria-expanded', 'true');
  bookSpread.hidden = false;
  bookNavigation.hidden = false;
  // Warm all three local images while the cover opens, keeping subsequent turns smooth.
  bookImagePanels.forEach(panel => { panel.querySelector('img').loading = 'eager'; });
  renderChapter();
  if (reducedMotion.matches) bookCover.hidden = true;
  else {
    atlasBook.classList.add('is-opening');
    coverTimeout = setTimeout(() => {
      bookCover.hidden = true;
      atlasBook.classList.remove('is-opening');
    }, 750);
  }
  if (focus) nextChapter.focus({ preventScroll: true });
}

function closeBook() {
  clearTimeout(coverTimeout);
  clearTimeout(pageTurnTimeout);
  atlasBook.classList.remove('is-opening', 'is-turning', 'turning-backwards');
  chapterIndex = 0;
  renderChapter();
  bookSpread.hidden = true;
  bookNavigation.hidden = true;
  bookCredit.hidden = true;
  bookCover.hidden = false;
  bookCover.setAttribute('aria-expanded', 'false');
  atlasBook.dataset.open = 'false';
  atlasMessage.textContent = 'A little local knowledge, one page at a time. Click the cover to begin.';
  resetBookTilt();
  bookCover.focus({ preventScroll: true });
}

function setMapFocus(focused) {
  bookMap.dataset.focused = String(focused);
  tollygungeMarker.setAttribute('aria-pressed', String(focused));
  atlasMessage.textContent = focused ? 'Our community is rooted in Tollygunge, South Kolkata.' : 'Select Tollygunge to explore our community’s home.';
}
function showChapter(index) {
  if (atlasBook.dataset.open !== 'true') return;
  const previousIndex = chapterIndex;
  chapterIndex = Math.max(0, Math.min(chapters.length - 1, index));
  renderChapter();
  clearTimeout(pageTurnTimeout);
  atlasBook.classList.remove('is-turning', 'turning-backwards');
  if (!reducedMotion.matches) {
    // Restart a short user-triggered page turn, including rapid repeated clicks.
    void atlasBook.offsetWidth;
    atlasBook.classList.toggle('turning-backwards', chapterIndex < previousIndex);
    atlasBook.classList.add('is-turning');
    pageTurnTimeout = setTimeout(() => atlasBook.classList.remove('is-turning', 'turning-backwards'), 570);
  }
}
bookCover.addEventListener('click', () => openBook());
document.querySelector('#close-book').addEventListener('click', closeBook);
document.querySelector('.book-map-page').addEventListener('click', event => {
  if (event.target.closest('button, a') || chapterIndex === chapters.length - 1) return;
  showChapter(chapterIndex + 1);
});
document.querySelector('.atlas-experience').addEventListener('keydown', event => {
  if (atlasBook.dataset.open !== 'true' || document.querySelector('dialog[open]')) return;
  if (event.key === 'Escape') { event.preventDefault(); closeBook(); }
});
previousChapter.addEventListener('click', () => showChapter(chapterIndex - 1));
nextChapter.addEventListener('click', () => showChapter(chapterIndex + 1));
tollygungeMarker.addEventListener('click', () => setMapFocus(bookMap.dataset.focused !== 'true'));
document.querySelector('#locate-tollygunge').addEventListener('click', () => {
  openBook({ focus: false });
  showChapter(0);
  tollygungeMarker.focus({ preventScroll: true });
});
atlasBook.addEventListener('pointermove', event => {
  if (reducedMotion.matches || !finePointer.matches || event.pointerType !== 'mouse' || atlasBook.dataset.open !== 'true') return;
  const bounds = atlasBook.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - .5;
  const y = (event.clientY - bounds.top) / bounds.height - .5;
  atlasBook.style.setProperty('--book-tilt-x', `${(-y * 3).toFixed(2)}deg`);
  atlasBook.style.setProperty('--book-tilt-y', `${(x * 3).toFixed(2)}deg`);
});
function resetBookTilt() {
  atlasBook.style.removeProperty('--book-tilt-x');
  atlasBook.style.removeProperty('--book-tilt-y');
}
atlasBook.addEventListener('pointerleave', resetBookTilt);

// Modest once-only reveals. Content stays visible without JS and in reduced-motion mode.
const revealElements = [...document.querySelectorAll('.association, .atlas-copy, .atlas-experience, .section-heading, .event-layout, .membership-copy, .membership-form-wrap, .resources-grid, .contact')];
let revealObserver;
function configureReveals() {
  revealObserver?.disconnect();
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    revealElements.forEach(element => element.classList.remove('reveal-pending', 'reveal-ready', 'reveal-visible'));
    return;
  }
  revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('reveal-visible');
      entry.target.classList.remove('reveal-pending');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: .08, rootMargin: '0px 0px -20px 0px' });
  revealElements.forEach(element => {
    if (element.getBoundingClientRect().top < innerHeight - 20 || element.classList.contains('reveal-visible')) return;
    element.classList.add('reveal-ready', 'reveal-pending');
    revealObserver.observe(element);
  });
}
configureReveals();
reducedMotion.addEventListener('change', () => {
  resetBookTilt();
  clearTimeout(pageTurnTimeout);
  clearTimeout(coverTimeout);
  atlasBook.classList.remove('is-turning', 'turning-backwards', 'is-opening');
  if (atlasBook.dataset.open === 'true') bookCover.hidden = true;
  configureReveals();
});
