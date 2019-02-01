
APP.factory(
   'Errors',
function (
  $q, 
  $timeout
) {

	var Self = {};
	
	Self.$Errors = null;

	Self.showErrors = function(Error) {

		console.log(Error);

		Self.$Errors
		.addClass('Error')
		.html(Error.errors)
		.show();

		$timeout(function() {

			Self.$Errors.hide();
		}, 2000);
	}

	jQuery(function() {

		Self.$Errors = jQuery('.poeticsoft-utils .Status');
		Self.$Errors.hide();
	});

	return Self;
});
        