
APP.factory('DataSource', function ($q, $timeout, Errors) {

	var Self = {};
	
	Self.WooProductCategories = new kendo.data.DataSource ({
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

			Self.WooProducts.read();
		}
	});
	Self.WooProductCategories.read();
	
	// WOO PRODUCTS
	
	Self.WooProducts = new kendo.data.TreeListDataSource ({
		transport: {
			read: {
				url: '/wp-json/poeticsoft/woo-products-read',
				type: 'GET',
				dataType: 'json' 
			},
			update: {
				url: '/wp-json/poeticsoft/woo-products-create-update',
				type: 'PUT',
				dataType: 'json'
			}
		},
		schema: {
			model: {
				id: 'id',
				parentId: 'parent_id',
				fields: {
					'id': { type: 'number', editable: false },
					'type': { type: 'string', editable: false },
					'parent_id': { type: 'number', editable: false, nullable: true },
					'sku': { type: 'string', editable: false },
					'name': { type: 'string', expanded: false },
					'category_ids': [],
					'image_id': { type: 'number' },
					'price': { type: 'number' },
					'sale_price': { type: 'number' },
					'stock_quantity': { type: 'number' }
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

	Self.WooProductCategories.bind('change', function() {

		console.log('WooProductCategories');
	});
	
	// IMAGES

	Self.Images = new kendo.data.DataSource({
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
        