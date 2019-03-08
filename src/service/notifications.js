
APP.factory(
   'Notifications',
function (
  $q, 
  $timeout
) {

	var Self = {};
	
	Self.hide = function(Time) {

		var HideTime = Time || 2000;

		$timeout(function() {

			Self.$Notifications.hide();
		}, HideTime);
	}

	Self.show = function(Notification, Hold, Time) {

		Self.$Notifications.removeClass('Error');

		if(Notification.errors) {			

			Self.$Notifications
			.addClass('Error')
			.html(Notification.errors)
			.show();

		}	else {	

			Self.$Notifications
			.html(Notification)
			.show();
		}	

		if(!Hold) { return Self.hide(); }
		if(Time) { Self.hide(Time); }
	}

	jQuery(function() {

		Self.$Notifications = jQuery('.poeticsoft-utils .Notifications');

		Self.show('Loading APP, wait...')
		Self.hide();
	});

	return Self;
});
        