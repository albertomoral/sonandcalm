
APP.factory('DataSource', function ($q, $rootScope, $timeout, Errors) {

	var FirstTimeReadProducts = false;

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

			if(!FirstTimeReadProducts) { // Hack  

				Self.WooProducts.read();
				FirstTimeReadProducts = true;
			}
		}
	});
	Self.WooProductCategories.read();
	
	// WOO PRODUCTS (for <- -> web)
	
	Self.WooProducts = new kendo.data.TreeListDataSource ({
		transport: {
			read: {
				url: '/wp-json/poeticsoft/woo-products-read',
				type: 'GET',
				dataType: 'json' 
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
					'id': { type: 'number', editable: false },
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

	// ---------------------------------------------
	// Excel to web

	Self.ProductsFromExcel = [];
	var ProductFromExcelInProcessIndex = 0;
	var DisableProcessing = false;

	function updateProduct() {


	}

	function createProduct(WooProduct, Product) {

		$rootScope.$emit('contentdialog', {
			Text: 'Creating product ' + ProductFromExcelInProcessIndex
		});

		var NewProduct = {	
			id: null,
			type: '',
			sku: Product.SKU,
			parent_sku: Product.ParentSKU || null,
			name: Product.producto_1.Value,
			category_ids: [],
			image_id: '',
			price: Product.precio_coste_7.Value,
			sale_price: Product.precio_general_14.Value,
			stock_quantity: 0
		};

		var NewItem = Self.WooProducts.add(NewProduct);
		NewItem.dirty = true;
	}

	Self.stopProcess = function() {

		DisableProcessing = true;
	}

	function processProduct() {

		if(DisableProcessing || Self.ProductsFromExcel.length == 0) { 

			return 'End';
		}

		var Result;

		var Product = Self.ProductsFromExcel[ProductFromExcelInProcessIndex];
		if(Product && Product.SKU) {

			var WooProduct = Self.WooProducts.get(Product.SKU);
			if(WooProduct) {


			} else {

				createProduct(WooProduct, Product)
			}
		}

		ProductFromExcelInProcessIndex++;
		if(ProductFromExcelInProcessIndex > Self.ProductsFromExcel.length - 1) {

			return 'End';
		}

		$timeout(processProduct, 1);
	}

	Self.mergeProducts = function() {
		
		ProductFromExcelInProcessIndex = 0;
		DisableProcessing = false;

		var $Q = $q.defer();

		var Process = processProduct();

		switch(Process) {

			case 'End': $Q.resolve(); break;
			case 'Error': $Q.reject(); break;
			default: processProduct(); break;
		}


		/*

		Products.forEach(function(Product) {

			var WCProduct = Self.WooProducts.get(Product.SKU);

			if(WCProduct) {

				console.log('UPDATE');
			} else {

				var NewProduct = {	
					id: null,
					type: '',
					sku: Product.SKU,
					parent_sku: Product.ParentSKU || null,
					name: Product.producto_1,
					category_ids: [],
					image_id: '',
					price: Product.precio_coste_7,
					sale_price: Product.precio_general_14,
					stock_quantity: 0
				};

				Self.WooProducts.add(NewProduct);			
			}
		});
		*/

		return $Q.promise;
	};
	
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
        