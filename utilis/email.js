const nodemailer = require('nodemailer')

const sendMail = async options => {
    // 1 Create a Transpoter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    // 2 define the email options
    const mailOptions = {
        from: 'Amiaya Boss <amiayaprime@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        
    }

    // 3 actually send the email
    await transporter.sendMail(mailOptions)
}

module.exports = sendMail