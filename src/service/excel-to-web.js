/* excel-to-web.js */

APP.factory(
	'ExcelToWeb', 
function (
		$rootScope,
		$q, 
		$timeout, 
		Products,
		Categories,
		Images,
		ColorSize
) {
	
	var Self = {};

	/* Utils */

	function formatName(Name) {

		return Name.split(' ')
							 .map(function(Word) {

								return s.capitalize(Word, true);
							})
							.join(' ');
	}

	/* format Excel Columns to Woo struct */

	function formatProduct(Product) {

		var SKU = Product['Código Barras'];

		return {
			/* Calculated from Excel */
			sku: SKU,
			parent_sku: Product.Parent,
			type: Product.Type,
			name: Product.Producto,
			category_ids: Product.Categories || [],
			regular_price: Product['Precio General'] || 0,
			/* Calculated from ColorSize */
			attributes: {
				color: Product.Attributes && Product.Attributes.Color,
				size: Product.Attributes && Product.Attributes.Size
			},
			/* Calculated from Images */
			image_id: Product.ImageId,
			gallery_image_ids: Product.GalleryImageIds || [],
			variation_gallery_images: Product.VariationGalleryImages || []
		};
	}

	/* Add simple product */

	function addSimpleProduct(Group) {

		var Product = Group[0];
		var SKU = Product['Código Barras'];	
		var ProductImages = Images.Group[SKU] && 
												Images.Group[SKU].items &&
												Images.Group[SKU].items.map(function(Image) {

													return Image.attid;
												});
		Product.Parent = null;
		Product.Type = 'simple';
		Product.Producto = formatName(Product.Producto);
		Product.Categories = Categories.FamilyCategories[Product.Familia] || [];
		Product.Attributes = {
			Color: ColorSize.Data[SKU] && ColorSize.Data[SKU].color || '',
			Size: ColorSize.Data[SKU] && ColorSize.Data[SKU].size || ''
		};
		Product.ImageId = ProductImages && 
										 (ProductImages.length > 0 ) && 
										  ProductImages.shift();
		Product.GalleryImageIds = ProductImages && 
														 (ProductImages.length > 0 ) &&
															ProductImages;

		Products.AgoraData[SKU] = formatProduct(Product);
	}

	/* Add variable product */

	function addVariableProduct(Group, SKU) {

		var Product = {
			Parent: null,
		 'Código Barras': SKU,
			Type: 'variable' 
		}

		/* Name as minimun common from variations */

		Product.Producto = formatName(_.intersection(...Group.map(function(P) {
			
			return P.Producto.split(' ');
		})).filter(function(Part) {

			return Part != 'CM' ||
										 'M' ||
										 'PERFIL' || 
										 'SEDA+' || 
										 'ALGODON+BAMBU' ||
										 'cm'
		})
		.map(function(Word) {

			// return _.upperFirst(Word.toLowerCase());
			return Word.toLowerCase();
		})
		.join(' '));

		/* Categories as unique from variations (because family in variations can change?) */

		Product.Categories = _.union(Group.map(function(P) {

			return Categories.FamilyCategories[P.Familia] || [];
		}));

		/* Attributes as uniq sum of color & Size of variations */

		Product.Attributes = {
			Color: _.uniq(Group.map(function(P) { return P.Color; })).join('|'),
			Size: _.uniq(Group.map(function(P) { return P.Size; })).join('|')
		}

		/*
			Image as first image from first variation 
			TODO remove from variations?
		*/

		var GroupImages = Group.reduce(function(Accumulate, Variation) {

			var VariationSKU = Variation['Código Barras'];
			var VariationImages = Images.Group[VariationSKU];
			
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

		if(GroupImages.length > 0) {

			Product.ImageId = GroupImages[0];
		}

		/* Add variable product */

		Products.AgoraData[SKU] = formatProduct(Product);	

		/* Variations */

		Group.forEach(addVariationProduct);
	}

	/* Add variation product */

	function addVariationProduct(Product) {

		var SKU = Product['Código Barras'];

		Product.Type = 'variation';		
		Product.Producto = formatName(Product.Producto);
		Product.Attributes = {
			Color: Product.Color || '',
			Size: Product.Size || ''
		};		

		/* Image as first image from group, rest are gallery images */

		var VariationImages = Images.Group[SKU];
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

		if(VariationImagesIds && VariationImagesIds.length > 0) {

			Product.ImageId = VariationImagesIds.shift();
			Product.VariationGalleryImages = VariationImagesIds;
		}

		/* Add variation product */

		Products.AgoraData[SKU] = formatProduct(Product);
	}

	/* Excel rows to Product List Struct */

	function digestRange(RowsRange) {

		var Families = {};
		var ProductRows = [];

		/* Rows to array of row objects */

		RowsRange.forEachRow(function(R, Index) {

			var Row = {};

			R.forEachCell(function (row, column, value) {

				Row[Products.FootPrint.FinalFields[column]] = value.value;
			});

			var SKU = jQuery.trim(Row['Código Barras']);
			if(SKU) {

				if(Row.Familia) { Families[Row.Familia] = '';	} // Dummy for unique values
				ProductRows.push(Row);
			} 
		});
		
		/* Categories based in family mapping */

		Categories.updateFamilies(Object.keys(Families));

		/* Initialize AgoraData array */

		Products.AgoraData = {};

		/* Group by Parent to create variations */

		var ProductParentGroups = _.groupBy(ProductRows, function(Row) {

			return Row.Parent;
		});

		Object.keys(ProductParentGroups)
		.forEach(function(ParentSKU) {
			
			var Group = ProductParentGroups[ParentSKU];
			var ProductCount = Group.length;
			
			(ProductCount == 1) && addSimpleProduct(Group);
			(ProductCount != 1) && addVariableProduct(Group, ParentSKU);
		});
	}	

	/* Processs on user interaction */

	Self.processExcelData = function(RowsRange) {

		var $Q = $q.defer();
		
		$rootScope.$broadcast('opendialog', {
			Title: 'Excel to Web Products',
			CanCancel: true
		});
		$rootScope.$emit('notifydialog', { text: 'Converting Excel format and calculating type, images & categories' });

		$timeout(function() {

			digestRange(RowsRange);
		
			$rootScope.$emit('notifydialog', { text: 'Calculating differences with web status' });

			$timeout(function() {

				Products.updateFromAgora();

				$rootScope.$broadcast('closedialog');

				$Q.resolve();
				
			}, 200);
		}, 200);

		return $Q.promise;
	};

  return Self;
});