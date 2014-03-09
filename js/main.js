var Server = require('server.js'),
	Client = require('client.js'),
	Scanner = require('scanner.js'),
	gui = require('nw.gui'),
	Config = require('config.js');

var Win = gui.Window.get();

//titleBar = new TitleBar();


var welcomeProfile = _el("welcomeProfile");
var welcomeButtons = _el("welcomeButtons");
var createProfile = _el("createProfile");
var titleProfile = _el("titleProfile");

Config.on('err', function(e){
	console.log('Error: '+ e);
	return;
});
var _config = Config.read();
/*
window.addEventListener('DOMContentLoaded', function(){
	Win.show();
});
*/

onload = function(){
	Win.show();
}



var groupName = '';
var Groups = {};

TitleBar = new (View.extend({
	id: 'titlebar',
	events: {
		'click #backButton' : 'onBack',
		'click #windowCloseButton' : 'closeWindow',
		'click #toolsButton': 'showTools'
	},

	init: function(){
		this._super();
		this.back = this.el.find('#backContainer');
	},

	setUser: function(name){
		this.el.find('#titleProfile').innerHTML = name;
	},

	onBack: function(){
		PageManager.show('welcome');
	},

	closeWindow: function(){
		Win.close(true);
	},

	showTools: function(){
		Win.showDevTools();
	}

}))();


WelcomePage = new (View.extend({
	id: 'welcomeContainer',

	events: {
		'click #createButton': function(){
			PageManager.show('create');
		},
		'click #joinButton': function(){
			PageManager.show('join');
		},

		'input #createProfileText': 'onProfileInput',
		'click #createProfile': 'onProfileSubmit'
	},

	init: function(){
		this._super();

		this.buttons = this.el.find('#welcomeButtons');
		this.profile = this.el.find('#welcomeProfile');
		this.profileUser = this.el.find('#createProfileText');
		this.profileUserSubmit = this.el.find('#createProfile');

		if(!_config || !('username' in _config) || _config['username'].trim() == ''){
			// Username not created.
			// Display Profile create page.
			this.buttons.hide();
			this.profile.show();
		}
		else
			titleProfile.innerHTML = _config['username'];
	},

	onProfileInput: function(){
		if(this.profileUser.value.trim() != '')
			this.profileUserSubmit.disabled = false;
		else
			this.profileUserSubmit.disabled = true;
	},

	onProfileSubmit: function(){
		_config =  _config || {};
		_config['username'] = this.profileUser.value.trim();
		Config.write(_config);

		this.profile.hide();
		this.buttons.show();
		titleProfile.innerHTML = _config['username'];
	},

	render: function(){
		TitleBar.back.hide();
	},

	post_render:function(){
		TitleBar.back.show();
	}

}))();


CreatePage = new (View.extend({
	id: 'createContainer',
	events: {
		'click #createSubmit': 'onSubmit',
		'input #createName': 'onInput'
	},

	init: function(){
		this._super();
		this.name = this.el.find("#createName");
		this.topic = this.el.find('#createTopic');
		this.submit = this.el.find('#createSubmit');
	},

	render: function(){
		this.name.value = '';
		this.topic.value = '';
	},

	onSubmit: function(){
		GroupPage.name = this.name.value;
		GroupPage.topic = this.topic.value;
		client = Server.start(this.name.value, _config['username'], this.topic.value);
		PageManager.show('group');
		GroupPage.chat.addStatusMessage("Server Listening...", "admin");
	},

	onInput: function(){
		if(this.name.value.trim() != '')
			this.submit.disabled = false;
		else
			this.submit.disabled = true;
	}

}))();

