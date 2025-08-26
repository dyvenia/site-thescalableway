// Simple GDPR consent with reload on accept
function setCookie(value) {
  let date = new Date();
  date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
  let expires = 'expires=' + date.toGMTString();
  document.cookie = 'gdpr-consent=' + value + ';' + expires + ';path=/';
}

function getCookie() {
  var name = 'gdpr-consent=';
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

function showBanner() {
  const banner = document.getElementById('consent-banner');
  if (banner) banner.hidden = false;
}

function hideBanner() {
  const banner = document.getElementById('consent-banner');
  if (banner) banner.hidden = true;
}

function showPlaceholders() {
  document.querySelectorAll('[data-consent-script]').forEach(el => {
    const placeholderHTML = el.dataset.consentPlaceholder;
    if (placeholderHTML) {
      el.innerHTML = placeholderHTML;
    }
  });
}

function handleAccept() {
  setCookie('true');
  location.reload();
}

function handleDecline() {
  setCookie('false');
  hideBanner();
  showPlaceholders();
}

function checkCookie() {
  const consent = getCookie();
  if (consent === 'false') {
    showPlaceholders();
  } else if (consent !== 'true') {
    showBanner();
    showPlaceholders();
  }
}

// Event delegation for all consent buttons
document.addEventListener('click', e => {
  if (e.target.dataset.consentAccept !== undefined) {
    handleAccept();
  } else if (e.target.dataset.consentDecline !== undefined) {
    handleDecline();
  } else if (e.target.closest('[data-consent-banner]')) {
    showBanner();
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', checkCookie);
