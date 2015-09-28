var qsocks = require('qsocks')
var $ = require('jquery')
var _ = require('lodash')
var Promise = require('promise')
var popover = require('./popover')

var Q = {}

var connection = qsocks.Connect();
connection.then(function(global) {
		
	global.getDocList()
	.then(renderApps)
	
	$('.popover').on('click', 'button#cancel', function(event) {
		Q.app.connection.ws.close()
		popover.hide()
	})
	
	$('.popover').on('click', 'button#save', function(event) {
		
		var elements = $('.popover tr').toArray().slice(1)
		
		Promise.all(elements.map(function(d) {
			var $d = $(d);
			return Q.app.getObject( $d.data('id') ).then(function(obj) {
				obj.applyPatches([{
					qPath: '/columns',
					qOp: 'replace',
					qValue: $(d).find('.col').text()
				},{
					qPath: '/rows',
					qOp: 'replace',
					qValue: $(d).find('.row').text()
				}])
			})
		}))
		.then(function() {
			return Q.app.doSave();
		})
		.then(function() {
			Q.app.connection.ws.close()
			popover.hide()
		})
		.catch(function(error) {
			console.log(error)
		})

	})
	
	$('#maincontent').on('click', '.app', function(event) {
		popover.showSpinner()
		popover.show()
		
		var appId = $(this).data('appid')
		var appconnection = qsocks.Connect({appname: appId})
		
		fetchSheets(appconnection, appId)
		.then(renderSheets)
		.catch(function() {
			popover.error('Something went wrong, you should tell someone...')
		})
		
				
	})
	

}, function() { 
	popover.error('It seems your Qlik Sense Desktop is not running<br>Please start it and refresh the page.');
})


function renderApps(list) {
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

function fetchSheets(connection, appId) {
		return connection.then(function(global) {
			return global.openDoc(appId).then(function(app) {
				Q.app = app;
				return app.getAllInfos()
			})
			.then(function(infos) {
				return infos.qInfos.filter(function(d) { return d.qType == 'sheet' })
			})
		})
}

function renderSheets(sheets) {
	
	var $main = $('.content')
	$main.empty();
	
	$main.append('<h2>Edit the grid size of your sheets</h2>')
	
	return Promise.all(sheets.map(function(d) {
		return Q.app.getObject(d.qId).then(function(handle) {
			return handle.getProperties();
		})
	}))
	.then(function(sheets) {
		return new Promise(function(resolve, reject) {
			var $table = $('<table><thead><tr><th style="text-align: left;">Sheet Title</th><th>Columns</th><th>Rows</th></tr></thead><tbody></tbody></table>');
			var compiled = _.template(['<tr data-id=${ sheetid }>',
				'<td class="sheet-title">${ title }</td>',
				'<td class="colrow col" contenteditable=true >${ columns }</td>',
				'<td class="colrow row" contenteditable=true >${ rows }</td>',
				'</tr>'].join('\n'));
				
			sheets.forEach(function(d) {
	
				
				$table.find('tbody').append(compiled({
					sheetid: d.qInfo.qId,
					title: d.qMetaDef.title,
					columns: d.columns,
					rows: d.rows
				}))
		
			})
			
			$table.appendTo($main)
			$('<button id="save">Save changes</button><button id="cancel">Cancel</button>').appendTo($main)	
			popover.hideSpinner();
			
			resolve();	
			
		})
	})
		
}