/* datasource-products.js */

APP.factory(
	'Products',
function (
	$http,
	$q, 
	$rootScope,
	Notifications
) {

	var Self = {};

	/* Local data for process */

	Self.WebData = {};
	Self.NewData = {};
	Self.TempData = {};	

	var PlainCompares = [
		'parent_sku',
		'type',
		'name',
		'image_id',
		'sale_price',
		'stock_quantity'
	]

	var ArrayCompares = [
		'category_ids',
		'gallery_image_ids',
		'variation_gallery_images'
	]

	function updateData(SKU) {

		/* Plain */

		PlainCompares.forEach(function(Field) {

			if(
				Self.WebData[SKU][Field] != 
				Self.NewData[SKU][Field]
			) {

				Self.TempData[SKU][Field] = Self.NewData[SKU][Field];
				Self.TempData[SKU].status = 'changed';
			}
		});

		/* Arrays */

		ArrayCompares.forEach(function(Field) {

			if(
				[].concat(Self.WebData[SKU][Field]).sort().join() != 
				[].concat(Self.NewData[SKU][Field]).sort().join()
			) {

				Self.TempData[SKU][Field] = Self.NewData[SKU][Field];
				Self.TempData[SKU].status = 'changed';
			}
		});

		/* Attributes */

		if(
			Self.WebData[SKU].attributes.attribute_color != 
			Self.NewData[SKU].attributes.attribute_color
		) {

			Self.TempData[SKU].attributes.attribute_color = Self.NewData[SKU].attributes.attribute_color;
			Self.TempData[SKU].status = 'changed';
		}		

		if(
			Self.WebData[SKU].attributes.attribute_size != 
			Self.NewData[SKU].attributes.attribute_size
		) {

			Self.TempData[SKU].attributes.attribute_size = Self.NewData[SKU].attributes.attribute_size;
			Self.TempData[SKU].status = 'changed';
		}
	}

	Self.processDifferences = function() {

		Self.TempData = {};

		/* Mark as removed web product if not in Agora */

		Object.keys(Self.WebData)
		.forEach(function(SKU) {

			Self.TempData[SKU] = Self.WebData[SKU];
			if(!Self.NewData[SKU]) { Self.TempData[SKU].status = 'deleted';  }
		});

		Object.keys(Self.NewData)
		.forEach(function(SKU) {

			Self.TempData[SKU] = Self.NewData[SKU];
			Self.TempData[SKU].status = 'updated';			

			/* Mark as new if not in web */

			if(!Self.WebData[SKU]) { Self.TempData[SKU].status = 'new'; }				

			/* Update if changed */

			else { updateData(SKU); }

		});

		/* visualize result */

		var TempData = [];
		Object.keys(Self.TempData)
		.forEach(function(SKU) {

			TempData.push(Self.TempData[SKU]);
		});		

		TempData.sort(function(a, b) {

			if (a.sku < b.sku) { return -1; }
			if (a.sku > b.sku) { return 1; };
			return 0;
		});

		Self.DS.read({ data: TempData });

		$rootScope.$broadcast('productschanged');
	}

	/* Data structure for visualization */

	Self.DS = new kendo.data.TreeListDataSource ({
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
					/* Calculated from Excel */
					'sku': { type: 'string', editable: false },
					'parent_sku': { type: 'string', editable: false, nullable: true },
					'type': { type: 'string', editable: false },
					'name': { type: 'string', editable: false },
					'category_ids': [],	
					'sale_price': { type: 'number', editable: false },
					/* Calculated from ColorSize */
					'attributes': {
						'attribute_color': '',
						'attribute_size': ''
					},
					/* Calculated from Images */
					'image_id': { type: 'number', editable: false },
					'gallery_image_ids': [],					
					'variation_gallery_images': [],	
					/* Calculated from Stock */	
					'stock_quantity': { type: 'number', editable: false },
					/* Mark */	
					'status': { type: 'string', editable: false } // 'updated', 'deleted', 'new', 'changed'
				},
				expanded: true
			}
		},
		sort: { 
			field: 'sku', 
			dir: 'asc' 
		}
	});

	/* Load Web Products Data */

	Self.loadFromWeb = function() {

		var $Q = $q.defer();

		$http
		.get('/wp-json/poeticsoft/woo-products-read')
		.then(
			function(Response) {

				$Q.resolve();

				if(Response.data.Status.Code == 'KO') {						
			
					$rootScope.$emit('closedialog');
					return Notifications.show({ errors: Response.data.Status.Reason });
				}			

				Self.WebData = {};
				Response.data.Data.forEach(function(Product) {

					Product.status = 'updated';
					Self.WebData[Product.sku] = Product;				
				});

				/* Visualize */

				Self.DS.read({ data: Response.data.Data });
			}
		);

		return $Q.promise;
	}

	/* Save conversion to web and update woo products */

	var ProcessFragments = [
		'deleted_variation',	
		'deleted_variable',
		'deleted_simple',
		'new_simple',
		'new_variable',
		'new_variation',
		'changed_simple',
		'changed_variable',
		'changed_variation'	
	];

	Self.saveToWeb = function() {

		var $Q = $q.defer();

		/* same as Self.TempData because may be in a future grid will be editable */
		var ProductsData = Self.DS.data().toJSON();

		var Chain = $q.when();
		var Count = 0;
		var Total = 0;
		var Errors = ['TEST'];
		
		ProcessFragments 
		.forEach(function(Key) {

			var Code = Key.split('_');
			var Status = Code[0];
			var Type = Code[1];
			var ProductList = ProductsData.filter(function(Product) {

				return Product.status == Status &&
							 Product.type == Type;
			});
			var ProductsListChunks = _.chunk(ProductList, 20);

			ProductsListChunks
			.forEach(function(Chunk, Index) {

				Total ++;
				
				Chain.then(function(Response) {

					return $http.post(
						'/wp-json/poeticsoft/woo-products-process',
						{ 
							mode: Key,
							products: Chunk,
							chunk: Index
						}
					)
					.then(function(Response) {
					
						if(Response.data.Status.Code == 'KO') {	

							Errors.push(Response.data.Status.Reason);						
						}
						
						Count++;
						if(Count == Total) {	

							if(Errors.length > 0) {

								Notifications.show({ errors: Errors.join(' - ') });	
							}							

							$Q.resolve();
						}

						$rootScope.$emit(
							'notifydialog', 
							{ 
								text: Response.data.Status.Message +
										  ' saved block ' + 
											Index +
											' of ' +
											Chunk.length + 
											' ' + 
											Status + 
											' ' + 
											Type + 
											' products...'
							}
						); 
					});
				});
			});	
		});

		return $Q.promise;
	}

	/* Load Excel FootPrint */

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

	/* Load last products processed data */
	
	Self.loadFromWeb();

	return Self;
});