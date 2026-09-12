const CUSTOMER_API_BASE = 'https://api.pioneerlegacyworks.com';
const CUSTOMER_SITE_KEY = 'pioneer-outdoor-services';
const CUSTOMER_PORTAL_URL = 'https://customer.pioneeroutdoorservices.com/app';

const authForm = document.querySelector('[data-customer-auth-form]');
const authStatus = document.querySelector('[data-auth-status]');

function setAuthStatus(message, success = false) {
  if (!authStatus) return;
  authStatus.textContent = message || '';
  authStatus.classList.toggle('is-success', Boolean(success));
}

function setSubmitting(submitting) {
  if (!authForm) return;
  const button = authForm.querySelector('button[type="submit"]');
  authForm.querySelectorAll('input, button').forEach((element) => {
    element.disabled = submitting;
  });
  if (button) {
    button.textContent = submitting
      ? (authForm.dataset.mode === 'register' ? 'Creating Account…' : 'Signing In…')
      : (authForm.dataset.mode === 'register' ? 'Create Account' : 'Sign In');
  }
}

async function customerRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${CUSTOMER_API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Unable to reach Pioneer services. Check your connection and try again.');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const validationErrors = payload?.error?.details?.fieldErrors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstMessage = Object.values(validationErrors).flat().find(Boolean);
      if (firstMessage) throw new Error(String(firstMessage));
    }
    throw new Error(payload?.error?.message || payload?.message || 'Unable to complete that request.');
  }

  return payload;
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!authForm) return;

  setAuthStatus('');

  // Read values before disabling controls. Disabled form controls are omitted from FormData.
  const data = new FormData(authForm);
  const mode = authForm.dataset.mode;
  const email = String(data.get('email') || '').trim();
  const password = String(data.get('password') || '');
  const displayName = String(data.get('displayName') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const smsConsent = data.get('smsConsent') === 'true';

  setSubmitting(true);

  try {
    if (mode === 'register') {
      if (password.length < 10) {
        throw new Error('Password must be at least 10 characters.');
      }

      await customerRequest('/api/customer/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          displayName,
          email,
          phone,
          password,
          siteKey: CUSTOMER_SITE_KEY,
          smsConsent,
        }),
      });
      setAuthStatus('Account created. Opening your customer portal…', true);
    } else {
      await customerRequest('/api/customer/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          siteKey: CUSTOMER_SITE_KEY,
        }),
      });
      setAuthStatus('Signed in. Opening your customer portal…', true);
    }

    window.location.assign(CUSTOMER_PORTAL_URL);
  } catch (error) {
    setAuthStatus(error instanceof Error ? error.message : 'Unable to continue.');
    setSubmitting(false);
  }
}

authForm?.addEventListener('submit', handleAuthSubmit);
