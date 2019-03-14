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

	Self.RemoteData = [];

	Self.DS = new kendo.data.TreeListDataSource ({
		batch: true,
		page: 1,
		pageSize: 20,
		transport: {
			read: function(Op) {

				Op.success(Op.data.data);
			},
			create: {
				url: '/wp-json/poeticsoft/woo-products-create-update',
				type: 'POST',
				dataType: 'json'
			},
			update: {
				url: '/wp-json/poeticsoft/woo-products-create-update',
				type: 'POST',
				dataType: 'json'
			},
			parameterMap: function (Data) {

				return JSON.stringify(Data);
			}
		},
		schema: {
			model: {
				id: 'sku',
				parentId: 'parent_sku',
				fields: {
					'id': { type: 'number', editable: false, nullable: true },
					'type': { type: 'string', editable: false },
					'parent_id': { type: 'number', editable: false, nullable: true },
					'sku': { type: 'string', editable: false },
					'parent_sku': { type: 'string', editable: false, nullable: true },
					'name': { type: 'string', editable: false, expanded: false },
					'category_ids': [],
					'image_id': { type: 'number', editable: false },
					'price': { type: 'number', editable: false },
					'sale_price': { type: 'number', editable: false },
					'stock_quantity': { type: 'number', editable: false }
				},
				expanded: true
			}
		},
		requestEnd: function(E) {
			
			$rootScope.$broadcast('showproductsgrid');
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
			data: 'Data'
		},
		requestEnd: function(E) {

			Self.RemoteData = E.response.Data;
			Self.DS.read({ data: Self.RemoteData });
		}
	});
	Self.RemoteDS.read();	

	Self.RowsDS = new kendo.data.DataSource({	
		transport: {
			read: {
				url: '/wp-json/poeticsoft/woo-product-rows-read',
				type: 'GET',
				dataType: 'json' 
			},
			update: {
				url: '/wp-json/poeticsoft/woo-product-rows-update',
				type: 'GET',
				dataType: 'json' 
			}
		},
		schema: {
			data: 'Data'
		},		
		group: { 
			field: 'parentbase',
			aggregates: [
				{ field: 'parentbase', aggregate: 'count' }
			]
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