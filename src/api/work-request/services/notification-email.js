'use strict';

const nodemailer = require('nodemailer');

function addresses(value) {
  return String(value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function notificationRecipients(env = process.env) {
  return {
    to: addresses(env.MYWORK_NOTIFICATION_TO),
    cc: addresses(env.MYWORK_NOTIFICATION_CC),
  };
}

function adminRequestUrl(request, env = process.env) {
  if (!env.MYWORK_ADMIN_URL || !request.documentId) return null;
  const baseUrl = env.MYWORK_ADMIN_URL.replace(/\/$/, '');
  const uid = encodeURIComponent('api::work-request.work-request');
  return `${baseUrl}/content-manager/collection-types/${uid}/${encodeURIComponent(request.documentId)}`;
}

function emailText(request, env = process.env) {
  const lines = [
    'Nouvelle demande MyWork.exe',
    '',
    `Identifiant : ${request.publicId}`,
    `Type : ${request.kind}`,
    `Service : ${request.serviceLabel} (${request.serviceCode})`,
    `Catégorie : ${request.serviceCategory}`,
    `Nom : ${request.name}`,
    `Email : ${request.email}`,
    `Téléphone : ${request.phone || 'Non renseigné'}`,
    `Date souhaitée : ${request.preferredDate || 'Non renseignée'}`,
    `Message : ${request.message || 'Non renseigné'}`,
    `Consentement reçu le : ${request.consentAt}`,
  ];
  const adminUrl = adminRequestUrl(request, env);
  if (adminUrl) lines.push('', `Ouvrir dans Strapi : ${adminUrl}`);
  return lines.join('\n');
}

async function sendNewRequestNotification({ strapi, request, env = process.env }) {
  const recipients = notificationRecipients(env);
  if (!recipients.to.length) {
    strapi.log.warn('MyWork notification skipped: MYWORK_NOTIFICATION_TO is not configured.');
    return false;
  }
  if (!env.MYWORK_SMTP_HOST || !env.MYWORK_SMTP_USER || !env.MYWORK_SMTP_PASSWORD) {
    strapi.log.warn('MyWork notification skipped: SMTP configuration is incomplete.');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: env.MYWORK_SMTP_HOST,
    port: Number(env.MYWORK_SMTP_PORT || 587),
    secure: env.MYWORK_SMTP_SECURE === 'true',
    auth: { user: env.MYWORK_SMTP_USER, pass: env.MYWORK_SMTP_PASSWORD },
  });
  await transporter.sendMail({
    from: env.MYWORK_SMTP_FROM || env.MYWORK_SMTP_USER,
    to: recipients.to,
    cc: recipients.cc.length ? recipients.cc : undefined,
    replyTo: request.email,
    subject: `[MyWork] ${request.kind} — ${request.serviceLabel} — ${request.name}`,
    text: emailText(request, env),
  });
  return true;
}

module.exports = { notificationRecipients, adminRequestUrl, emailText, sendNewRequestNotification };