JoinPage = new (View.extend({
	id: 'joinContainer',

	events: {
		'click #joinRefreshButton': 'scan',
		'click #joinSubmit': 'join'
	},

	init: function(){
		this._super();
		this.refreshButton = this.el.find('#joinRefreshButton');
		this.joinButton = this.el.find('#joinSubmit');
		this.loader = this.el.find('#joinLoader');
		this.noneFound = this.el.find('#joinEmpty');

		this.groupList = new (View.extend({
			id: 'groupList',
			init: function(){
				this._super();
				this.selected = null;
			},
			clear: function() { 
				this.el.innerHTML = '';
			},
			add: function(group){
				console.log(group);
				var newGroup = document.createElement('tr');
				newGroup.setAttribute('data-id', group.id);
				newGroup.style.opacity = 0;
				newGroup.innerHTML = 	'<td style="width:40%">'+group.name+'</td> \
										<td>'+group.topic+'</td> \
										<td>'+timeSince(new Date(group.created))+' ago</td> \
										<td>'+group.users+'</td>';
				this.el.appendChild(newGroup);
				setTimeout(function(){ newGroup.style.opacity = 1 },10);
				newGroup.on("click", function(){
					if(this.selected != newGroup){
						if(this.selected) this.selected.className = '';
						this.selected = newGroup;
						this.selected.className = 'selected';
						joinSubmit.disabled = false;
					}
				}.bind(this));				
			}
		}))();
	},

	render: function(){
		this.groupList.clear();
		joinSubmit.disabled = true;
		JoinPage.scan();
	},
	post_render:function(){
		clearTimeout(this.scanTimer);
		Scanner.stopScan();
	},

	scan: function(){
		Scanner.groups = {};
		this.groupList.clear();
		this.joinButton.disabled = true;

		this.noneFound.hide();
		this.loader.show();

		this.refreshButton.disabled = true;
		var self = this;
		Scanner.on("new_group", function(group){ self.groupList.add(group) });
		Scanner.scan();

		/* Scan for 5 seconds */
		this.scanTimer = setTimeout(function(){
			self.refreshButton.disabled = false;
			self.loader.hide();

			if(!Object.keys(Scanner.groups).length) self.noneFound.show();
			Scanner.stopScan();
		}, 5000);
	},

	join: function(){
		//console.log('clicked');
		clearTimeout(this.scanTimer);
		Scanner.stopScan();

		var grp = Scanner.groups[this.groupList.selected.getAttribute("data-id")];
		if(!grp) return false;

		GroupPage.name = grp.name;
		GroupPage.topic = grp.topic;

		client = new Client();
		client.name = _config['username'];
		client.connect(grp.address, grp.port);
		PageManager.show('group');

	}
}))();

GroupTab = new (View.extend({
	id: 'groupTab',

	events: {
		'click #groupTabClose': 'onClose'
	},

	init: function(){
		this._super();
		this.title ='';
	},

	render: function(){
		this.el.find('#groupName').innerHTML = this.title;
	},

	post_render: function(){
		this.el.find('#groupName').innerHTML = ' ';
		this.title = '';
	},

	onClose: function(){
		PageManager.show('welcome');
		this.hide();
	},

}))();


var UserListView = new (View.extend({
	id: 'chatUsers',

	init: function(_this){
		this._super();
	},

	render: function(){
		this.el.innerHTML = '';
	},

	update: function(users){
		this.el.innerHTML = '';
		var sorted_list = [];
		for(var user in users){ 
			sorted_list.push(users[user].r + '\n' + users[user].n + '\n' + user); 
		}
		sorted_list.sort();

		var self = this;
		sorted_list.forEach(function(user){
			var userInfo = user.split('\n');

			var e = document.createElement('div');
			if(userInfo[0] == '0')
				e.className = 'owner';

			e.setAttribute('data-id', userInfo[2]);
			
			var e_ico = document.createElement('span');
			e_ico.setAttribute('class', 'ico');

			var e_user = document.createElement('span');
			e_user.setAttribute('class', 'user');
			e_user.innerHTML = userInfo[1];

			e.appendChild(e_ico);
			e.appendChild(e_user);

			self.el.appendChild(e);
		});		
	}
}))();

var ChatView = new (View.extend({
	id: 'chatWrapper',

	events:{
		'click #chatSubmit': 'onChatSubmit',
		'keyup #chatInput': function(e){
			if(e.keyCode == 13) this.chatSubmit.click();
		},
		'input #chatInput': 'onChatInput'
	},

	init: function(){
		this._super();
		this.messages = this.el.find('#chatContainer');
		this.textInput = this.el.find('#chatInput');
		this.chatSubmit = this.el.find('#chatSubmit');
		this.chatSubmit.disabled = true;
		//console.log(this);
	},

	render: function(){
		this.messages.innerHTML = '';
	},

	addStatusMessage: function(msg, type){
		type = type || ''
		var prev = this.messages.lastChild;
		
		if(prev && prev.getAttribute("class") == type){
			prev.appendChild(document.createElement("br"));
			prev.innerHTML += msg;
		}
		else{
			var e = document.createElement('div');
			e.setAttribute("class", type)
			e.innerHTML = msg;
			this.messages.appendChild(e);
		}
		this.messages.scrollTop = this.messages.scrollHeight;
		
	},

	addUserMessage: function(user, msg, type){
		var prev = this.messages.lastChild;
		var msg_time;
		if(type == 'self')
			msg_time = new Date();
		else
			msg_time = new Date(msg.time);

		msg_time = msg_time.getHours() + ':' + msg_time.getMinutes();

		if(prev && prev.hasAttribute("data-id") && prev.getAttribute("data-id") == user.id){
			var body = prev.getElementsByClassName('msg-body')[0];
			body.appendChild(document.createElement("br"));
			body.appendChild(document.createTextNode(msg.body));
			prev.getElementsByClassName('msg-time')[0].innerHTML = msg_time;		
		}
		else{
			var msg_node = document.createElement('div');
			msg_node.setAttribute('data-id', user.id);

			msg_node.innerHTML = '<div class="msg-text col"> \
									<span class="msg-user">'+user.name+'</span> \
									<span class="msg-body">'+msg.body+'</span> \
									<span class="msg-time">'+msg_time+'</span> \
								</div>'
			if(type == 'self')
				msg_node.setAttribute('class', 'msg row msg-self');
			else
				msg_node.setAttribute('class', 'msg row');
			/*else{*/
			msg_node.innerHTML += 	'<div class="msg-meta col"> \
										<div class="msg-ico"></div> \
									</div>';
			
				
			this.messages.appendChild(msg_node);
		}
		this.messages.scrollTop = this.messages.scrollHeight;
	},

	onChatInput: function(){
		if(this.textInput.value.trim() != '')
			this.chatSubmit.disabled = false;
		else
			this.chatSubmit.disabled = true;	
	},

	onChatSubmit: function(){
		var message = this.textInput.value;
		this.textInput.value = '';
		this.chatSubmit.disabled = true;
/*
		var command = inputText.match(/\/(\w+)\s?(.*)/);
		if(command){
			if(command[1] == 'serve' || command[1] == 's'){
				Server.server.listen(7000);
				addChat("Server Listening...", "admin");
			}
			else 
			if(command[1] == 'connect' || command[1] == 'c'){
				client = new Client();
				client.connect('localhost', 7000);
			}
			else{
				client.send(command[1], command[2]);
			}
		}
*/
		client.send("m", message);
		this.addUserMessage(client, {body:message, time:'0'}, 'self');
	}
}))();

