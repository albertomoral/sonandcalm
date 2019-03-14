/* excel-to-web.js */

APP.factory(
	'ExcelToWeb', 
function (
		$rootScope,
		$q, 
		$timeout, 
		Products,
		Categories
) {
	
	var Self = {};

	/* Excel rows to Product Array + Categories & SKU Code Base */

	function digestRange(RowsRange) {

		var Families = {};
		var ProductRows = [];

		RowsRange.forEachRow(function(R, Index) {

			var Row = {};

			R.forEachCell(function (row, column, value) {

				Row[Products.FootPrint.FinalFields[column]] = value.value;
			});

			var SKU = $.trim(Row['Código Barras']);
			if(SKU) {

				var Code = Row['Código Barras'].split('.');
				Row.parentbase = Code[0] + '.' + Code[1] + '.' + Code[2];
				Row.Type = '';

				if(Row.Familia) { Families[Row.Familia] = '';	} // Dummy for unique values

				ProductRows.push(Row);
			} 
		});

		Categories.updateFamilies(Object.keys(Families));

		return ProductRows;
	}

	function updateProductCategories(Products) {

		return Products.map(function(Product) {

			var Family = Product.Familia;
			var FamilyRelations = Categories.RelationsDS.get(Family);
			if(FamilyRelations) {

				Product.Categories = FamilyRelations.categories.toJSON();
			}

			return Product;
		});
	}

	/* Actualize Products.RemoteData */

	function merge(ExcelProducts) {
		
		/* Remove */

		var RemoveProductsIndex = [];
		
		Products.RemoteData.forEach(function(A, Index) {

			var ExcelP = ExcelProducts.find(function(E) { 
				
				return E.sku == A.sku; 
			});

			if(!ExcelP) { 
				
				RemoveProductsIndex.push(Index); 
			}
		});

		RemoveProductsIndex = RemoveProductsIndex.reverse();
		RemoveProductsIndex.forEach(function(Index) { 

			Products.RemoteData.splice(Index, 1);
		});

		/* Actualizar / Crear productos	*/

		ExcelProducts.forEach(function(E) {

			var ActualP = Products.RemoteData.find(function(A) { 
				
				return A.sku == E.sku; 
			});

			if(ActualP) { 

				for (var F in E) { 	
					
					ActualP[F] = E[F];
				}  
				ActualP['dirty'] = true;
			} 
			else { 

				E.id = null; 
				E.dirty = true;
				Products.RemoteData.push(E); 
			}
		});
	}

	function formatProduct(Product) {

		/*
		% Impuesto: undefined
		% Impuesto compra: undefined
		Color: undefined
		Control Stock: undefined
		Código Barras: undefined
		Familia: undefined
		IsSimple: true
		PLU: undefined
		Parent: undefined
		Precio Coste: undefined
		Producto: undefined
		Vars: undefined
		Venta Peso: undefined
		type: "symple"

		return {
			type: Producto.type,
			parent_id: Producto['Código Barras']
			sku: Producto
			parent_sku: Producto
			name: Producto
			category_ids: [],
			image_id: Producto
			price: Producto
			sale_price: Producto
			stock_quantity: Producto
		};
		*/
	}

	/* Processs user interaction */

	Self.process = function(RowsRange) {

		var $Q = $q.defer();
		
		$rootScope.$broadcast('opendialog', {
			Title: 'Excel to Web Products',
			CanCancel: true
		});
		$rootScope.$emit('notifydialog', { text: 'Converting Excel format' });

		$timeout(function() {

			var ProductsData = digestRange(RowsRange);	

			$rootScope.$emit('notifydialog', { text: 'Updating categories...' });

			$timeout(function() {

				ProductsData = updateProductCategories(ProductsData);

				$rootScope.$emit('notifydialog', { text: 'Grouping variations' });

				$timeout(function() {

					Products.RowsDS.data(ProductsData);
					Products.RowsDS.group({ 
						field: 'parentbase',
						aggregates: [
							{ field: 'parentbase', aggregate: 'count' }
						]
					});

					Products.RowsDS.view().forEach(function(Group) {

						var VarCount = Group.aggregates.parentbase.count;
						Group.items.forEach(function(Item, Index) {

							if(VarCount == 1) {

								Item.set('Type', 'simple')
							} else {

								if(Index == 0) {

									Item.set('Type', 'variable');
								} else {

									Item.set('Type', 'variation');
								}
							}
						})
					});

					console.log(Products.RowsDS.data());

					/*	merge(ExcelProducts);

					$rootScope.$emit('notifydialog', { text: 'Updating list, wait...' });

					$timeout(function() {
						
						Products.DS.read({ data: Products.RemoteData });
						$rootScope.$emit('notifydialog', { text: 'Updated!' });

						$timeout(function() {

							$rootScope.$emit('closedialog');
							$rootScope.$broadcast('showproductsgrid');

							$Q.resolve();

						}, 200);

					}, 200);

					*/

				$rootScope.$emit('closedialog');

				}, 200);

			}, 200);

		}, 200);

		$Q.resolve();

		return $Q.promise;
	};

  return Self;
});