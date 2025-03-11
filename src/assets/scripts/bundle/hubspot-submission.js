document.querySelector('[data-hubspot]').addEventListener('submit', async function (event) {
  event.preventDefault(); // Prevent normal form submission

  const form = event.target;
  const formData = new FormData(form);
  const messageContainer = document.querySelector('[data-hubspot-message]');

  const data = {
    fields: Array.from(formData.entries()).map(([name, value]) => ({
      name,
      value
    }))
  };

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

  if (response.ok) {
    messageContainer.textContent = '✅ Form submitted';
    messageContainer.style.color = 'green';
    form.reset();
  } else {
    messageContainer.textContent = '❌ Submission failed';
    messageContainer.style.color = 'red';
  }
});
