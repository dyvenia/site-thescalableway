let focusTrapListener = null;
let lastFocusedElement = null;

function focusBanner() {
  const banner = document.getElementById('consent-banner');
  if (banner) {
    lastFocusedElement = document.activeElement;
    setTimeout(() => {
      const firstButton = banner.querySelector('button');
      if (firstButton) {
        firstButton.focus();
        banner.scrollIntoView({behavior: 'smooth', block: 'nearest'});
      }
    }, 10);
  }
}

function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  focusTrapListener = function (e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
    if (e.key === 'Escape') {
      handleDeclineAll();
    }
  };

  document.addEventListener('keydown', focusTrapListener);
}

function removeFocusTrap() {
  if (focusTrapListener) {
    document.removeEventListener('keydown', focusTrapListener);
    focusTrapListener = null;
  }
  if (lastFocusedElement && lastFocusedElement.focus) {
    lastFocusedElement.focus();
  }
}

function setServiceCookie(service, accepted) {
  let date = new Date();
  date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
  let expires = 'expires=' + date.toGMTString();
  document.cookie = 'service-' + service + '=' + accepted + ';' + expires + ';path=/';
}

function getServiceCookie(service) {
  var name = 'service-' + service + '=';
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

function getAllServices() {
  const serviceButtons = document.querySelectorAll('[data-service-accept]');
  return Array.from(serviceButtons).map(btn => btn.dataset.serviceAccept);
}

function showBanner() {
  const banner = document.getElementById('consent-banner');
  if (banner) {
    banner.hidden = false;
    focusBanner();
    trapFocus(banner);
  }
}

function hideBanner() {
  const banner = document.getElementById('consent-banner');
  if (banner) {
    banner.hidden = true;
    removeFocusTrap();
    document.body.focus();
  }
}

function showPlaceholders() {
  document.querySelectorAll('[data-consent-script]').forEach(el => {
    const placeholderHTML = el.dataset.consentPlaceholder;
    if (placeholderHTML) {
      el.innerHTML = placeholderHTML;
    }
  });
}

function handleAcceptAll() {
  const services = getAllServices();
  services.forEach(service => setServiceCookie(service, 'true'));
  location.reload();
}

function handleDeclineAll() {
  const services = getAllServices();
  services.forEach(service => setServiceCookie(service, 'false'));
  hideBanner();
  showPlaceholders();
}

function handleServiceAccept(service) {
  setServiceCookie(service, 'true');
  hideBanner();
  location.reload();
}

function handleServiceDecline(service) {
  setServiceCookie(service, 'false');
  const services = getAllServices();
  const allDeclined = services.every(s => getServiceCookie(s) === 'false');
  if (allDeclined) {
    hideBanner();
  }
  showPlaceholders();
}

function checkConsent() {
  const services = getAllServices();
  if (services.length === 0) return;

  const hasAccepted = services.some(service => getServiceCookie(service) === 'true');
  const hasDeclined = services.some(service => getServiceCookie(service) === 'false');
  const allDecided = services.every(service => getServiceCookie(service) !== '');

  if (hasAccepted && allDecided) {
    return;
  } else if (allDecided && !hasAccepted) {
    showPlaceholders();
  } else {
    showBanner();
    showPlaceholders();
  }
}
document.addEventListener('click', e => {
  if (e.target.dataset.consentAccept !== undefined) {
    handleAcceptAll();
  } else if (e.target.dataset.consentDecline !== undefined) {
    handleDeclineAll();
  } else if (e.target.dataset.serviceAccept !== undefined) {
    handleServiceAccept(e.target.dataset.serviceAccept);
  } else if (e.target.dataset.serviceDecline !== undefined) {
    handleServiceDecline(e.target.dataset.serviceDecline);
  } else if (e.target.closest('[data-consent-banner]')) {
    showBanner();
  }
});

function initConsent() {
  checkConsent();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initConsent);
} else {
  initConsent();
}
