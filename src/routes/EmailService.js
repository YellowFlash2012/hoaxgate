import transporter from "../../config/email/emailTransporter.js"

const sendAccountActivation = async (email, token) => {
    await transporter.sendMail({
        from: 'My app<info@my-app.io>',
        to: email,
        subject: 'Account Activation',
        html: `Token is ${token}`,
    });
}

export default sendAccountActivation