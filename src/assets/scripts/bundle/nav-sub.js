const nav = document.querySelector('nav');

function toggleSubmenu(button) {
  const isOpen = button.getAttribute('aria-expanded') === 'true';
  const submenu = document.getElementById(button.getAttribute('aria-controls'));
  if (!submenu) return;

  closeAllSubmenus(button);

  button.setAttribute('aria-expanded', String(!isOpen));
  submenu.hidden = isOpen;
}

function closeSubmenu(button) {
  const submenu = document.getElementById(button.getAttribute('aria-controls'));
  if (!submenu || submenu.tagName === 'NAV') return;
  button.setAttribute('aria-expanded', 'false');
  submenu.hidden = true;
}

function closeAllSubmenus(except) {
  const openButtons = nav.querySelectorAll('button[data-btn-submenu][aria-expanded="true"]');
  openButtons.forEach(btn => {
    if (btn !== except) closeSubmenu(btn);
  });
}

function getOpenSubmenuButton() {
  return nav.querySelector('button[data-btn-submenu][aria-expanded="true"]');
}

nav.addEventListener('click', e => {
  const button = e.target.closest('button[data-btn-submenu]');
  if (button) toggleSubmenu(button);
});

document.addEventListener('click', e => {
  const openButton = getOpenSubmenuButton();
  if (openButton && !nav.contains(e.target)) closeSubmenu(openButton);
});
