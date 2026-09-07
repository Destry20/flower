// Планировщик напоминаний о важных датах — за REMINDER_LEAD_DAYS до даты,
// добавленной в аккаунте (server/db.js, listDueDateReminders), уходит письмо
// со ссылкой сразу в конструктор. Тот же паттерн, что и у server/backup.js:
// проверяем чаще, чем сам интервал события, чтобы не проспать нужный момент
// больше чем на CHECK_INTERVAL_MS, а не полагаться на редкий cron.
const db = require('./db');
const { sendDateReminderEmail } = require('./mailer');

const REMINDER_LEAD_DAYS = 3;
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

// Ссылка ведёт на конструктор с подставленными именем/поводом — см. bootstrap()
// в public/script/main.js, который читает ?to=&occasion= один раз при первой
// загрузке и до первого рендера подставляет их в state, прежде чем откроется
// #create.
function buildPrefillUrl(name, occasion){
  // Тот же PUBLIC_URL, что и у ссылки сброса пароля (server/routes/auth.js,
  // getBaseUrl) — здесь нет req, откуда сборка "на лету" читает protocol/host,
  // фоновый шедулер работает без запроса, поэтому только переменная окружения
  // с тем же именем и тем же дефолтом на прод-домен.
  const base = (process.env.PUBLIC_URL || 'https://vivorose.com').replace(/\/+$/, '');
  const params = new URLSearchParams({ to: name, occasion: occasion || 'birthday' });
  return `${base}/?${params.toString()}#create`;
}

async function checkDateReminders(){
  let due;
  try{
    due = db.listDueDateReminders(REMINDER_LEAD_DAYS);
  }catch(e){
    console.error('[dateReminders] Не удалось получить список дат:', e.message);
    return;
  }
  for(const item of due){
    const user = db.findUserById(item.userId);
    if(!user){
      // Аккаунт удалили, а запись даты почему-то осталась (не должно
      // случаться — adminDeleteUser чистит cards/groupCards, но на всякий
      // случай не роняем всю проверку из-за одной осиротевшей записи).
      continue;
    }
    try{
      await sendDateReminderEmail(user.email, item.lang, {
        name: item.name,
        daysUntil: item.daysUntil,
        url: buildPrefillUrl(item.name, item.occasion),
        note: item.note
      });
      db.markDateReminderNotified(item.id, item.occurrenceYear);
      console.log(`[dateReminders] Напоминание отправлено: ${user.email} — ${item.name}`);
    }catch(e){
      // Не помечаем notified — попробуем снова на следующей проверке
      // (в пределах REMINDER_LEAD_DAYS ещё есть время).
      console.error('[dateReminders] Не удалось отправить напоминание:', e.message);
    }
  }
}

function startDateReminderScheduler(){
  checkDateReminders();
  setInterval(checkDateReminders, CHECK_INTERVAL_MS);
}

module.exports = { startDateReminderScheduler };
