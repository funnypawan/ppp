// Dream Classes — backend-only SMS OTP providers.
// Secrets are read only from environment variables. Nothing in this module is
// exposed to the student app, Teacher Panel or APK.

function normalizeProvider(value) {
  const p = String(value || '').trim().toLowerCase();
  if (p === 'twofactor' || p === '2-factor') return '2factor';
  return p;
}

function getSmsConfig(env = process.env) {
  const hasMsg91 = !!(env.MSG91_AUTH_KEY && env.MSG91_TEMPLATE_ID);
  const has2Factor = !!env.TWOFACTOR_API_KEY;
  const requested = normalizeProvider(env.SMS_PROVIDER);
  const provider = requested || (hasMsg91 ? 'msg91' : (has2Factor ? '2factor' : ''));
  const missing = [];

  if (provider === 'msg91') {
    if (!env.MSG91_AUTH_KEY) missing.push('MSG91_AUTH_KEY');
    if (!env.MSG91_TEMPLATE_ID) missing.push('MSG91_TEMPLATE_ID');
  } else if (provider === '2factor') {
    if (!env.TWOFACTOR_API_KEY) missing.push('TWOFACTOR_API_KEY');
  } else if (provider) {
    missing.push('SMS_PROVIDER must be msg91 or 2factor');
  } else {
    missing.push('MSG91_AUTH_KEY + MSG91_TEMPLATE_ID, or TWOFACTOR_API_KEY');
  }

  return {
    provider,
    configured: !!provider && missing.length === 0,
    missing,
    msg91Configured: hasMsg91,
    twoFactorConfigured: has2Factor
  };
}

async function readJsonResponse(response) {
  const text = await response.text().catch(() => '');
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { message: text.slice(0, 200) }; }
}

function providerError(provider, data, status) {
  const raw = data?.message || data?.Message || data?.Details || data?.error || '';
  const safeDetail = String(raw || '').replace(/[\r\n]+/g, ' ').slice(0, 160);
  const err = new Error(`${provider} rejected the OTP request (HTTP ${status})${safeDetail ? ': ' + safeDetail : ''}`);
  err.code = 'SMS_PROVIDER_REJECTED';
  err.provider = provider;
  return err;
}

async function sendMsg91({ mobile, code, env, fetchImpl }) {
  const base = String(env.MSG91_API_BASE || 'https://control.msg91.com').replace(/\/+$/, '');
  const params = new URLSearchParams({
    template_id: env.MSG91_TEMPLATE_ID,
    mobile: '91' + mobile,
    otp: code,
    otp_length: '6',
    otp_expiry: String(env.OTP_TTL_MINUTES || 10),
    realTimeResponse: '1'
  });
  const response = await fetchImpl(`${base}/api/v5/otp?${params.toString()}`, {
    method: 'POST',
    headers: { authkey: env.MSG91_AUTH_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(12000)
  });
  const data = await readJsonResponse(response);
  // MSG91 may return HTTP 200 with { type: "error" }; HTTP status alone is
  // never treated as successful delivery/acceptance.
  if (!response.ok || String(data.type || '').toLowerCase() !== 'success') throw providerError('MSG91', data, response.status);
  return { provider: 'msg91', requestId: String(data.request_id || data.requestId || data.message || '').slice(0, 120) };
}

async function send2Factor({ mobile, code, env, fetchImpl }) {
  const base = String(env.TWOFACTOR_API_BASE || 'https://2factor.in/API/V1').replace(/\/+$/, '');
  const parts = [env.TWOFACTOR_API_KEY, 'SMS', '+91' + mobile, code];
  if (env.TWOFACTOR_TEMPLATE_NAME) parts.push(env.TWOFACTOR_TEMPLATE_NAME);
  // The provider's legacy OTP API puts its key in the server-side URL. This URL
  // is never logged or returned by this module.
  const url = base + '/' + parts.map(part => encodeURIComponent(String(part))).join('/');
  const response = await fetchImpl(url, { method: 'POST', signal: AbortSignal.timeout(12000) });
  const data = await readJsonResponse(response);
  if (!response.ok || String(data.Status || '').toLowerCase() !== 'success') throw providerError('2Factor', data, response.status);
  return { provider: '2factor', requestId: String(data.Details || '').slice(0, 120) };
}

async function sendOtpSms({ mobile, code, env = process.env, fetchImpl = fetch }) {
  const config = getSmsConfig(env);
  if (!config.configured) {
    const err = new Error('SMS OTP provider is not configured');
    err.code = 'SMS_NOT_CONFIGURED';
    err.missing = config.missing;
    throw err;
  }
  if (config.provider === 'msg91') return sendMsg91({ mobile, code, env, fetchImpl });
  if (config.provider === '2factor') return send2Factor({ mobile, code, env, fetchImpl });
  const err = new Error('Unsupported SMS OTP provider');
  err.code = 'SMS_NOT_CONFIGURED';
  throw err;
}

module.exports = { getSmsConfig, sendOtpSms };
