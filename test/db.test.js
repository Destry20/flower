// Тесты хранилища server/db.js. Работают на одноразовом файле во временной
// папке (VIVOROSE_DB_FILE), реальную server/data/db.json не трогают.
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TMP_DB = path.join(os.tmpdir(), `vivorose-db-test-${process.pid}-${Date.now()}.json`);
process.env.VIVOROSE_DB_FILE = TMP_DB;

let db;
before(() => { db = require('../server/db'); });
after(async () => {
  await db.flush(); // дождаться незавершённых записей, иначе rename упадёт на удалённый файл
  for (const f of [TMP_DB, TMP_DB + '.tmp']) {
    try { fs.rmSync(f, { force: true }); } catch { /* ignore */ }
  }
});

const DAY = 24 * 60 * 60 * 1000;

/* ---------------- users ---------------- */

test('createUser / findUserByEmail is case- and whitespace-insensitive', () => {
  const u = db.createUser({ email: '  Alice@Example.COM ', passwordHash: 'h', name: 'Alice' });
  assert.equal(u.email, 'alice@example.com');
  assert.equal(db.findUserByEmail('ALICE@example.com').id, u.id);
  assert.equal(db.findUserById(u.id).id, u.id);
  assert.equal(db.findUserByEmail('nobody@example.com'), null);
});

test('createUser stores provider and defaults it to password', () => {
  const g = db.createUser({ email: 'g@example.com', passwordHash: 'h', provider: 'google' });
  const p = db.createUser({ email: 'p@example.com', passwordHash: 'h', provider: 'whatever' });
  assert.equal(g.provider, 'google');
  assert.equal(p.provider, 'password');
});

test('reset-token lookup respects the hash and the expiry', () => {
  const u = db.createUser({ email: 'reset@example.com', passwordHash: 'old' });
  db.setResetToken(u.id, 'tokenhash', Date.now() + 1000);
  assert.equal(db.findUserByResetTokenHash('tokenhash').id, u.id);

  db.setResetToken(u.id, 'tokenhash', Date.now() - 1000); // expired
  assert.equal(db.findUserByResetTokenHash('tokenhash'), null);

  db.setResetToken(u.id, 'tokenhash', Date.now() + 1000);
  db.updateUserPassword(u.id, 'new');
  assert.equal(db.findUserById(u.id).passwordHash, 'new');
  assert.equal(db.findUserByResetTokenHash('tokenhash'), null, 'token cleared after password change');
});

/* ---------------- cards ---------------- */

test('createCard: guest cards expire in ~30 days, account cards never', () => {
  const guest = db.createCard({ userId: null, encodedData: 'x', occasion: 'love', to: 'A', from: 'B' });
  const owned = db.createCard({ userId: 'user-1', encodedData: 'y', occasion: 'love' });

  assert.equal(owned.expiresAt, null);
  assert.ok(guest.expiresAt > Date.now() + 29 * DAY && guest.expiresAt < Date.now() + 31 * DAY);
  assert.match(guest.shortId, /^[A-Za-z0-9]{7}$/);
  assert.notEqual(guest.shortId, owned.shortId);
});

test('createCard truncates to/from to 30 chars', () => {
  const c = db.createCard({ userId: 'u', encodedData: 'z', to: 'x'.repeat(50), from: 'y'.repeat(50) });
  assert.equal(c.to.length, 30);
  assert.equal(c.from.length, 30);
});

test('findCardByShortId hides expired guest cards', () => {
  const c = db.createCard({ userId: null, encodedData: 'q' });
  assert.equal(db.findCardByShortId(c.shortId).id, c.id);
  // подделываем срок в прошлое
  c.expiresAt = Date.now() - 1000;
  assert.equal(db.findCardByShortId(c.shortId), null);
});

