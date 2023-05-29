//3-rd plugin
const ejs = require('ejs');
const { htmlToText } = require('html-to-text');
const nodemailer = require('nodemailer'); //https://nodemailer.com/about/

//期望功能
// new Email(user, url).sendWelcome();
//user => req.user
//url => API
//method sendWelcome => send email to user email say hi ! prototype

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.form = `Natours office <${process.env.EMAIL_FROM_PROD}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //sendGrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_API,
        },
      });
    }

    //nodemailer transport setting
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST, //mailtrap server
      port: process.env.EMAIL_PORT, //mailtrap 2525
      auth: {
        user: process.env.EMAIL_USERNAME, //mailtrap provide
        pass: process.env.EMAIL_PASSWORD, //mailtrap provide
      },
    });
  }

  //選擇傳送template, subject 標題
  async send(content, subject) {
    const htmlFile = await ejs.renderFile(
      `${__dirname}/../views/pages/email/email.ejs`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
        content,
      }
    );

    const mailOption = {
      from: this.form,
      to: this.to,
      subject,
      html: htmlFile,
      text: htmlToText(htmlFile),
    };

    //3. Create a transport and send email
    await this.newTransport().sendMail(mailOption);
  }

  async sendWelcome() {
    //template 需要重新分類ejs
    await this.send('welcome', 'Welcome to the Natrous!');
  }

  async sendResetPassword() {
    //template 需要重新分類ejs
    await this.send('forgetPassword', 'Natrous Password Reset');
  }
};

// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     //using mailtrap testing
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const mailOption = {
//     from: 'Testing Schmedtmann <hello>@natours.io',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html:
//   };
//   //3.
// };

// module.exports = sendEmail;
