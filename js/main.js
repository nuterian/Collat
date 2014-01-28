var Server = require('server.js'),
	Client = require('client.js'),
	Scanner = require('scanner.js'),
	gui = require('nw.gui'),
	Config = require('config.js');

var Win = gui.Window.get();

var chat = el("chatContainer");
var user_list = el("chatUsers");
var group_list = el("groupList");

el("windowCloseButton").addEventListener("click", function(){
	Win.close(true);
});

el("toolsButton").addEventListener("click", function(){
	Win.showDevTools();
});

var welcomeProfile = el("welcomeProfile");
var welcomeButtons = el("welcomeButtons");
var createProfile = el("createProfile");
var titleProfile = el("titleProfile");

Config.on('err', function(e){
	console.log('Error: '+ e);
	return;
});
var config_data = Config.read();


if(!config_data || !('username' in config_data) || config_data['username'].trim() == ''){
	// Username not created.
	// Display Profile create page.

	hideElement(welcomeButtons);
	showElement(welcomeProfile);

	var createProfileText = el("createProfileText");
	createProfileText.addEventListener("input", function(){
		if(createProfileText.value.trim() != '')
			createProfile.disabled = false;
		else
			createProfile.disabled = true;
	});

	createProfile.addEventListener("click", function(){
		if(!config_data) config_data = {};
		config_data['username'] = createProfileText.value;
		Config.write(config_data);
		hideElement(welcomeProfile);
		showElement(welcomeButtons);
		titleProfile.innerHTML = config_data['username'];
	});
}
else{
	titleProfile.innerHTML = config_data['username'];
}

window.onload = function(){
	document.getElementById("titlebar").className = "row title-show";
}

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

		msg_node.innerHTML = '<div class="msg-text col"> \
								<div class="msg-user">'+user.name+'</div> \
								<div class="msg-body">'+msg.body+'</div> \
							</div> \
							<div class="msg-meta col"> \
								<div class="msg-ico"></div> \
								<div class="msg-time">'+msg.time+'</div> \
							</div>';
		chat.appendChild(msg_node);
	}
	console.log(chat.scrollHeight);
	chat.scrollTop = chat.scrollHeight;
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

function addGroup(group){
	var group_node = document.createElement('tr');
	group_node.setAttribute('data-id', group.id);
	group_node.setAttribute('style', 'opacity: 0');
	group_node.innerHTML = 	'<td style="width:60%">'+group.topic+'</td> \
							<td>20 mins ago</td> \
							<td>'+group.users+'</td>';
	group_list.appendChild(group_node);
	setTimeout(function(){group_node.setAttribute('style', 'opacity: 1')},50);
	return group_node;
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

var currPage;

function showElement(e){
	e.setAttribute("style", "");
}

function hideElement(e){
	e.setAttribute("style", "display:none");
}

var welcomePage = document.getElementById("welcomeContainer");
var createPage = document.getElementById("createContainer");
var joinPage = document.getElementById("joinContainer");
var chatPage = document.getElementById("groupContainer");
var listening = false;
var backButton = document.getElementById("backButton");

function showPage(e){
	hideElement(currPage);
	showElement(e);
	if(e != welcomePage){
		showElement(backButton);
	}
	else{
		hideElement(backButton);
	}

	if(currPage == joinPage){
		group_list.innerHTML = '<tr class="dummy-row"></tr>';
		clearTimeout(scanTimer);
		Scanner.stop();
		joinSubmit.disabled = true;
	}
	else if(currPage == chatPage){
		client.close();
	}
	currPage = e;
}


currPage = welcomePage;

backButton.addEventListener("click", function(){
	showPage(welcomePage);
});

var createButton = document.getElementById("createButton");
createButton.addEventListener("click", function(){
	var topicInput = document.getElementById("createTopic");
	var createSubmit = document.getElementById("createSubmit");
	topicInput.addEventListener("input", function(){
		if(topicInput.value.trim() != ''){
			createSubmit.disabled = false;
		}
		else{
			createSubmit.disabled = true;
		}
	});
	showPage(createPage);
});

var client;
client = new Client();
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

document.getElementById("createSubmit").addEventListener("click", function(e){
	Server.server.listen(0);
	Server.topic = document.getElementById("createTopic").value;
	Scanner.broadcast(Server);
	listening = true;
	//console.log();
	client = new Client();
	client.connect('localhost', Server.server.address().port);
	showPage(chatPage);
	addChat("Server Listening...", "admin");
});


var joinSubmit = document.getElementById("joinSubmit");
var refreshButton = document.getElementById("joinRefreshButton");
var joinLoader = document.getElementById("joinLoader");
var joinEmpty = document.getElementById("joinEmpty");
var scanTimer;

var selected_group = null;

function scanGroups(){
	hideElement(joinEmpty);
	showElement(joinLoader);

	refreshButton.disabled = true;

	Scanner.on("new_group", function(group){
		var new_group = addGroup(group);
		new_group.addEventListener("click", function(){
			if(selected_group != new_group){
				if(selected_group)
					selected_group.className = '';
				new_group.className = 'selected';
				selected_group = new_group;
				joinSubmit.disabled = false;
			}
		});

	});
	Scanner.scan();

	scanTimer = setTimeout(function(){
		refreshButton.disabled = false;
		hideElement(joinLoader);
		console.log(Scanner.numGroups());
		if(Scanner.numGroups() == 0){
			showElement(joinEmpty);
		}
		Scanner.stop();

	}, 5000);
}


document.getElementById("joinButton").addEventListener("click", function(){
	scanGroups();
	showPage(joinPage);
});

refreshButton.addEventListener("click", function(){
	group_list.innerHTML = '<tr class="dummy-row"></tr>';
	joinSubmit.disabled = true;
	scanGroups();
});

joinSubmit.addEventListener("click", function(){
	var grp = Scanner.getGroup(selected_group.getAttribute("data-id"));
	if(!grp) return false;

	client = new Client();
	client.connect(grp.address, grp.port);
	showPage(chatPage);
});


var chatForm = document.forms[0];
chatForm.addEventListener("submit", function(e){

	var input = document.getElementById("chatInput");
	var inputText = input.value;
	input.value = "";
	console.log(inputText);
	e.preventDefault();
	e.stopPropagation();

	var command = inputText.match(/\/(\w+)\s?(.*)/);

	if(command){
		/*
		if(command[1] == 'serve' || command[1] == 's'){
			Server.server.listen(7000);
			addChat("Server Listening...", "admin");
		}
		else */
		if(command[1] == 'connect' || command[1] == 'c'){
			client = new Client();
			client.connect('localhost', 7000);
			//console.log("conn");
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