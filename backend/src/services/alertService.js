const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendBrevoEmail({ to, subject, htmlContent, textContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Keep-Alive Monitor';

  if (!to) return false;

  if (!apiKey || !senderEmail) {
    console.warn(
      `[AlertService] BREVO_API_KEY ou BREVO_SENDER_EMAIL não configurado. E-mail para "${to}" omitido.`
    );
    return false;
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent,
        ...(textContent ? { textContent } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(
        `[AlertService] Falha ao enviar e-mail via Brevo (HTTP ${response.status}): ${errorText}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('[AlertService] Erro ao enviar e-mail via Brevo:', error);
    return false;
  }
}

/**
 * Dispara notificação por e-mail via Brevo quando um projeto fica OFFLINE
 * ou quando se recupera de OFFLINE para ONLINE.
 */
export async function sendStatusAlert(project, log, previousStatus) {
  const isOffline = log.status === 'OFFLINE';
  const isRecovery = previousStatus === 'OFFLINE' && log.status === 'ONLINE';

  if ((!isOffline && !isRecovery) || !project.notificationEmail) {
    return;
  }

  const subject = isRecovery
    ? `[Keep-Alive] Serviço recuperado: ${project.name} está ONLINE`
    : `[Keep-Alive] Alerta de indisponibilidade: ${project.name} está OFFLINE`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #18181b;">
      <h2 style="margin-bottom: 8px;">${isRecovery ? 'Serviço recuperado' : 'Falha detectada no monitoramento'}</h2>
      <p style="margin-top: 0; color: #52525b;">
        O projeto <strong>${escapeHtml(project.name)}</strong> (${escapeHtml(project.providerInfo)}) mudou para <strong>${escapeHtml(log.status)}</strong>.
      </p>
      <ul style="padding-left: 18px; color: #27272a;">
        <li><strong>URL:</strong> ${escapeHtml(project.pingUrl)}</li>
        <li><strong>Código HTTP:</strong> ${escapeHtml(log.httpStatus)}</li>
        <li><strong>Latência:</strong> ${escapeHtml(log.httpLatencyMs)} ms</li>
        <li><strong>Gatilho:</strong> ${escapeHtml(log.triggerType)}</li>
        ${log.errorMessage ? `<li><strong>Erro:</strong> ${escapeHtml(log.errorMessage)}</li>` : ''}
      </ul>
    </div>
  `;

  const textContent = [
    isRecovery ? `Serviço recuperado: ${project.name}` : `Falha detectada: ${project.name}`,
    `Status: ${log.status}`,
    `URL: ${project.pingUrl}`,
    `HTTP: ${log.httpStatus} | Latência: ${log.httpLatencyMs} ms`,
    log.errorMessage ? `Erro: ${log.errorMessage}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  await sendBrevoEmail({
    to: project.notificationEmail,
    subject,
    htmlContent,
    textContent,
  });
}

/**
 * Envia o link de redefinição de senha via Brevo.
 */
export async function sendPasswordResetEmail({ email, resetUrl }) {
  const subject = '[Keep-Alive] Redefinição de senha';
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #18181b;">
      <h2 style="margin-bottom: 8px;">Redefinir sua senha</h2>
      <p style="color: #52525b;">
        Recebemos uma solicitação para criar uma nova senha para a sua conta no Keep-Alive Monitor.
      </p>
      <p style="margin: 24px 0;">
        <a href="${escapeHtml(resetUrl)}" style="background-color: #18181b; color: #fafafa; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Criar nova senha
        </a>
      </p>
      <p style="font-size: 12px; color: #71717a;">
        Este link expira em 15 minutos. Se você não solicitou a troca, ignore este e-mail.
      </p>
    </div>
  `;

  const textContent = `Redefina sua senha no Keep-Alive Monitor acessando o link (válido por 15 minutos): ${resetUrl}`;

  return sendBrevoEmail({
    to: email,
    subject,
    htmlContent,
    textContent,
  });
}
