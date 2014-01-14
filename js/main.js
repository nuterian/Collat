var Server = require('server.js');
var Client = require('client.js');

var chat = document.getElementById("chatContainer");
var user_list = document.getElementById("chatUsers");

function createMessage(user, msg, type){
	var prev = chat.lastChild;
	if(prev && prev.hasAttribute("data-id") && prev.getAttribute("data-id") == user.id){
		var body = prev.getElementsByClassName('msg-body')[0];
		body.appendChild(document.createElement("br"));
		body.appendChild(document.createTextNode(msg.body));		
	}
	else{
		var msg_node = document.createElement('div');
		if(type == 'self'){
			msg_node.setAttribute('class', 'msg row row-right');
		}
		else{
			msg_node.setAttribute('class', 'msg row');
		}
		msg_node.setAttribute('data-id', user.id);

		console.log(user);
		console.log(msg);
		msg_node.innerHTML = '<div class="msg-text col"> \
								<div class="msg-user">'+user.name+'</div> \
								<div class="msg-body">'+msg.body+'</div> \
							</div> \
							<div class="msg-meta col"> \
								<div class="msg-ico"></div> \
								<div class="msg-time">'+msg.time+'</div> \
							</div>';
		chat.appendChild(msg_node)
	}
}

function addChat(msg, type){
	type = type || ''
	var prev = chat.lastChild;
	if(prev && prev.getAttribute("class") == type){
		prev.appendChild(document.createElement("br"));
		prev.innerHTML += msg;
		//prev.appendChild(document.createTextNode(msg));
	}
	else{
		var e = document.createElement('div');
		e.setAttribute("class", type)
		e.innerHTML = msg;
		chat.appendChild(e);
	}
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

		var ico = document.createElement('span');
		ico.setAttribute('class', 'ico');

		var user = document.createElement('span');
		user.setAttribute('class', 'user');
		user.innerHTML = username;

		e.appendChild(ico);
		e.appendChild(user);

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
			addChat("Server Listening...", "admin");
		}
		else if(command[1] == 'connect' || command[1] == 'c'){
			client = new Client();
			client.connect('localhost', 7000);

			client.on('connect', function(){
				addChat("Connecting to Server...", "log");
			});

			client.on('connected', function(){
				addChat("Connected as "+client.name, "log");
			});

			client.on('disconnect', function(){
				addChat("Disconnected from server.", "log");
			});

			client.on('server', function(msg){
				if(msg.type == 'nick'){
					addChat("Nick changed from "+ msg.data, "server");
				}
				else if(msg.type == 'user_new'){
					addChat(msg.data + " has joined.", "server");
				}
				else if(msg.type == 'user_quit'){
					addChat('<strong>' + msg.data + '</strong>' + " has left.", "server");
				}
				else if(msg.type == 'user_msg'){
					createMessage(msg.data.user, msg.data.msg)
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


addChat("Welcome to <strong>Collat</strong>", "sys"); 