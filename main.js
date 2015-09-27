var qsocks = require('qsocks')
var $ = require('jquery')
var Promise = require('promise')
var popover = require('./popover')

var Q = {
	sheets: []
}


qsocks.Connect().then(function(global) {
	Q.global = global;
		
	global.getDocList()
	.then(renderApps)
	
	$('#maincontent').on('click', '.app', function(event) {
		popover.show()
		
		var appId = $(this).data('appid')
		var connection = qsocks.Connect({appname: appId})
		
		fetchSheets(connection, appId)
		
				
	})
	

}, function(error) {
	console.log(error);
})

function renderApps(list) {
	console.log(list)
	return new Promise(function(resolve,reject) {
		var docs = list.map(function(d) {
			
			var img = 'http://localhost:4848/resources/img/appoverview/Ic_AppBig.png'
			
			if(d.qThumbnail.qUrl) {
				img = 'http://localhost:4848' + d.qThumbnail.qUrl
			}
			
			return [
				'<div class="app" ',
				'style="background-image: url(' + img + ')" ',
				'data-title="' + d.qTitle + '" ',
				'data-appid="' + d.qDocId.split('\\').pop() + '">',
				'<p>' + d.qTitle + '</p>',
				'</div>'
			].join('\n')
		}).join('\n');
		
		$(docs).appendTo('#maincontent')
		
		resolve()
	})	
};

function fetchSheets(global, appId) {
		return global.openDoc(appId).then(function(app) {
			Q.app = app;
			return app.getAllInfos()
		})
		.then(function(infos) {
			return infos.qInfos.filter(function(d) { return d.qType == 'sheet' })
		})
}

function renderSheets(sheets) {
	
	var $main = $('.maincontent')
	$main.find('.sheet').remove()
	
	Promise.all(sheets.map(function(d) {
		return Q.app.getObject(d.qId).then(function(handle) {
			return handle.getProperties();
		})
	}))
	.then(function(sheets) {

		sheets.forEach(function(d) {
			var template = [
				'<div class="sheet" id="' + d.qInfo.qId +'">',
				'<p class="title">' + d.qMetaDef.title + '</p>',
				'</div>'
			].join('\n')
			popover.hide()
			
			console.log(popover.hide)
			
			$(template).appendTo($main);

				
		})

	})
		
}