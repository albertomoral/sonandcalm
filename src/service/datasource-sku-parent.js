/* datasource-sku-parent.js */

APP.factory(
	'ParentSku', 
function (
	$http,
	Loader
) {

	var Self = {};

	Self.Data = {};	

	$http.get('/wp-json/poeticsoft/woo-products-parent-sku-read')
	.then(function(Response) {

		var Code = Response.data.Status.Code;
		if(Code == 'OK'){ 

			Self.Data = Response.data.Data;

			Loader.ready('ParentSKU');

		} else {

			return Notifications.show({ errors: Response.data.Status.Reason });
		}
	});

	return Self;
});
	