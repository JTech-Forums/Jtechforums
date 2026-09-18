const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local') });
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const rateLimit = require('express-rate-limit');

const DISCOURSE_API_KEY = defineSecret('DISCOURSE_API_KEY');
const CONTACT_SMTP_PASS = defineSecret('CONTACT_SMTP_PASS');
const DEFAULT_DISCOURSE_API_BASE = 'https://jtechforums.org';
const DEFAULT_DISCOURSE_API_USERNAME = 'system';

const buildForumBase = () =>
  (process.env.DISCOURSE_API_BASE || DEFAULT_DISCOURSE_API_BASE).replace(/\/$/, '');
const getUsername = () => process.env.DISCOURSE_API_USERNAME || DEFAULT_DISCOURSE_API_USERNAME;

const sanitizeCategory = (value = '') => value.replace(/[^a-z0-9/-]/gi, '').replace(/\.\./g, '');

const getDiscourseApiKey = () => {
  if (process.env.DISCOURSE_API_KEY) {
    return process.env.DISCOURSE_API_KEY;
  }

  try {
    return DISCOURSE_API_KEY.value();
  } catch (error) {
    logger.warn('Discourse API secret unavailable via Secret Manager', error);
    return '';
  }
};

const proxyJson = async (res, endpoint, cacheSeconds = 300) => {
  const apiKey = getDiscourseApiKey();
  if (!apiKey) {
    res.status(500).json({ error: 'Forum API secret is not configured.' });
    return;
  }

  const forumBase = buildForumBase();
  const apiUsername = getUsername();

  try {
    const response = await fetch(`${forumBase}${endpoint}`, {
      headers: {
        'Api-Key': apiKey,
        'Api-Username': apiUsername,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      res.status(response.status).json({ error: 'Discourse request failed', detail });
      return;
    }

    const payload = await response.json();
    res.set('Cache-Control', `public, max-age=${cacheSeconds}`);
    res.json(payload);
  } catch (error) {
    logger.error('Discourse proxy error', error);
    res.status(502).json({ error: 'Unable to reach Discourse', detail: error.message });
  }
};

let recaptchaClient;

const getRecaptchaClient = () => {
  if (!recaptchaClient) {
    recaptchaClient = new RecaptchaEnterpriseServiceClient();
  }
  return recaptchaClient;
};

const getContactConfig = () => {
  const host = process.env.CONTACT_SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.CONTACT_SMTP_PORT || 465);
  const secure = process.env.CONTACT_SMTP_SECURE
    ? process.env.CONTACT_SMTP_SECURE !== 'false'
    : port === 465;

  const config = {
    host,
    port,
    secure,
    user: process.env.CONTACT_SMTP_USER || '',
    pass: CONTACT_SMTP_PASS.value() || '',
    to: process.env.CONTACT_TO_EMAIL || '',
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || '',
    recaptchaProjectId: process.env.RECAPTCHA_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '',
    recaptchaMinScore: Number(process.env.RECAPTCHA_MIN_SCORE || 0.5),
  };

  // Validate required configuration
  if (!config.user || !config.to) {
    throw new Error('CONTACT_SMTP_USER and CONTACT_TO_EMAIL are required');
  }

  return config;
};

const escapeHtml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const sendContactEmail = async ({ name, email, phone, message }) => {
  const config = getContactConfig();

  if (!config.pass) {
    throw new Error('Contact email transport is not configured.');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    '',
    message,
  ].join('\n');

  const escapedLines = [
    `Name: ${escapeHtml(name)}`,
    `Email: ${escapeHtml(email)}`,
    `Phone: ${escapeHtml(phone)}`,
    '',
    escapeHtml(message),
  ].join('\n');

  await transporter.sendMail({
    from: `"JTech Website" <${config.user}>`,
    to: config.to,
    subject: `New JTech contact from ${name}`,
    text: lines,
    html: escapedLines
      .split('\n')
      .map((line) => `<p>${line.replace(/\n/g, '<br/>')}</p>`)
      .join('')
      .replace(/<p><\/p>/g, '<br/>'),
    replyTo: email,
  });
};

const verifyRecaptcha = async (token) => {
  const { recaptchaSiteKey, recaptchaProjectId, recaptchaMinScore } = getContactConfig();
  if (!recaptchaSiteKey || !recaptchaProjectId) return true;
  if (!token) return false;

  try {
    const client = getRecaptchaClient();
    const request = {
      parent: client.projectPath(recaptchaProjectId),
      assessment: {
        event: {
          token,
          siteKey: recaptchaSiteKey,
        },
      },
    };

    const [assessment] = await client.createAssessment(request);
    const { tokenProperties, riskAnalysis } = assessment;

    if (!tokenProperties?.valid) {
      logger.warn('reCAPTCHA Enterprise invalid token', tokenProperties);
      return false;
    }

    if (tokenProperties.action && tokenProperties.action !== 'contact') {
      logger.warn('Unexpected reCAPTCHA action', tokenProperties.action);
      return false;
    }

    const score = typeof riskAnalysis?.score === 'number' ? riskAnalysis.score : 1;
    if (score < recaptchaMinScore) {
      logger.warn('reCAPTCHA score below threshold', { score, recaptchaMinScore, reasons: riskAnalysis?.reasons });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('reCAPTCHA Enterprise verification error', error);
    return false;
  }
};

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use((req, _res, next) => {
  logger.info('Incoming request', { path: req.path, query: req.query });
  next();
});

const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 contact requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many contact requests from this IP, please try again later.',
  },
});

