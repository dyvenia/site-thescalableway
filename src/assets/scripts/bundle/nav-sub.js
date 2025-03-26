const nav = document.querySelector('nav');

// Toggle submenu and aria-expanded on button click
nav.addEventListener('click', e => {
  const button = e.target.closest('button.nav-sublist-toggle');
  if (!button) return;

  const isOpen = button.getAttribute('aria-expanded') === 'true';

  closeAllSubmenus(button);

  button.setAttribute('aria-expanded', String(!isOpen));
  const submenu = document.getElementById(button.getAttribute('aria-controls'));
  submenu.hidden = isOpen;
});

// Close son Escape key or clicking outside the nav
document.addEventListener('click', e => {
  const openButton = nav.querySelector('[aria-expanded="true"]');
  if (openButton && !nav.contains(e.target)) {
    closeSubmenu(openButton);
  }
});

// Close on clicking outside the nav
document.addEventListener('keyup', e => {
  const openButton = nav.querySelector('[aria-expanded="true"]');
  if (e.code === 'Escape' && openButton) {
    closeSubmenu(openButton);
  }
});

// Close all other submenus
function closeAllSubmenus(excludeButton) {
  const openButtons = nav.querySelectorAll('[aria-expanded="true"]');
  openButtons.forEach(button => {
    if (button !== excludeButton) {
      closeSubmenu(button);
    }
  });
}

function closeSubmenu(button) {
  const submenu = document.getElementById(button.getAttribute('aria-controls'));
  button.setAttribute('aria-expanded', 'false');
  submenu.hidden = true;
}
