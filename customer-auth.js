const CUSTOMER_API_BASE = 'https://api.pioneerlegacyworks.com';
const CUSTOMER_SITE_KEY = 'pioneer-outdoor-services';
const CUSTOMER_PORTAL_URL = 'https://customers.pioneeroutdoorservices.com/app';

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
    throw new Error(payload?.error?.message || payload?.message || 'Unable to complete that request.');
  }

  return payload;
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!authForm) return;

  setAuthStatus('');
  setSubmitting(true);

  const data = new FormData(authForm);
  const mode = authForm.dataset.mode;

  try {
    if (mode === 'register') {
      const password = String(data.get('password') || '');
      if (password.length < 10) {
        throw new Error('Password must be at least 10 characters.');
      }

      await customerRequest('/api/customer/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          displayName: String(data.get('displayName') || '').trim(),
          email: String(data.get('email') || '').trim(),
          phone: String(data.get('phone') || '').trim(),
          password,
          siteKey: CUSTOMER_SITE_KEY,
        }),
      });
      setAuthStatus('Account created. Opening your customer portal…', true);
    } else {
      await customerRequest('/api/customer/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: String(data.get('email') || '').trim(),
          password: String(data.get('password') || ''),
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
