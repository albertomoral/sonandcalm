
APP.factory(
	'Products',
function (
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

	return Self;
});