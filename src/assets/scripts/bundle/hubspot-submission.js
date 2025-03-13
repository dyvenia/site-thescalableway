document.querySelector('[data-hubspot]').addEventListener('submit', async function (event) {
  event.preventDefault(); // Prevent normal form submission

  const form = event.target;
  const formData = new FormData(form);
  const consentCheckbox = form.querySelector('input[name="consent"]');

  // Message containers: hide all messages initially
  document.querySelectorAll('[data-hubspot-message] > div').forEach(el => el.classList.add('hidden'));

  // Ensure consent is checked before submitting
  if (!consentCheckbox.checked) {
    document.querySelector('[data-hubspot-consent-error]').classList.remove('hidden');
    return;
  }

  const data = {
    fields: Array.from(formData.entries()).map(([name, value]) => ({
      name,
      value
    }))
  };

  try {
    const response = await fetch(
      'https://api-eu1.hsforms.com/submissions/v3/integration/submit/143630396/b7e64c0d-fc4b-4940-bad4-adbf03471f8f',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    document
      .querySelector(response.ok ? '[data-hubspot-success]' : '[data-hubspot-error]')
      .classList.remove('hidden');

    if (response.ok) form.reset();
  } catch (error) {
    document.querySelector('[data-hubspot-error]').classList.remove('hidden');
  }
});
