import transporter from "../../config/email/emailTransporter.js"
import nodemailer from "nodemailer"
import logger from '../shared/logger.js';

export const sendAccountActivation = async (email, token) => {
    const info = await transporter.sendMail({
        from: 'My App<info@my-app.io>',
        to: email,
        subject: 'Account Activation',
        html: `<div>Kindly click this link to activate your account! </div>

        <div>
            <a href="http://localhost:8080/#/login?token=${token}">Activate</a>
        </div>`,
    });

    if (process.env.NODE_ENV === 'development') {
        logger.info('url: ' + nodemailer.getTestMessageUrl(info));
        console.log('url: ' + nodemailer.getTestMessageUrl(info));
    }
};

export const sendPasswordReset = async (email, token) => {
    const info = await transporter.sendMail({
        from: 'My App<info@my-app.io>',
        to: email,
        subject: 'Password Reset',
        html: `<div>Kindly click this link to reset your password! </div>

        <div>
            <a href="http://localhost:8080/#/password-reset?reset=${token}">Reset</a>
        </div>`,
    });

    if (process.env.NODE_ENV === 'development') {
        logger.info('url: ' + nodemailer.getTestMessageUrl(info));
        console.log('url: ' + nodemailer.getTestMessageUrl(info));
    }
};

