/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
AZURE Inicio
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

// Import required packages
const path = require('path');
const restify = require('restify');
var twilio = require('twilio');

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter } = require('botbuilder');
const { ActivityTypes } = require('botbuilder-core');


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
AZURE Fim
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */


var env = require('node-env-file')
env(__dirname + '/.env')

if (!process.env.ROCKETCHAT_URL || !process.env.ROCKETCHAT_USER || !process.env.ROCKETCHAT_PASS) {
  usageTip()
}

var Botkit = require('botkit-rocketchat-connector')
var debug = require('debug')('botkit:main')

// the environment variables from RocketChat is passed in bot_options
// because the module it's external, so haven't access to .env file
var botOptions = {
  debug: false,
  studio_token: process.env.studio_token,
  studio_command_uri: process.env.studio_command_uri,
  studio_stats_uri: process.env.studio_command_uri,
  rocketchat_host: process.env.ROCKETCHAT_URL,
  rocketchat_bot_user: process.env.ROCKETCHAT_USER,
  rocketchat_bot_pass: process.env.ROCKETCHAT_PASSWORD,
  rocketchat_ssl: process.env.ROCKETCHAT_USE_SSL,
  rocketchat_bot_rooms: process.env.ROCKETCHAT_ROOM,
  rocketchat_bot_mention_rooms: process.env.MENTION_ROOMS,
  rocketchat_bot_direct_messages: process.env.RESPOND_TO_DM,
  rocketchat_bot_live_chat: process.env.RESPOND_TO_LIVECHAT,
  rocketchat_bot_edited: process.env.RESPOND_TO_EDITED,
  authTokenTwilio: process.env.TWILIO_AUTH
}

// create the Botkit controller with the configurations of the RocketChatBot
var controller = Botkit({}, botOptions)

// imports local conversations to use bot without the botkit api
require(__dirname + '/components/local_conversations.js')(controller)




var normalizedPath = require('path').join(__dirname, 'skills')
require('fs').readdirSync(normalizedPath).forEach(function (file) {
  require('./skills/' + file)(controller)
})

controller.startBot()

controller.startTicking()


// This captures and evaluates any message sent to the bot as a DM
// or sent to the bot in the form "@bot message" and passes it to
// Botkit Studio to evaluate for trigger words and patterns.
// If a trigger is matched, the conversation will automatically fire!
// You can tie into the execution of the script using the functions
if (process.env.studio_token) {
  // TODO: configure the EVENTS here
  controller.on(['direct_message', 'live_chat', 'channel', 'mention', 'message'], function (bot, message) {
    controller.studio.runTrigger(bot, message.text, message.user, message.channel, message).then(function (convo) {
      if (!convo) {
        // no trigger was matched
        // If you want your botbot to respond to every message,
        // define a 'fallback' script in Botkit Studio
        // and uncomment the line below.
        // controller.studio.run(bot, 'fallback', message.user, message.channel);
      } else {
        // set variables here that are needed for EVERY script
        // use controller.studio.before('script') to set variables specific to a script
        convo.setVar('current_time', new Date())
      }
    }).catch(function (err) {
      bot.reply(message, 'Erro encontrado: ' + err)
      debug('Botkit Studio: ', err)
    })
  })
} else {
  console.log('TODO: Integrar com Azure')
}

function usageTip () {
  console.log('~~~~~~~~~~')
  console.log('Bot Rocket com Azure')
  console.log('~~~~~~~~~~')
}
