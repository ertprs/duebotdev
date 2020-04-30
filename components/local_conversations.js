
var wordfilter = require('wordfilter');
const axios = require('axios');
const accountSidTwilio= process.env.TWILIO_SSID;
const authTokenTwilio= process.env.TWILIO_AUTH;
const senderTwilio= process.env.TWILIO_SENDER_NUMBER;



const client = require('twilio')(accountSidTwilio, authTokenTwilio);

axios.defaults.baseURL = 'https://pernres.azurewebsites.net/qnamaker';
axios.defaults.headers.common['Authorization'] = "EndpointKey 7a84cddf-557f-4543-9283-432555f9d665";
axios.defaults.headers.post['Content-Type'] = 'application/json';


module.exports = function localConversations(controller) {

    var stats = {
        triggers: 0,
        convos: 0,
    }
      var azure = {
        resposta: "",
    }

    controller.on('heard_trigger', function() {
        stats.triggers++;
    });


    /* simple example of implementing conversation
    controller.hears(['Olá'], 'direct_message,live_chat,channel,private_channel', function (bot, message) {
        bot.startConversation(message, function (err, convo) {
            convo.say('Olá, sou o bot da Due');
            convo.ask('Qual seu nome?', function (response, convo) {
                convo.say('Legal, bem vindo ' + response.text + ' como posso te ajudar?!');
                convo.next();
            });
        });
    });*/


    // AZURE
    controller.hears(['.*'], 'direct_message,live_chat,channel,private_channel', function (bot, message) {
        bot.startConversation(message, function (err, convo) {
            if(message.msg.includes('Suporte')){
                console.log("Escutei Suporte, vamos trabalhar galera!")
                console.log("Falar com o cliente de número: "+message.u.username)
                convo.say('Obrigado, um agente do suporte irá entrar em contato no número: ' + message.u.username);

                //Twilio - se o usuario digitar suporte manda whats 
                convo.setVar('number', senderTwilio);
                console
                client.messages
                  .create({
                     from: 'whatsapp:'+ senderTwilio,
                     body: 'Olá! Obrigado pelo contato. O código deste atendimento é '+message.u.username+' Como podemos ajudar?',
                     to: 'whatsapp:+5548996774584'
                   })
                  .then(message => console.log(message.sid));





            }
            else{
			     axios
			  .post('/knowledgebases/02040902-1c7b-4cfe-85ca-6e3b11d3b668/generateAnswer', {
			    "question": '"'+message.msg+'"'
			  })
			  .then(res => {
			    azure.resposta=res.data.answers[0].answer
			    if(azure.resposta.includes('No good match')){
  	                convo.say('Desculpe, não entendi, gostaria de falar com um atendende?');
			    }
			    else{

                convo.setVar('respota', azure.resposta);
                convo.say('{{vars.respota}}');
					}
			  })
			  .catch(error => {
			  	console.log(`DEU ERRO`)
			    //console.error(error)
			  })
            
           }
        });

    });

    controller.hears(['^statusBotDue'], 'direct_message,live_chat,channel,private_channel', function(bot, message) {

        bot.createConversation(message, function(err, convo) {
            if (!err) {
                convo.setVar('uptime', formatUptime(process.uptime()));
                convo.setVar('convos', stats.convos);
                convo.setVar('triggers', stats.triggers);

                convo.say('Due bot rodando por {{vars.uptime}}. Desde que reiniciei, escutei {{vars.triggers}} gatilhos e conduzi {{vars.convos}} conversas.');
                convo.activate();
            }
        });

    });

function formatUptime(uptime) {
        var unit = 'segundo';
        if (uptime > 60) {
            uptime = uptime / 60;
            unit = 'minuto';
        }
        if (uptime > 60) {
            uptime = uptime / 60;
            unit = 'hora';
        }
        if (uptime != 1) {
            unit = unit + 's';
        }

        uptime = parseInt(uptime) + ' ' + unit;
        return uptime;
    }

}
