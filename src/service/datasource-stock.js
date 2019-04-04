/* datasource-stock.js */

APP.factory(
	'Stock', 
function (
	$http,
	$q,
	$rootScope
) {

	var Self = {};

	Self.OldData = {};
	Self.OldReady = false;
	Self.NewData = {};
	Self.NewReady = false;	

	$http.get('/wp-json/poeticsoft/woo-products-stock-read')
	.then(function(Response) {

		var Code = Response.data.Status.Code;
		if(Code == 'OK'){ 

			Self.OldData = Response.data.Data;
			Self.OldReady = true;

			$rootScope.$broadcast('stockready');

		} else {

			return Notifications.show({ errors: Response.data.Status.Reason });
		}
	});

	Self.saveState = function() {		

		var $Q = $q.defer();
		Self.OldData = JSON.parse(JSON.stringify(Self.NewData)); // Easy clone

		$http.post(
			'/wp-json/poeticsoft/woo-products-stock-update',
			Self.OldData
		)
		.then(function(Response) {
	
			var Code = Response.data.Status.Code;
			if(Code == 'OK'){ 
	
			} else {
	
				return Notifications.show({ errors: Response.data.Status.Reason });
			}

			$Q.resolve();
		});

		return $Q.promise;
	}

	return Self;
});
	