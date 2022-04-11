import transporter from "../../config/email/emailTransporter.js"
import nodemailer from "nodemailer"

const sendAccountActivation = async (email, token) => {
    const info = await transporter.sendMail({
      from: 'My app<info@my-app.io>',
      to: email,
      subject: 'Account Activation',
        html: `<div>Kindly click this link to activate your account! </div>

        <div>
            <a href="http://localhost:8080/#/login?token=${token}">Activate</a>
        </div>`
    });

    if (process.env.NODE_ENV === "development") {
        console.log("url: " + nodemailer.getTextMessageUrl(info));
    }
}

export default sendAccountActivation