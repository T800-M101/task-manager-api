const sgMail = require('@sendgrid/mail');



sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const sendWelcomeEmail = (email, name) => {
    
    sgMail.send({
      to: email,
      from:'tuahil2@gmail.com',
      subject: 'Thanks for joining in!',
      text:`Welcome to the app, ${name}. Let me know how you get along with the app.`,
    
    });
};


const sendEmailOnCancelation = (email, name) => {
    sgMail.send({
        to: email,
        from:'tuahil2@gmail.com',
        subject: 'sorry to see!',
        text:`Dear, ${name}. I'm sorry for your cancelation. Let me know what I can do to get you back!.`,
      
      });
};



module.exports = {
    sendWelcomeEmail,
    sendEmailOnCancelation
};