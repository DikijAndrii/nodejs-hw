import crypto from 'crypto';
import Session from '../models/session.js';
import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/time.js';

export const createSession = async (userId) => {
  const accessToken = crypto.randomBytes(30).toString('base64'); //генерує криптографічно стійку випадкову послідовність, яку ми кодуємо в base64
  const refreshToken = crypto.randomBytes(30).toString('base64'); //генерує криптографічно стійку випадкову послідовність, яку ми кодуємо в base64

  return Session.create({
    //створює access та refresh токени, створює сесію в базі даних і повертає її
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES), //живе недовго — це зменшує ризики у випадку витоку
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY), //живе довше та використовується для отримання нової пари токенів.
  });
};

export const setSessionCookies = (res, session) => {
  res.cookie('accessToken', session.accessToken, {
    httpOnly: true, //браузер не дає доступу до куки з JS
    secure: true, //браузер надсилає таку куку лише через HTTPS.
    sameSite: 'none', //дозволяє надсилати куку у крос-доменних запитах коли бек і фронт на різних доменах
    maxAge: FIFTEEN_MINUTES, //час життя у мілісекундах. Після спливу браузер перестає надсилати куку.
  });

  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ONE_DAY,
  });

  res.cookie('sessionId', session._id, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ONE_DAY,
  });
};
