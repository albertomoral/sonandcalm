/* datasource-sku-parent.js */

APP.factory(
	'Stock', 
function (
	$http
) {

	var Self = {};

	Self.Data = {};	

	$http.get('/wp-json/poeticsoft/woo-products-stock-read')
	.then(function(Response) {

		var Code = Response.data.Status.Code;
		if(Code == 'OK'){ 

			Self.Data = Response.data.Data;

		} else {

			return Notifications.show({ errors: Response.data.Status.Reason });
		}
	});

	return Self;
});
	