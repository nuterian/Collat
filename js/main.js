var Server = require('server.js');
var Client = require('client.js');

var chat = document.getElementById("chatContainer");
var user_list = document.getElementById("chatUsers");

function addChat(msg, type){
	type = type || ''
	var e = document.createElement('div');
	e.setAttribute("class", type)
	e.innerHTML = msg;
	chat.appendChild(e);
}

function updateUserList(users){
	user_list.innerHTML = '';
	var sorted_list = [];
	for(var user in users){
		sorted_list.push(users[user]);
	}
	sorted_list.sort();

	sorted_list.forEach(function(username){
		var e = document.createElement('div');
		e.innerHTML = username;
		user_list.appendChild(e);
	});
}

var client;

var chatForm = document.forms[0];
chatForm.addEventListener("submit", function(e){

	var input = document.getElementById("chatInput");
	var inputText = input.value;
	input.value = "";
	console.log(inputText);
	e.preventDefault();

	var command = inputText.match(/\/(\w+)\s?(.*)/);

	if(command){
		if(command[1] == 'serve' || command[1] == 's'){
			Server.server.listen(7000);
			addChat("Server Listening (port: 7000)", "admin");
		}
		else if(command[1] == 'connect' || command[1] == 'c'){
			client = new Client();
			client.connect('localhost', 7000);

			client.on('connect', function(){
				addChat("Connecting to Server...");
			});

			client.on('connected', function(){
				addChat("Connected as "+client.name);
			});

			client.on('server', function(msg){
				if(msg.type == 'nick'){
					addChat("Nick changed from "+ msg.data, "server");
				}
				else if(msg.type == 'user_new'){
					addChat(msg.data + "has joined.", "server");
				}
				else if(msg.type == 'user_msg'){
					addChat(msg.data.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
				}
			});

			client.on('user_update', function(){
				updateUserList(client.users);
			});
		}
		else{
			client.send(command[1], command[2]);
		}
	}
	else{
		client.send("m", inputText);
	}

});


addChat("Welcome to node chat!", "sys"); 