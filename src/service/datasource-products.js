/* datasource-products.js */

APP.factory(
	'Products',
function (
	$http,
	$q, 
	$rootScope, 
	$timeout, 
	Notifications
) {

	var Self = {};

	Self.DS = new kendo.data.TreeListDataSource ({
		page: 1,
		pageSize: 20,
		transport: {
			read: function(Op) {

				Op.success(Op.data.data);
			}
		},
		schema: {
			model: {
				id: 'sku',
				parentId: 'parent_sku',
				fields: {
					'sku': { type: 'string', editable: false },
					'parent_sku': { type: 'string', editable: false, nullable: true },
					'type': { type: 'string', editable: false },
					'name': { type: 'string', editable: false, expanded: false },
					'category_ids': [],
					'image_id': { type: 'number', editable: false },
					'price': { type: 'number', editable: false },
					'sale_price': { type: 'number', editable: false },
					'stock_quantity': { type: 'number', editable: false }
				},
				expanded: true
			}
		}
	});

	Self.RemoteDS = new kendo.data.DataSource({	
		transport: {
			read: {
				url: '/wp-json/poeticsoft/woo-products-read',
				type: 'GET',
				dataType: 'json' 
			}
		},
		schema: {
			data: 'Data',
			errors: function (Response) {

				if (Response.Status.Code == 'KO') { return Response.Status.Reason; }
				return null;
			}
		},		
		error: Notifications.showNotifications,
		requestEnd: function(E) {

			Self.DS.read({ data: E.response.Data });
		}
	});
	Self.RemoteDS.read();

	/* Excel FootPrint */

	Self.FootPrint = [];
	$http
	.get('/wp-json/poeticsoft/get-agora-fields-footprint')
	.then(
		function(Response) {

			if(Response.data.Status.Code == 'KO') {						
		
				$rootScope.$emit('closedialog');
				return Notifications.show({ errors: Response.data.Status.Reason });
			}

			Self.FootPrint = Response.data.Data;
		}
	);

	return Self;
});