GroupPage = new (View.extend({
	id: 'groupContainer',

	name: null,
	topic: null,

	events: {
	},

	init: function(){
		this._super();

		this.topicEl = this.el.find("#groupTopic");
		this.userEl = this.el.find("#groupUserCount");
		this.users = UserListView;
		this.chat = ChatView;
	},

	render: function(){
		TitleBar.back.hide();
		GroupTab.title = this.name;
		GroupTab.show();
		this.topicEl.innerHTML = this.topic;
		this.chat.show();
	},

	post_render: function(){
		client.close();
		if(Scanner.isBroadcasting){
			Scanner.stopBroadcast();
			Server.stop();		
			console.log('stopped broadcasting');	
		}
		GroupTab.hide();
	},

	updateUsers: function(users){
		this.users.update(users);
		this.userEl.innerHTML = Object.keys(users).length;
	}

}))();


PageManager = new (View.extend({
	id: 'mainContainer',

	init: function(){
		this._super();

		this.welcome = WelcomePage;

		this.create = CreatePage;

		this.join = JoinPage;

		this.group = GroupPage;

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



var client = new Client();
client.on('connect', function(){
	GroupPage.chat.addStatusMessage("Connecting to Server...", "log");
});

client.on('connected', function(){
	GroupPage.chat.addStatusMessage("Connected as "+client.name, "log");
});

client.on('disconnect', function(){
	GroupPage.chat.addStatusMessage("Disconnected from server.", "log");
});

client.on('server', function(msg){
	if(msg.type == 'nick'){
		GroupPage.chat.addStatusMessage("Nick changed from "+ msg.data, "server");
	}
	else if(msg.type == 'user_new'){
		GroupPage.chat.addStatusMessage(msg.data + " has joined.", "server");
	}
	else if(msg.type == 'user_quit'){
		GroupPage.chat.addStatusMessage('<strong>' + msg.data + '</strong>' + " has left.", "server");
	}
	else if(msg.type == 'user_msg'){
		GroupPage.chat.addUserMessage(msg.data.user, msg.data.msg)
	}
});

client.on('user_update', function(){
	GroupPage.updateUsers(client.users);
});


/*
var joinSubmit = _el("joinSubmit");
var refreshButton = _el("joinRefreshButton");
var joinLoader = _el("joinLoader");
var joinEmpty = _el("joinEmpty");
var scanTimer;
*/

/*
function scanGroups(){
	hideElement(joinEmpty);
	showElement(joinLoader);

	refreshButton.disabled = true;

	Scanner.on("new_group", function(group){
		JoinPage.groupList.add(group)
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
*/
/*
document.getElementById("joinButton").addEventListener("click", function(){
	JoinPage.scan();
	PageManager.show('join');
});
*/
/*
refreshButton.addEventListener("click", function(){
	JoinPage.groupList.clear();
	joinSubmit.disabled = true;
	scanGroups();
});
*/
/*
joinSubmit.addEventListener("click", function(){
	var grp = Scanner.getGroup(JoinPage.groupList.selected.getAttribute("data-id"));
	if(!grp) return false;

	groupName = grp.topic;

	client = new Client();
	client.name = config_data['username'];
	client.connect(grp.address, grp.port);
	PageManager.show('group');
});
*/

/*
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
		if(command[1] == 'serve' || command[1] == 's'){
			Server.server.listen(7000);
			addChat("Server Listening...", "admin");
		}
		else 
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
*/