test('markCardOpened sets openedAt once and ignores bots', () => {
  const c = db.createCard({ userId: 'u', encodedData: 'e' });
  db.markCardOpened(c.shortId, 'TelegramBot (like TwitterBot)');
  assert.equal(db.findCardByShortId(c.shortId).openedAt, null, 'bot open not recorded');

  db.markCardOpened(c.shortId, 'Mozilla/5.0 (real browser)');
  const opened = db.findCardByShortId(c.shortId).openedAt;
  assert.ok(opened > 0);

  db.markCardOpened(c.shortId, 'Mozilla/5.0 (real browser)');
  assert.equal(db.findCardByShortId(c.shortId).openedAt, opened, 'second open does not move the date');
});

test('listCardsByUser filters by owner and sorts newest first', () => {
  const uid = 'list-owner';
  const a = db.createCard({ userId: uid, encodedData: '1' });
  const b = db.createCard({ userId: uid, encodedData: '2' });
  db.createCard({ userId: 'someone-else', encodedData: '3' });
  const list = db.listCardsByUser(uid);
  assert.deepEqual(list.map(c => c.id), [b.id, a.id]);
});

test('deleteCard only removes the caller’s own card', () => {
  const c = db.createCard({ userId: 'owner-x', encodedData: 'd' });
  assert.equal(db.deleteCard(c.id, 'intruder'), false);
  assert.ok(db.findCardByShortId(c.shortId));
  assert.equal(db.deleteCard(c.id, 'owner-x'), true);
  assert.equal(db.findCardByShortId(c.shortId), null);
});

/* ---------------- group cards ---------------- */

test('addGroupContribution enforces the cap and the closed state', () => {
  const g = db.createGroupCard({ to: 'Team', occasion: 'birthday', userId: 'org-1' });
  for (let i = 0; i < db.MAX_CONTRIBUTIONS; i++) {
    const r = db.addGroupContribution(g.shortId, { name: `p${i}`, message: 'hi', flowerType: 'rose', flowerColor: '#f00' });
    assert.equal(r.ok, true);
  }
  const full = db.addGroupContribution(g.shortId, { name: 'late', message: 'hi' });
  assert.deepEqual(full, { ok: false, reason: 'full' });
});

test('closeGroupCard is organizer-only and blocks further signing', () => {
  const g = db.createGroupCard({ to: 'X', userId: 'org-2' });
  assert.deepEqual(db.closeGroupCard(g.shortId, 'not-org'), { ok: false, reason: 'forbidden' });

  const ok = db.closeGroupCard(g.shortId, 'org-2');
  assert.equal(ok.ok, true);
  assert.equal(db.isGroupCardClosed(db.findGroupCardByShortId(g.shortId)), true);
  assert.deepEqual(db.addGroupContribution(g.shortId, { name: 'a' }), { ok: false, reason: 'closed' });
  assert.deepEqual(db.closeGroupCard(g.shortId, 'org-2'), { ok: false, reason: 'already_closed' });
});

test('listGroupCardsByUser scopes to the organizer', () => {
  const mine = db.createGroupCard({ to: 'M', userId: 'org-3' });
  db.createGroupCard({ to: 'N', userId: 'org-4' });
  const list = db.listGroupCardsByUser('org-3');
  assert.equal(list.length, 1);
  assert.equal(list[0].id, mine.id);
});

/* ---------------- important dates ---------------- */

test('createDateReminder returns a sane daysUntil and enforces the per-user scope on delete', () => {
  const soon = new Date(Date.now() + 5 * DAY);
  const entry = db.createDateReminder({
    userId: 'date-user', name: 'Ann', occasion: 'birthday',
    month: soon.getMonth() + 1, day: soon.getDate(), lang: 'ru'
  });
  assert.ok(entry.daysUntil >= 4 && entry.daysUntil <= 6, `daysUntil ~5, got ${entry.daysUntil}`);
  assert.equal(db.countDatesByUser('date-user'), 1);

  assert.equal(db.deleteDateReminder(entry.id, 'other-user'), false);
  assert.equal(db.deleteDateReminder(entry.id, 'date-user'), true);
  assert.equal(db.countDatesByUser('date-user'), 0);
});

