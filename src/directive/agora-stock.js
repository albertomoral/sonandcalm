/* excel.js */

APP.directive(
		'poeticsoftWooAgoraStock', 
	function() {

		function controller(
			$http,
			$rootScope,
			$scope,
			$timeout,
			Products,
			Notifications,
			Stock
		) {
			
			$scope.allowApply = false;

			// Loader

			$scope.AgoraKendoUploadConfig = {
				multiple: false,
				async: {
					autoUpload: false
				},
				validation: {
					allowedExtensions: ['.xlsx'],
				},
        localization: {
            select: "Select EXCEL file"
        },
				select: function(e) {
					
					$scope.AgoraStockKendoSpreadsheet
					.fromFile(e.files[0].rawFile)
					.then(sheetLoaded);
				}
			}

			function sheetLoaded() {
				
				CanProcess = true;

				$rootScope.$broadcast('opendialog', {
					Title: 'Stock process',
					cancel: function() {

						CanProcess = false;
						return false;
					}
				});

				// There is a sheet "Inventario"

				$rootScope.$emit('notifydialog', { text: 'Searching Inventario sheet...' });

				var InventarioSheet = $scope.AgoraStockKendoSpreadsheet.sheetByName('Inventario');
				if(!InventarioSheet) {
					
					$rootScope.$emit('closedialog');
					return Notifications.show({ errors: 'Load an Excel file with an "Inventario" sheet' });
				}	

				// Fields secuence validation

				$rootScope.$emit('notifydialog', { text: 'Validating sheet...' });

				RowCount = InventarioSheet._rows._count;				

				InventarioSheet.range(
					'A2:' + 
					Products.FootPrint.Stock.MaxCellIndex + 
					RowCount
				).sort(Products.FootPrint.Stock.SKUCellIndex);
						
				var FieldsRow = InventarioSheet.range(
					'A1:' + Products.FootPrint.Stock.MaxCellIndex + 1
				).values()[0];
				var FieldsFootPrint = FieldsRow.join('|');

				if(FieldsFootPrint == Products.FootPrint.Stock.Hash) {

					$rootScope.$emit('notifydialog', { text: 'Extracting data...' });

				} else {
			
					$rootScope.$emit('closedialog');
					return Notifications.show(
						{ 
							errors: 'Error, Products sheet doesn\'t have appropiate fields structure, get another file.'
						},
						true,
						4000
					);
				}

				//  Disable edit				

				Products.FootPrint.Stock.NoEdit.split('')
				.forEach(function(ColumnIndex) {

					var Range = ColumnIndex + '1:' + ColumnIndex + RowCount;
					InventarioSheet.range(Range).enable(false)
				});

				// Extract data				

				$timeout(function() {				

					Stock.Data = {};

					var Rows = InventarioSheet.toJSON().rows;
					Rows.shift(); // Extract field names

					Rows.forEach(function(Row) {

						var SKUCell = Row.cells.find(function(Cell) {

							return Cell.index == 4; // 'Código Barras';
						});

						if(!SKUCell) return;

						var StockCell = Row.cells.find(function(Cell) {

							return Cell.index == 5; // 5 > Stock Teórico (Uds. Venta) | 6 > Stock real;
						});

						if(!StockCell) return;

						Stock.Data[SKUCell.value] = {
							Value: StockCell.value
						};
					});

					$rootScope.$emit('notifydialog', { text: 'Data Ready' });

					$timeout(function() {

						$scope.allowApply = true;
						$rootScope.$emit('closedialog');

					}, 200);
				}, 200);
			}
		
			$scope.AgoraStockSpreadsheetConfig = {
				toolbar: {
					home: false,
					insert: false,
					data: false
				}
			};

			// Apply stock to web products

			$scope.applyToWebProducts = function() {	
				
				$scope.allowApply = false;

				$rootScope.$broadcast('opendialog', {
					Title: 'Apply stock'
				});	
				$rootScope.$emit('notifydialog', { text: 'Updating web products' });			      

				$timeout(function() {

					Products.updateStock()
					.then(function() {
							
						$rootScope.$emit('notifydialog', { text: 'Saving stock data' });

						$http.post(
							'/wp-json/poeticsoft/woo-products-stock-update',
							Stock.Data
						)
						.then(function(Response) {
		
							var Code = Response.data.Status.Code;
							if(Code == 'OK'){ 
		
								$rootScope.$emit('notifydialog', { text: Response.data.Status.Message });
		
							} else {
		
								$rootScope.$emit('notifydialog', { text: 'Error: ' + Response.data.Status.Reason }); 
							}

							$rootScope.$emit('closedialog');
							$scope.allowApply = true;
						});	
					})
				}, 200);			
			}
		}

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller,
			template: `<div class="poeticsoft-woo-agora-stock">
				<div class="SpreadsheetTools">
					<input kendo-upload="AgoraKendoUpload"
						     name="file"
						     type="file"
						     k-options="AgoraKendoUploadConfig"
					/>
					<div class="Actions">
						<button class="k-button"
										ng-click="applyToWebProducts()"
										ng-disabled="!allowApply">
							Apply
						</button>
					</div>
				</div>
				<div class="SpreadsheetView">
					<div kendo-spreadsheet="AgoraStockKendoSpreadsheet"
							 k-options="AgoraStockSpreadsheetConfig">
					</div>
				</div>
			</div>`
		};
	});