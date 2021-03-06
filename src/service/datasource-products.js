/* datasource-products.js */

APP.factory(
	'Products',
function (
	$http,
	$q, 
	$timeout,
	$rootScope,
	Stock,
	Images,
	Categories,
	Notifications,
	Loader
) {

	var Self = {};

	/* -------------------------------------------------------------------------
		 Local data for process 
	*/

	Self.WebData = {}; 		// Products loaded from web
	Self.AgoraData = {}; 	// Products from agora export 
	Self.TempData = {};		// Process buffer

	/* -------------------------------------------------------------------------
		 Calculate changes betweeen web data and actual agora data + stock 
	*/

	var PlainCompares = [
		'parent_sku',
		'type',
		'name',
		'image_id',
		'sale_price'
	]

	var ArrayCompares = [
		'category_ids',
		'gallery_image_ids'
	]

	function calculateAgoraWebChanges(SKU) {

		/*
		console.log('----------------------------------------------------');
		console.log(Self.WebData[SKU]); 
		console.log(Self.AgoraData[SKU]);
		*/

		/* Changes array */

		Self.TempData[SKU].changes = [];

		/* Plain */

		PlainCompares.forEach(function(Field) {

			if(
				Self.WebData[SKU][Field] != 
				Self.AgoraData[SKU][Field]
			) {

				Self.TempData[SKU][Field] = Self.AgoraData[SKU][Field];
				Self.TempData[SKU].status = 'changed';
				Self.TempData[SKU].changes.push(Field);
			}
		});

		/* Arrays */

		ArrayCompares.forEach(function(Field) {

			var WebArray = [].concat(Self.WebData[SKU][Field]).sort().join();
			var AgoraArray = [].concat(Self.AgoraData[SKU][Field]).sort().join();

			if(WebArray != AgoraArray) {

				Self.TempData[SKU][Field] = Self.AgoraData[SKU][Field];
				Self.TempData[SKU].status = 'changed';
				Self.TempData[SKU].changes.push(Field);
			}
		});

		/* Attributes */

		var WebColor = Self.WebData[SKU].attributes.color.split('|').sort().join('|');
		var AgoraColor = Self.AgoraData[SKU].attributes.color.split('|').sort().join('|');

		if(WebColor != AgoraColor) {

			Self.TempData[SKU].attributes.color = AgoraColor;
			Self.TempData[SKU].status = 'changed';
			Self.TempData[SKU].changes.push('color');
		}		

		var WebSize = Self.WebData[SKU].attributes.size.split('|').sort().join('|');
		var AgoraSize = Self.AgoraData[SKU].attributes.size.split('|').sort().join('|');

		if(WebSize !=  AgoraSize) {

			Self.TempData[SKU].attributes.size = AgoraSize;
			Self.TempData[SKU].status = 'changed';
			Self.TempData[SKU].changes.push('size');
		}

		/* Stock */

		calculateStock(SKU);
	}	

	/* -------------------------------------------------------------------------
		Update stock in actual products
	*/

	function calculateStock(SKU) {							

		if(Self.TempData[SKU].type == 'variable') {

			Self.TempData[SKU].stock_quantity = '';
			Self.TempData[SKU].last_stock_quantity = '';
			Self.TempData[SKU].import_stock_quantity = '';
			Self.TempData[SKU].export_stock_quantity = '';
			
		} else {

			var StockQuantity = Self.WebData[SKU] ? Self.WebData[SKU].stock_quantity : null;

			Self.TempData[SKU].stock_quantity = StockQuantity;
			Self.TempData[SKU].last_stock_quantity = (Stock.OldData[SKU] && Stock.OldData[SKU].Value) || '-';
			Self.TempData[SKU].import_stock_quantity = (Stock.NewData[SKU] && Stock.NewData[SKU].Value) || '-';
			Self.TempData[SKU].export_stock_quantity = Self.TempData[SKU].stock_quantity ?
																										Self.TempData[SKU].import_stock_quantity - 
																										(
																												Self.TempData[SKU].last_stock_quantity - 
																												Self.TempData[SKU].stock_quantity
																										) 
																										:
																										Self.TempData[SKU].import_stock_quantity;	

			if(
				Self.TempData[SKU].stock_quantity != Self.TempData[SKU].export_stock_quantity
			) {
					
				Self.TempData[SKU].status = 'changed';
				Self.TempData[SKU].changes = Self.TempData[SKU].changes || [];
				Self.TempData[SKU].changes.push('stock');
			}

			if(
				Self.TempData[SKU].import_stock_quantity != Self.TempData[SKU].export_stock_quantity
			) {
					
				Self.TempData[SKU].changes = Self.TempData[SKU].changes || [];
				Self.TempData[SKU].changes.push('exportstock');
			}

			if(Self.TempData[SKU].export_stock_quantity < 0) {

				Self.CanUpdateWeb = false;
			}			
		}	
	}

	/* -------------------------------------------------------------------------
		Update stock in actual products
	*/

	Self.CanUpdateWeb = true; // Cannot update web if export stock is negative;
	Self.updateStock = function() {

		Self.CanUpdateWeb = true;

		Object.keys(Self.TempData)
		.forEach(calculateStock);		

		visualize();
	}

	/* -------------------------------------------------------------------------
		Update categories when relations change
	*/

	function calculateCategories(SKU) {

		var Type = Self.TempData[SKU].type;
		var NewCategoryIds;

		Self.TempData[SKU].changes = Self.TempData[SKU].changes || [];

		switch(Type) {

			case 'simple':

				var ProductFamily = Categories.ProductsFamily[SKU];  
				NewCategoryIds = Categories.FamilyCategories[ProductFamily] || [Categories.UncategorizedId];

				break;

			case 'variable':

				var ProductVariations = _.filter(Self.TempData, function(Product) {

					return Product.parent_sku == SKU;
				});

				NewCategoryIds = ProductVariations.reduce(function(Accumulate, Variation) {

					var VariationFamily = Categories.ProductsFamily[Variation.sku]; 
					var VariationCategories = Categories.FamilyCategories[VariationFamily] || [Categories.UncategorizedId];          
					Accumulate = _.union(Accumulate, VariationCategories);
	
					return Accumulate;
	
				}, []);

				break;
		}	

		var OldCategories = [].concat(Self.TempData[SKU].category_ids).sort().join();
		var NewCategories = [].concat(NewCategoryIds).sort().join();

		if(OldCategories != NewCategories) {					
				
			Self.TempData[SKU].category_ids = NewCategoryIds;
			Self.TempData[SKU].status = 'changed';
			Self.TempData[SKU].changes.push('category_ids');
		}
	}

	Self.updateCategories = function() {

		Object.keys(Self.TempData)
		.forEach(calculateCategories);

		/* visualize result */

		visualize();
	}	

	/* -------------------------------------------------------------------------
		Update images when upload new images
	*/

	function calculateImages(SKU) {

		var Type = Self.TempData[SKU].type;
		var ProductImages = Images.Group[SKU] && 
												Images.Group[SKU].items &&
												Images.Group[SKU].items.map(function(Image) {

													return Image.attid;
												});
		var NewImageId;
		var NewGalleryImageIds = [];

		Self.TempData[SKU].changes = Self.TempData[SKU].changes || [];

		switch(Type) {

			case 'simple':
			
				NewImageId = ProductImages && 
										(ProductImages.length > 0 ) && 
										 ProductImages.shift();
				NewGalleryImageIds = ProductImages && 
														 ProductImages.length > 0 ? 
															 ProductImages
															 : 
															 [];

				break;

			case 'variable':

				var ProductVariations = _.filter(Self.TempData, function(Product) {

					return Product.parent_sku == SKU;
				});
				var ProductImages = ProductVariations.reduce(function(Accumulate, Variation) {

					var VariationImages = Images.Group[Variation.sku];
					
					if(VariationImages) {

						var VariationImagesIds = VariationImages
						.items
						.map(
							function(Image) { 
								return Image.attid;
							}
						);

						Accumulate = Accumulate.concat(VariationImagesIds);
					}

					return Accumulate;

				}, []);

				if(ProductImages.length > 0) {

					NewImageId = ProductImages.shift();
				}

				if(ProductImages.length > 0) {

					NewGalleryImageIds = _.unique(NewGalleryImageIds.concat(ProductImages));
				}

				/* Variations */	
					
					/*					

				_.filter(Self.TempData, function(Product) {
					
					return Product.parent_sku == SKU;
				})
				.forEach(function(Variation) {

					var VariationImages = Images.Group[Variation.sku];
					var VariationImagesIds;			
					if(VariationImages) {
			
						VariationImagesIds = VariationImages
						.items
						.map(
							function(Image) { 
								return Image.attid;
							}
						);
					}
			
					// Pick only first for variation rest for product gallery
			
					if(VariationImagesIds && VariationImagesIds.length > 0) {
			
						var NewVariationImageId = VariationImagesIds.shift();	

						if(Variation.image_id != NewVariationImageId) {	

							console.log('sdf ' + Variation.image_id + ' ' + NewVariationImageId);

							Variation.changes = Variation.changes || [];					
							Variation.image_id = NewVariationImageId;
							Variation.status = 'changed';
							Variation.changes.push('image_id');
						}
			
						if(VariationImagesIds.length > 0) {
			
							NewGalleryImageIds = _.unique(NewGalleryImageIds.concat(VariationImagesIds));
						}
					}
				});
					*/

				break;
		}	

		if(
			Type == 'simple' || 
			Type == 'variable'
		) {

			if(NewImageId != Self.TempData[SKU].image_id) {					
					
				Self.TempData[SKU].image_id = NewImageId;
				Self.TempData[SKU].status = 'changed';
				Self.TempData[SKU].changes.push('image_id');
			}	

			var OldGalleryImages = [].concat(Self.TempData[SKU].gallery_image_ids).sort().join();
			var NewGalleryImages = [].concat(NewGalleryImageIds).sort().join();

			if(OldGalleryImages != NewGalleryImages) {					
					
				Self.TempData[SKU].gallery_image_ids = NewGalleryImageIds;
				Self.TempData[SKU].status = 'changed';
				Self.TempData[SKU].changes.push('gallery_image_ids');
			}
		}
	}

	Self.updateImages = function() {

		Object.keys(Self.TempData)
		.sort()
		.forEach(calculateImages);

		/* visualize result */

		visualize();
	}

	/* -------------------------------------------------------------------------
		 Update process buffer with data from agora excel 
	*/

	Self.updateFromAgora = function() {

		Self.TempData = {};

		/* Mark as removed web product if not in Agora */

		Object.keys(Self.WebData)
		.forEach(function(SKU) {

			Self.TempData[SKU] = Self.WebData[SKU];
			if(!Self.AgoraData[SKU]) { Self.TempData[SKU].status = 'deleted';  }
		});

		Object.keys(Self.AgoraData)
		.forEach(function(SKU) {

			Self.TempData[SKU] = Self.AgoraData[SKU];
			Self.TempData[SKU].status = 'updated';

			/* Mark as new if not in web */

			if(!Self.WebData[SKU]) { Self.TempData[SKU].status = 'new'; }				

			/* Update if changed */

			else { calculateAgoraWebChanges(SKU); }
			
		});

		/* visualize result */

		visualize();
	}

	/* -------------------------------------------------------------------------
		Converts TempData in an array for consuming in Kendo Grid
	*/

	function visualize() {

		var VisualizeData = [];

		Object.keys(Self.TempData)
		.forEach(function(SKU) {

			VisualizeData.push(Self.TempData[SKU]);
		});		

		VisualizeData.sort(function(a, b) {

			if (a.sku < b.sku) { return -1; }
			if (a.sku > b.sku) { return 1; };
			return 0;
		});

		Self.DS.read({ data: VisualizeData });

		$rootScope.$broadcast('productschanged');
	}			

	/* -------------------------------------------------------------------------
		Data structure for kendo grid
	*/

	Self.DSConfig = {
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
					/* Mark */	
					'status': { type: 'string', editable: false }, // 'updated', 'deleted', 'new', 'changed'
					/* Calculated from ColorSize */
					'attributes': {
						'color': '',
						'size': ''
					},
					/* Calculated from Images */
					'image_id': { type: 'number', editable: false },
					'gallery_image_ids': [],
					/* Calculated from Stock */	
					'stock_quantity': { type: 'number', editable: false },
					'last_stock_quantity': { type: 'number', editable: false }, 
					'import_stock_quantity': { type: 'number', editable: false }, 
					'export_stock_quantity': { type: 'number', editable: false },
					/* Changes list */
					'changes': []
				},
				expanded: true
			}
		},
		sort: { 
			field: 'sku', 
			dir: 'asc' 
		}
	};

	Self.DS = new kendo.data.TreeListDataSource (Self.DSConfig);

	/* -------------------------------------------------------------------------
		Load Web Products Data
	*/

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
				Self.AgoraData = {};
				Self.TempData = {};

				Response.data.Data.forEach(function(Product) {

					Product.status = 'updated';
					Product.parent_sku = Product.parent_sku || null; // Tree View
					Self.WebData[Product.sku] = Product;
				});
										
				Self.AgoraData = JSON.parse(JSON.stringify(Self.WebData));						
				Self.TempData = JSON.parse(JSON.stringify(Self.WebData));

				Object.keys(Self.TempData)
				.sort()
				.forEach(function(SKU) {
					
					calculateStock(SKU);
					calculateImages(SKU);
				});	

				visualize();
			}
		);

		return $Q.promise;
	}

	/* -------------------------------------------------------------------------
		Save conversion to web and update woo products
	*/

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

		/* Same as Self.TempData but may be in a future grid will be editable */

		var ProductsData = Self.DS.data().toJSON();		
        
		/* Stock excel update */

		$rootScope.$broadcast('updateexcelstock', ProductsData);
		
		/* Generate queue */

		var Queue = [];

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
			var ChunkCount = ProductsListChunks.length;

			ProductsListChunks
			.forEach(function(Chunk, Index) {

				Queue.push({
					mode: Key,
					products: Chunk,
					chunk: Index + 1,
					count: ChunkCount
				});
			});
		});

		function processQueue() {

			if(Queue.length == 0) {	

				$rootScope.$emit('notifydialog', { text: 'Queue finished, updating state...' });

				return $timeout(function() {

					Self.loadFromWeb()
					.then(function() {						

						$rootScope.$emit('notifydialog', { text: 'State updated refreshing data...' });

						$timeout(function() {
					
							$Q.resolve();
						}, 200);
					});
				}, 200);
			}

			var Chunk = Queue.shift();

			$http.post(
				'/wp-json/poeticsoft/woo-products-process',
				Chunk
			)
			.then(function(Response) {
			
				if(Response.data.Status.Code == 'KO') {	

					Notifications.show({ errors: Response.data.Status.Reason });	
				}
				
				$rootScope.$emit('notifydialog', { text: Response.data.Status.Message }); 

				$timeout(processQueue, 10);
			});
		}

		if(Queue.length > 0) {
			
			processQueue();

		}	else {
			
			$rootScope.$emit('notifydialog', { text: 'Nothing to update...' });

			$timeout(function() {
				
				$Q.resolve();
			}, 200);
		}

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

			Loader.ready('FieldsFootPrint');
		}
	);

	/* Load last products processed data when resources ready */
	
	$rootScope.$on('loader_productsexcelresources_ready', function() {

		Self.loadFromWeb();
	});

	return Self;
});