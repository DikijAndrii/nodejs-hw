import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  //nodemailer автоматично підбере безпечні налаштування відповідно до порту та відповіді сервера.
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEMail = async (options) => {
  // створює з'єднання зі SMTP-сервером.

  return await transporter.sendMail(options);
};
