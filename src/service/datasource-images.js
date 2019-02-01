
APP.factory(
	'Images', 
function (
	$q, 
	$rootScope, 
	$timeout, 
	Errors
) {

	var Self = {};

	Self.DS = new kendo.data.DataSource({
		transport: {
			read: {
				url: '/product-images/list.php',
				type: 'POST',
				dataType: 'json',
				contentType: 'application/json',
				processData: false
			},
			destroy: {
				url: '/product-images/remove.php',
				type: 'POST',
				dataType: 'json',
				contentType: 'application/json',
				processData: false
			},
			parameterMap: function (Data) { return JSON.stringify(Data); }
		},
		schema: {
			model: {
				id: 'name',
				fields: {
					name: { type: 'string', editable: false },
					size: { type: 'string', editable: false },
					date: { type: 'date', editable: false }
				}
			},
			data: 'Data',
			errors: function (Response) {

				if (Response.Status.Code == 'KO') { return Response.Status.Reason; }
				return null;
			}
		},		
		error: Errors.showErrors
	});

  return Self;
});
        