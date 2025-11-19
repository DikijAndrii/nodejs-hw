import createHttpError from 'http-errors';
import Session from '../models/session.js';
import User from '../models/user.js';

export const authenticate = async (req, res, next) => {
  if (!req.cookies.accessToken) {
    //Перевіряємо наявність accessToken
    next(createHttpError(401, 'Missing access token'));
    return;
  }
  const session = await Session.findOne({
    //Якщо access токен існує, шукаємо сесію
    accessToken: req.cookies.accessToken,
  });
  if (!session) {
    //Якщо такої сесії нема, повертаємо помилку
    next(createHttpError(401, 'Session not found'));
    return;
  }
  const isAccessTokenExpired =
    //Перевіряємо термін дії access токена
    new Date() > new Date(session.accessTokenValidUntil);

  if (isAccessTokenExpired) {
    return next(createHttpError(401, 'Access token expired'));
  }

  const user = await User.findById(session.userId); //Якщо з токеном все добре і сесія існує, шукаємо користувача
  if (!user) {
    next(createHttpError(401));
    return;
  }
  req.user = user; //Якщо користувач існує, додаємо його до запиту
  next();
};
