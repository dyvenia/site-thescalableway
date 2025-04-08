// © Manuel Matuzović: https://web.dev/website-navigation/ / Web Accessibility Cookbook

const nav = document.querySelector('nav');
const list = nav.querySelector('ul');
const burgerClone = document.querySelector('#burger-template').content.cloneNode(true);
const buttonDrawer = burgerClone.querySelector('button[data-btn-drawer]');

list.style.setProperty('display', 'flex');

buttonDrawer.addEventListener('click', e => {
  const isOpen = buttonDrawer.getAttribute('aria-expanded') === 'true';
  buttonDrawer.setAttribute('aria-expanded', !isOpen);
});

const disableMenu = () => {
  buttonDrawer.setAttribute('aria-expanded', false);
};

//  close on escape
document.addEventListener('keyup', e => {
  if (e.code === 'Escape') {
    disableMenu();
  }
});

// close if clicked outside of event target
document.addEventListener('click', e => {
  const isClickInsideElement = nav.contains(e.target);
  if (!isClickInsideElement) {
    disableMenu();
  }
});

// avoid drawer flashing on page load
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(() => {
    list.removeAttribute('no-flash');
  }, 100);
});

nav.insertBefore(burgerClone, list);
