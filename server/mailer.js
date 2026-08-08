// Отправка писем для восстановления пароля. Настоящий SMTP не настроен по
// умолчанию — задайте SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM в .env
// (подойдёт, например, Yandex/Gmail app-password или сервис вроде SendGrid).
// Без этих переменных письмо не отправляется, а ссылка на сброс просто
// печатается в консоль сервера — этого достаточно для разработки и тестов,
// но реальным пользователям писем так не доставить.
const nodemailer = require('nodemailer');
const { STRINGS } = require('./i18n');

let transporter = null;
function getTransporter(){
  if(transporter) return transporter;
  if(!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  return transporter;
}

async function sendPasswordResetEmail(to, resetUrl, lang){
  const strings = STRINGS[lang] || STRINGS.ru;
  const t = getTransporter();
  if(!t){
    console.log(`\n[mailer] SMTP не настроен — письмо не отправлено. Ссылка для сброса пароля (${to}):\n${resetUrl}\n`);
    return;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: strings.mailSubject,
    text: strings.mailBodyText(resetUrl),
    html: strings.mailBodyHtml(resetUrl)
  });
}

module.exports = { sendPasswordResetEmail };
