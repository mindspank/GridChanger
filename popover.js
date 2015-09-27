var $ = require('jquery')

var popover = {
	hide: function() {
		$('.popover').css('display', 'none')
	},
	toggleSpinner: function() {
		
	},
	show: function(message) {
		$('.popover').find('.content').empty()
		$('.popover').find('p').text(message || 'Loading...')
		$('.popover').css('display', 'flex')
	},
	error: function(message) {
		$('.popover').find('p').text(message || 'Something broke :(')
		$('.popover').css('display', 'flex')
	}
}

module.exports = popover;