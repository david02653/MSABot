var admin_data = { "room": process.env.adminRoom, "user_id": process.env.adminID};
		
module.exports = function(robot) 
{
    console.log(robot);
	/*########## for bot's installing detecting ##########*/
    var context = require('rabbit.js').createContext(process.env.RabbitMQUrl);
    var sub = context.socket('SUBSCRIBE');
    sub.connect('bots');
    sub.setEncoding('utf8');
    sub.on('data', function(note) {
        var botData = JSON.parse(note);
        console.log("note");
        console.log(note);
        console.log("botData");
        console.log(botData);
        robot.send(admin_data,"There're new user installing your Bot! : "+botData.team_name);
		var bot = require('./MSABot');
		var token = botData.bot_access_token;
		var name = "MSABot";
		var team = botData.team_name;
		bot.newBot(token, name, robot, name);
    });
	
	/*########## for Jenkins server ##########*/
	var context = require('rabbit.js').createContext(process.env.RabbitMQUrl);
    var sub = context.socket('SUBSCRIBE');
    sub.connect('exchangeString');
    sub.setEncoding('utf8');
    sub.on('data', function(note) {
        
        var json = JSON.parse(note);
        var result = "["+json.build_status+"] " + json.build_name + "'s build "+json.build_number+" just finished!";
        if(json.fail_count > 0) //代表有錯誤ㄛ
        {
            for(var i = 0; i < json.fail_case.length;i++)
            {
                var f_case = json.fail_case[i];
                result = result + "\n\tTestcase \""+f_case.name+"\" has some problems";
            }
            result = result + "\nCheck the details on Jenkins!\n" + json.build_url;
        }
        
        //全部bots丟下去就對了XD
        var bots = robot.brain.get('bots');
        for(var i = 0;i < bots.length; i++)
        {
            var bot = bots[i];
            bot.bot.postMessage(json.roomNumber, result.toString());  
        }
    });
	
	/*########## for eureka server ##########*/
    var context = require('rabbit.js').createContext(process.env.RabbitMQUrl);
    var sub = context.socket('SUBSCRIBE');
    sub.connect('eurekaserver');
    sub.setEncoding('utf8');
    sub.on('data', function(note) {
        var json = JSON.parse(note);
		var result = "["+json.status+"]";
		switch(json.status)
		{
			case "Failed" : result +=  "Service : " + json.appName + " is dead. Pleace check it!";break;
			case "Server Start" : result += "Your Eureka Server just start working!";break;
			case "Server Registry Start" : result += "Your Eureka Registry Server just start working!";break;
		}
		
		var bots = robot.brain.get('bots');
		for(var i = 0;i < bots.length; i++)
        {
            var bot = bots[i];
            bot.bot.postMessage(json.roomID, result.toString());  
        }
    });
	
	/*########## for VMAMV server ##########*/
    var context = require('rabbit.js').createContext(process.env.RabbitMQUrl);
    var sub = context.socket('SUBSCRIBE');
    sub.connect('vmamv');
    sub.setEncoding('utf8');
    sub.on('data', function(note) {
        var json = JSON.parse(note);
		var result = "["+json.status+"] " + json.content;
       
		var bots = robot.brain.get('bots');
		for(var i = 0;i < bots.length; i++)
        {
            var bot = bots[i];
            bot.bot.postMessage(json.roomID, result.toString());  
        }
    });

    /*### consume message from discord server ###*/
    var amqp = require('amqplib/callback_api');
    amqp.connect('amqp://36.229.104.110', function(err, conn){
        conn.createChannel(function(err, channel){
            var ex = 'topic_logs'; // exchange name
            channel.assertExchange(ex, 'topic'); // exchange with 'topic' type
            var q = 'myQueue'; // queue name
            channel.assertQueue(q, {
                exclusive: true
            }, function(err, q){
                if(err){
                    throw err;
                }
                // set topic pattern : bind exchange,routingKey and queue
                channel.bindQueue(q.queue, ex, 'disbot.#');
                channel.consume(q.queue, function(msg){
                    // handle message consumed
                    console.log("[x] received %s", msg.content.toString());
                    var bots = robot.brain.get('bots');
                    for(var i = 0;i < bots.length; i++)
                    {
                        var bot = bots[i];
                        bot.bot.postMessage(json.roomNumber, result.toString());  
                    }
                });
            });
        });
    });
    
}





