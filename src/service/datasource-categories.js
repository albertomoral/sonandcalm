
APP.factory(
	'Categories', 
function (
	$q, 
	$rootScope, 
	$timeout, 
	Errors, 
	Products
) {

	var FirstTimeReadProducts = false;
	var Self = {};
	
	Self.DS = new kendo.data.DataSource ({
		transport: {
			read: {
				url: '/wp-json/poeticsoft/woo-products-categories-read',
				type: 'GET',
				dataType: 'json'
			}
		},
		schema: { 
			model: {
				id: 'id',
				fields: {
					'id': { type: 'number', editable: false },
					'name': { type: 'string', editable: false }
				}
			},
			data: 'Data',
			errors: function (Response) {

				if (Response.Status.Code == 'KO') { return Response.Status.Reason; }
				return null;
			}
		},		
		error: Errors.showErrors,
		requestEnd: function(e) {

			if(!FirstTimeReadProducts) { // Hack

				Products.RemoteDS.read();
				FirstTimeReadProducts = true;
			}
		}
	});
	Self.DS.read();

	return Self;
});
	