app.post(['/contact', '/api/contact'], contactRateLimiter, async (req, res) => {
  const payload = req.body || {};
  const honeypot = (payload._honey || '').trim();
  if (honeypot) {
    return res.status(200).json({ ok: true, message: 'Message received.' });
  }

  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim();
  const phone = (payload.phone || '').trim();
  const message = (payload.message || '').trim();
  const token = payload.recaptchaToken || '';

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const captchaOk = await verifyRecaptcha(token);
  if (!captchaOk) {
    return res.status(400).json({ error: 'Unable to verify you are human.' });
  }

  try {
    await sendContactEmail({ name, email, phone, message });
    return res
      .status(202)
      .json({ ok: true, message: 'Message sent. Thanks for reaching out!' });
  } catch (error) {
    logger.error('Failed to deliver contact email', error);
    return res.status(502).json({
      error: 'Unable to send email right now. Please try again later.',
    });
  }
});

const forumRouter = express.Router();

forumRouter.get('/forum/latest', async (req, res) => {
  const page = Number.isInteger(Number(req.query.page)) ? req.query.page : 0;
  const rawCategory = req.query.category ? String(req.query.category) : '';
  const categorySegment = rawCategory ? `/c/${sanitizeCategory(rawCategory)}/l/latest.json` : '/latest.json';
  await proxyJson(res, `${categorySegment}?page=${page}&include_excerpt=true`);
});

forumRouter.get('/forum/about', async (_req, res) => {
  await proxyJson(res, '/about.json', 600);
});

forumRouter.get('/forum/staff/weekly', async (_req, res) => {
  await proxyJson(res, '/directory_items.json?period=weekly&order=likes_received&role=staff', 600);
});

forumRouter.get('/forum/topic/:id', async (req, res) => {
  const topicId = Number(req.params.id);
  if (!topicId) {
    res.status(400).json({ error: 'Invalid topic id' });
    return;
  }
  await proxyJson(res, `/t/${topicId}.json`, 120);
});

forumRouter.get('/forum/leaderboard/:id', async (req, res) => {
  const leaderboardId = Number(req.params.id);
  if (!leaderboardId) {
    res.status(400).json({ error: 'Invalid leaderboard id' });
    return;
  }
  const period = typeof req.query.period === 'string' ? req.query.period : '';
  const periodSegment = period ? `?period=${encodeURIComponent(period)}` : '';
  await proxyJson(res, `/leaderboard/${leaderboardId}.json${periodSegment}`, 600);
});

app.use('/', forumRouter);
app.use('/api', forumRouter);

exports.forumApi = onRequest(
  {
    region: 'us-central1',
    secrets: [DISCOURSE_API_KEY, CONTACT_SMTP_PASS],
    timeoutSeconds: 30,
  },
  app
);