test('listDueDateReminders surfaces dates within the lead window, then markDateReminderNotified clears them', () => {
  const inTwoDays = new Date(Date.now() + 2 * DAY);
  const e = db.createDateReminder({
    userId: 'due-user', name: 'Bo', occasion: 'love',
    month: inTwoDays.getMonth() + 1, day: inTwoDays.getDate(), lang: 'en'
  });
  const due = db.listDueDateReminders(3).filter(d => d.id === e.id);
  assert.equal(due.length, 1);
  assert.equal(typeof due[0].occurrenceYear, 'number');

  db.markDateReminderNotified(e.id, due[0].occurrenceYear);
  assert.equal(db.listDueDateReminders(3).filter(d => d.id === e.id).length, 0);
});

/* ---------------- garden (saved cards) ---------------- */

test('garden: duplicate detection is per user + encodedData', () => {
  assert.equal(db.findGardenDuplicate('garden-u', 'PAYLOAD'), null);
  const g = db.createGardenEntry({ userId: 'garden-u', encodedData: 'PAYLOAD' });
  assert.equal(db.findGardenDuplicate('garden-u', 'PAYLOAD').id, g.id);
  assert.equal(db.findGardenDuplicate('other-u', 'PAYLOAD'), null);
  assert.equal(db.countGardenByUser('garden-u'), 1);

  assert.equal(db.deleteGardenEntry(g.id, 'other-u'), false);
  assert.equal(db.deleteGardenEntry(g.id, 'garden-u'), true);
});

/* ---------------- admin: site switch, counters, traffic, errors ---------------- */

test('site switch defaults to enabled', () => {
  assert.equal(db.getSiteEnabled(), true);
  db.setSiteEnabled(false);
  assert.equal(db.getSiteEnabled(), false);
  db.setSiteEnabled(true);
});

test('public "cards created" counter only goes up', () => {
  const before = db.getCardsCreatedTotal();
  assert.equal(db.incrementCardsCreated(), before + 1);
  assert.equal(db.getCardsCreatedTotal(), before + 1);
});

test('recordVisit splits humans and bots into separate buckets', () => {
  const start = db.getTrafficSummary();
  db.recordVisit('/', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
  db.recordVisit('/', 'facebookexternalhit/1.1');
  const end = db.getTrafficSummary();
  assert.equal(end.today, start.today + 1);
  assert.equal(end.todayBot, start.todayBot + 1);
});

test('recordClientError caps the log and clearClientErrors empties it', () => {
  for (let i = 0; i < 205; i++) db.recordClientError({ message: `boom ${i}`, url: '/', userAgent: 'x' });
  const errs = db.listClientErrors();
  assert.equal(errs.length, 200, 'capped at 200');
  assert.equal(errs[0].message, 'boom 204', 'newest first');
  db.clearClientErrors();
  assert.equal(db.listClientErrors().length, 0);
});

test('adminDeleteUser cascades to that user’s cards and group cards', () => {
  const u = db.createUser({ email: 'cascade@example.com', passwordHash: 'h' });
  const c = db.createCard({ userId: u.id, encodedData: 'c' });
  const g = db.createGroupCard({ to: 'T', userId: u.id });

  assert.equal(db.adminDeleteUser(u.id), true);
  assert.equal(db.findUserById(u.id), null);
  assert.equal(db.findCardByShortId(c.shortId), null);
  assert.equal(db.findGroupCardByShortId(g.shortId), null);
});

test('listRecentUsers supports a case-insensitive email/name query', () => {
  db.createUser({ email: 'searchme@example.com', passwordHash: 'h', name: 'Zoltan' });
  assert.ok(db.listRecentUsers(15, 'ZOLTAN').some(u => u.email === 'searchme@example.com'));
  assert.ok(db.listRecentUsers(15, 'searchme').some(u => u.email === 'searchme@example.com'));
  assert.equal(db.listRecentUsers(15, 'no-such-person').length, 0);
});
