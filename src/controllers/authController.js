import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import User from '../models/user.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import Session from '../models/session.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendMail.js';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';

export const registerUser = async (req, res, next) => {
  const { email, password } = req.body; //деструктурую тіло запиту

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(createHttpError(400, 'Email is use')); //якщо юзер з таким імеіл є то викидаємо помилку
  }
  const heshedPass = await bcrypt.hash(password, 10); //хешуємо пароль
  const newUser = await User.create({
    //створю юзера
    email,
    password: heshedPass,
  });

  const newSession = await createSession(newUser._id); //Створюю сесію передаю Id новоствореного юзера генеруємо пару токенів і зберігаємо сесію.

  setSessionCookies(res, newSession); // Викликаємо, передаємо об'єкт відповіді та сесію

  res.status(201).json(newUser); //у відповідь летить юзер без пароля через метод toJSON() у моделі юзера
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body; //деструктурую тіло запиту
  const user = await User.findOne({ email });
  if (!user) {
    return next(createHttpError(401, 'Invalid credentials')); //Перевіряємо чи користувач з такою поштою існує
  }
  const isValidPass = await bcrypt.compare(password, user.password);
  if (!isValidPass) {
    return next(createHttpError(401, 'Invalid credentials')); //Перевіряємо чи пароль валідний через хеші паролів
  }

  await Session.deleteOne({ userId: user._id }); //Видаляю стару сесію перед логіном якщо вона є
  const newSession = await createSession(user._id); //Створюю сесію передаю Id залогіненого юзера та генеруємо пару токенів і зберігаємо сесію.
  setSessionCookies(res, newSession); // Викликаємо, передаємо об'єкт відповіді та сесію
  res.status(200).json(user);
};

export const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies; //Ми отримуємо sessionId з cookies

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId }); //Якщо він є, видаляємо відповідну сесію з бази даних
  }
  res.clearCookie('sessionId');
  res.clearCookie('accessToken'); //видалення всіх куків
  res.clearCookie('refreshToken');

  res.status(204).send();
};

export const refreshUserSession = async (req, res, next) => {
  const session = await Session.findOne({
    //Знаходимо поточну сесію за id сесії та рефреш токеном
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  if (!session) {
    //Якщо такої сесії нема, повертаємо помилку
    return next(createHttpError(401, 'Session not found'));
  }

  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil); //Якщо сесія існує, перевіряємо валідність рефреш токена

  if (isSessionTokenExpired) {
    //Якщо термін дії рефреш токена вийшов, повертаємо помилку
    return next(createHttpError(401, 'Session token expired'));
  }
  await Session.deleteOne({
    //видаляємо поточну сесію
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });
  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);
  res.status(200).json({
    message: 'Session refreshed',
  });
};

export const requestResetEmail = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email }); //Знаходиму юзера за поштою
  if (!user) {
    return res.status(200).json({
      message: 'If this email exists, a reset link has been sent',
    });
  }
  const resetToken = jwt.sign(
    { sub: user._id, email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  const templatePath = path.resolve('src/templates/reset-password-email.html'); //Формуємо шлях до шаблона
  const templateSource = await fs.readFile(templatePath, 'utf-8'); //Читаємо шаблон
  const template = handlebars.compile(templateSource); //Готуємо шаблон до заповнення
  //Формуємо із шаблона HTML документ з динамічними даними
  const html = template({
    name: user.username,
    link: `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`,
  });

  try {
    await sendEmail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your password',
      html, //Передаємо HTML у функцію надписання пошти
    });
  } catch {
    next(
      createHttpError(500, 'Failed to send the email, please try again later.'),
    );
    return;
  }
  res
    .status(200)
    .json({ message: 'If this email exists, a reset link has been sent' });
};

export const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;
  //Перевіряємо/декодуємо токен
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Повертаємо помилку якщо проблема при декодуванні
    next(createHttpError(401, 'Invalid or expired token'));
    return;
  }
  //Шукаємо користувача
  const user = await User.findOne({ _id: payload.sub, email: payload.email });
  if (!user) {
    next(createHttpError(404, 'User not found'));
    return;
  }
  //Якщо користувач існує створюємо новий пароль і оновлюємо користувача
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: user._id }, { password: hashedPassword });
  //Чистимо старі сесії
  await Session.deleteMany({ userId: user._id });
  res
    .status(200)
    .json({ message: 'Password reset successfully. Please log in again.' });
};
