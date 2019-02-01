
APP.factory(
	'ExcelToWeb', 
function (
		$rootScope,
		$q, 
		$timeout, 
		Errors, 
		Utils, 
		Products,
		Data
) {
	
	var Self = {};

	Self.BlockCodes = {};
	Self.Families = {};

	function digestRows(Rows) {

		var RowsData = [];		
		var HeaderRow = Rows.shift();
		var Fields = HeaderRow.cells.map(function(Cell) {

			return {
				Nick: Utils.toSlug(Cell.value + '_' + Cell.index),
				Name: Cell.value
			}
		});

		var ParentSKU = '';
		Rows.forEach(function(Row) {

			var RowData = {};

			Fields.forEach(function(Field, Index) {

				var Cell = Row.cells.find(function(C) {

					return C.index == Index;
				});

				RowData[Field.Nick] = {
					Field: Field.Name,
					Value: (Cell && Cell.value) || '',
					State: (Cell && Cell.background) || ''
				}
			});

			RowData.SKU = RowData['codigo_barras_5'].Value;
			if(RowData.SKU.trim() != '') {

				var Code = RowData.SKU.split(',').join('.').split('.');
				RowData.BlockCode = Code[0] + '.' + Code[1] + '.' + Code[2];
				RowData.ParentSKU = '';

				if(!Self.BlockCodes[RowData.BlockCode]) {

					RowData.IsParent = true;
					ParentSKU = RowData.SKU;

					Self.BlockCodes[RowData.BlockCode] = {
						Color: {},
						Size: {}
					};
				} else {

					RowData.ParentSKU = ParentSKU;
				}

				Self.BlockCodes[RowData.BlockCode].Color[RowData['color_2'].Value] = 'color'; 	// Hack unique values
				Self.BlockCodes[RowData.BlockCode].Size[RowData['talla_3'].Value] = 'size'; 		//

				Self.Families[RowData['familia_0'].Value] = 'family';

				RowsData.push(RowData);
			}
		});

		Object.keys(Self.BlockCodes)
		.forEach(function(BC) {

			Self.BlockCodes[BC].Color = Object.keys(Self.BlockCodes[BC].Color);
			Self.BlockCodes[BC].Size = Object.keys(Self.BlockCodes[BC].Size);
		});

		Self.Families = Object.keys(Self.Families);

		return RowsData;
	}

	function mapProduct( Product) {
				
		return {	
			id: null,
			type: Product.IsParent ? 'Variable' : 'Variacion',
			sku: Product.SKU,
			parent_sku: Product.ParentSKU || null,
			name: Product.producto_1.Value,
			category_ids: [],
			image_id: '',
			price: Product.precio_coste_7.Value,
			sale_price: Product.precio_general_14.Value,
			stock_quantity: 0
		};
	}

	function merge(ActualProducts, ExcelProducts) {

		/* Remove */

		var RemoveProductsIndex = [];
		
		ActualProducts.forEach(function(A, Index) {

			var ExcelP = ExcelProducts.find(function(E) { 
				
				return E.sku == A.sku; 
			});

			if(!ExcelP) { 
				
				RemoveProductsIndex.push(Index); 
			}
		});

		RemoveProductsIndex = RemoveProductsIndex.reverse();
		RemoveProductsIndex.forEach(function(Index) { 

			ActualProducts.splice(Index, 1);
		});

		/* Actualizar / Crear productos	*/

		ExcelProducts.forEach(function(E) {

			var ActualP = ActualProducts.find(function(A) { 
				
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
				ActualProducts.push(E); 
			}
		});
	}

	Self.mergeProducts = function(Rows) {

		var $Q = $q.defer();

		$rootScope.$emit('notifydialog', 'Converting Excel format');

		$timeout(function() {

			var ExcelProducts = digestRows(Rows)
			.map(mapProduct);			

			$rootScope.$emit('notifydialog', 'Updating web products');

			$timeout(function() {
				
				merge(Products.RemoteData, ExcelProducts);

				$rootScope.$emit('notifydialog', 'Updating list, wait...');

				$timeout(function() {
					
					Products.DS.read({ data: Products.RemoteData });
					$rootScope.$emit('notifydialog', 'Updated!');

					$timeout(function() {

						$rootScope.$emit('closedialog');
						$rootScope.$broadcast('showproductsgrid');

					}, 200);

				}, 200);

			}, 200);

		}, 200);

		return $Q.promise;
	};

	/* DEBUG wit fake data from Data.ExcelProducts */

	var DebugFirstTime = true;

	function debugMerge() {

		$rootScope.$broadcast('hideproductsgrid');		
		$rootScope.$broadcast('opendialog', {
			Title: 'Excel to Web Products'
		});
		$rootScope.$broadcast('notifydialog', 'Loading Excel data...');

		$timeout(function() {

			Self.mergeProducts(Data.ExcelProducts);
		}, 1000);
	}

	Products.RemoteDS.bind('requestEnd', function() {

		if(DebugFirstTime) {

			$timeout(debugMerge, 1000);
			DebugFirstTime = false;
		}
	});

  return Self;
});