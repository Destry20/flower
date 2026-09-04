// Автоматический ежедневный бэкап базы на почту — подстраховка на случай
// повреждения/потери volume на Railway (сам volume защищает только от
// стирания данных при редеплое, см. историю в чате с пользователем; это не
// заменяет persistent volume, а дополняет его вторым, независимым местом
// хранения копии).
//
// Время последней отправки хранится в самой базе (db.getLastBackupAt/
// setLastBackupAt), а не в памяти процесса — если бы хранили только в
// памяти, каждый рестарт/редеплой сервера (а они частые) сбрасывал бы отсчёт
// и мог начать слать письма чаще, чем раз в сутки.
const db = require('./db');
const { sendBackupEmail } = require('./mailer');

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
// Как часто проверяем, не пора ли слать — не обязано совпадать с самим
// интервалом бэкапа, достаточно проверять заметно чаще, чтобы не проспать
// нужный момент больше чем на час.
const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const BACKUP_EMAIL_TO = process.env.BACKUP_EMAIL_TO || 'vivorosesupport@gmail.com';

async function maybeSendBackup(){
  const last = db.getLastBackupAt();
  if(last && Date.now() - last < BACKUP_INTERVAL_MS) return;
  try{
    await sendBackupEmail(BACKUP_EMAIL_TO, db.getDbSnapshot());
    db.setLastBackupAt(Date.now());
    console.log(`[backup] Бэкап базы отправлен на ${BACKUP_EMAIL_TO}`);
  }catch(e){
    // Не мешаем работе сайта из-за сбоя почты — просто пробуем снова на
    // следующей проверке (через CHECK_INTERVAL_MS), lastBackupAt не трогаем.
    console.error('[backup] Не удалось отправить бэкап:', e.message);
  }
}

function startBackupScheduler(){
  maybeSendBackup();
  setInterval(maybeSendBackup, CHECK_INTERVAL_MS);
}

module.exports = { startBackupScheduler };
