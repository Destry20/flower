// Отправка писем для восстановления пароля. Настоящий SMTP не настроен по
// умолчанию — задайте SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM в .env
// (подойдёт, например, Yandex/Gmail app-password или сервис вроде SendGrid).
// Без этих переменных письмо не отправляется, а ссылка на сброс просто
// печатается в консоль сервера — этого достаточно для разработки и тестов,
// но реальным пользователям писем так не доставить.
const nodemailer = require('nodemailer');

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

async function sendPasswordResetEmail(to, resetUrl){
  const t = getTransporter();
  if(!t){
    console.log(`\n[mailer] SMTP не настроен — письмо не отправлено. Ссылка для сброса пароля (${to}):\n${resetUrl}\n`);
    return;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Восстановление пароля — MySweetBouquet',
    text: `Чтобы задать новый пароль, перейдите по ссылке: ${resetUrl}\n\nЕсли вы не запрашивали сброс пароля, просто проигнорируйте это письмо.`,
    html: `<p>Чтобы задать новый пароль, перейдите по ссылке:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>`
  });
}

module.exports = { sendPasswordResetEmail };
