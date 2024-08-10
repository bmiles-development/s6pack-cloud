"use strict";

const googleRecaptcha = require("google-recaptcha");

const captcha = new googleRecaptcha({
  secret: process.env.RECAPTCHA_SITE_SECRET,
});

exports.handler = (event, context, callback) => {
  let captchaResponse = event.captchaResponse;

  const response = {
    statusCode: 200,
    body: {
      messageType: "captcha_verified",
      message: "Captcha correct",
      input: event,
    },
  };
  
  captcha.verify({ response: captchaResponse }, (error) => {
    if (error) {
      return callback(null, {
        statusCode: 400,
        error: {
          message: error,
          errorType: 'captcha_verification_error',
        },
      });
    }

    return callback(null, response);
  });
  
};