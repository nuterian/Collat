var Server = require('server.js'),
	Client = require('client.js'),
	Scanner = require('scanner.js'),
	gui = require('nw.gui'),
	Config = require('config.js');

var Win = gui.Window.get();

//titleBar = new TitleBar();


var chat = _el("chatContainer");
var user_list = _el("chatUsers");
var group_list = _el("groupList");

_el("windowCloseButton").addEventListener("click", function(){
	Win.close(true);
});

_el("toolsButton").addEventListener("click", function(){
	Win.showDevTools();
});

var welcomeProfile = _el("welcomeProfile");
var welcomeButtons = _el("welcomeButtons");
var createProfile = _el("createProfile");
var titleProfile = _el("titleProfile");

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

	var createProfileText = _el("createProfileText");
	createProfileText.addEventListener("input", function(){
		if(createProfileText.value.trim() != '')
			createProfile.disabled = false;
		else
			createProfile.disabled = true;
	});

	createProfile.addEventListener("click", function(){
		if(!config_data) config_data = {};
		config_data['username'] = createProfileText.value.trim();
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
	chat.scrollTop = chat.scrollHeight;
}

function addChat(msg, type){
	type = type || ''
	var prev = chat.lastChild;
	if(prev && prev.getAttribute("class") == type){
		prev.appendChild(document.createElement("br"));
		prev.innerHTML += msg;

	}
	else{
		var e = document.createElement('div');
		e.setAttribute("class", type)
		e.innerHTML = msg;
		chat.appendChild(e);
	}
	chat.scrollTop = chat.scrollHeight;
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
	if(e.style.display == 'none'){
		e.style.display = (e._display || 'block');
	} 
}

function hideElement(e){
	e._display = e.style.display; 
	e.style.display = 'none'
}



var welcomePage = _el("welcomeContainer");
var createPage = _el("createContainer");
var joinPage = _el("joinContainer");
var chatPage = _el("groupContainer");
var backContainer = _el("backContainer");
var backButton = _el("backButton");
var groupNameTitle = _el("groupName");
var groupName = '';
/*
function showPage(e){
	hideElement(currPage);
	e.show();
	if(e != welcomePage){
		backContainer.show();
	}
	else{
		backContainer.hide();
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

	if(currPage == chatPage){
		hideElement(backContainer);
		groupNameTitle.innerHTML = groupName;
		groupTab.show();
	}
}
*/

groupTabClose.addEventListener('click', function(){

});


//currPage = welcomePage;

TitleBar = new (View.extend({
	id: 'titlebar',
	events: {
		'click #backButton' : 'onBack'
	},

	init: function(){
		this._super();
		this.back = this.el.find('#backContainer');
	},

	onBack: function(){
		PageManager.show('welcome');
	}
}))();


PageManager = new (View.extend({
	id: 'mainContainer',

	init: function(){
		this._super();

		this.welcome = new View({
			id: 'welcomeContainer',
			render: function(){
				TitleBar.back.hide();
			},
			post_render:function(){
				TitleBar.back.show();
			}
		});

		this.create = new View({id: 'createContainer'});

		this.join = new View({
			id: 'joinContainer',
			render: function(){
				group_list.innerHTML = '<tr class="dummy-row"></tr>';
				joinSubmit.disabled = true;
			},
			post_render:function(){
				clearTimeout(scanTimer);
				Scanner.stop();
			}
		});

		this.group = new View({
			id: 'groupContainer',
			render: function(){
				TitleBar.back.hide();
				groupNameTitle.innerHTML = groupName;
				groupTab.show();

			},
			post_render: function(){
				client.close();
			}
		});

		this.current = this.welcome;
	},

	show: function(page){
		if(this.current != this[page]){
			this.current.hide();
			this[page].show();
			this.current = this[page];
		}
	}
}))();




var createButton = _el("createButton");
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
	PageManager.show('create');
});

var client = new Client();
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

_el("createSubmit").addEventListener("click", function(e){
	
	/*
	Server.server.listen(0);
	Server.topic = document.getElementById("createTopic").value;
	listening = true;

	client = new Client();
	client.name = config_data['username'];
	client.connect('localhost', Server.server.address().port);
	Server.setOwner({name:client.name});
	Scanner.broadcast(Server);
	*/
	groupName = _el('createTopic').value;
	client = Server.start(groupName, config_data['username']);
	PageManager.show('chat');
	addChat("Server Listening...", "admin");
});


var joinSubmit = _el("joinSubmit");
var refreshButton = _el("joinRefreshButton");
var joinLoader = _el("joinLoader");
var joinEmpty = _el("joinEmpty");
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
	PageManager.show('join');
});

refreshButton.addEventListener("click", function(){
	group_list.innerHTML = '<tr class="dummy-row"></tr>';
	joinSubmit.disabled = true;
	scanGroups();
});

joinSubmit.addEventListener("click", function(){
	var grp = Scanner.getGroup(selected_group.getAttribute("data-id"));
	if(!grp) return false;

	groupName = grp.topic;

	client = new Client();
	client.name = config_data['username'];
	client.connect(grp.address, grp.port);
	PageManager.show('chat');
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
		}
		else{
			client.send(command[1], command[2]);
		}
	}
	else{
		client.send("m", inputText);
		createMessage(client, {body:inputText, time:'0'}, 'self');
	}

});
