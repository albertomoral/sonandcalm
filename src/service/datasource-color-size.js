/* datasource-color-size.js */

APP.factory(
	'ColorSize', 
function (
	$http,
	Loader
) {

	var Self = {};

	Self.Data = {};	

	$http.get('/wp-json/poeticsoft/woo-products-color-size-read')
	.then(function(Response) {

		var Code = Response.data.Status.Code;
		if(Code == 'OK'){ 

			Self.Data = Response.data.Data; 

			Loader.ready('ColorSize');

		} else {

			return Notifications.show({ errors: Response.data.Status.Reason });
		}
	});

	Self.save = function() {

		var $Q = $q.defer();

		$http.post(
			'/wp-json/poeticsoft/woo-products-color-size-update',
			ColorSize.Data
		)
		.then(function(Response) {

			var Code = Response.data.Status.Code;
			if(Code == 'KO'){

				$rootScope.$emit('notifydialog', { text: 'Error: ' + Response.data.Status.Reason }); 
			}    
			
			$Q.resolve();
		});
		
		return $Q.promise;
	}

	return Self;
});
	