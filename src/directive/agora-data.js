/* excel.js */

APP.directive(
		'poeticsoftWooAgoraData', 
	function() {

		function controller(
			$http,
			$rootScope,
			$scope,
			$timeout,
			Notifications,
			ExcelToWeb,
			Products,
			ColorSize,
			ParentSku
		) {
			
			$scope.allowProcessing = false;
			$scope.dataChanged = false;

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
					
					$scope.AgoraDataKendoSpreadsheet
					.fromFile(e.files[0].rawFile)
					.then(sheetLoaded);
				}
			}

			var ProductsSheet;
			var RowCount;
			var CanProcess = true;

			function sheetLoaded() {
				
				CanProcess = true;

				$rootScope.$broadcast('opendialog', {
					Title: 'Excel data process',
					cancel: function() {

						CanProcess = false;
						return false;
					}
				});

				// There is a sheet "Products"

				$rootScope.$emit('notifydialog', { text: 'Searching Products sheet...' });

				ProductsSheet = $scope.AgoraDataKendoSpreadsheet.sheetByName('Productos');
				if(!ProductsSheet) {
					
					$rootScope.$emit('closedialog');
					return Notifications.show({ errors: 'Load an Excel file with a "Products" sheet' });
				}	

				// Fields secuence validation

				$rootScope.$emit('notifydialog', { text: 'Validating sheet...' });

				RowCount = ProductsSheet._rows._count;
						
				var FieldsRow = ProductsSheet.range(
					'A1:' + Products.FootPrint.ForTree.MaxCellIndex + 1
				).values()[0];
				var FieldsFootPrint = FieldsRow.join('|');

				if(FieldsFootPrint == Products.FootPrint.FieldHash) {

					$rootScope.$emit('notifydialog', { text: 'Sheet valid, processsing...' });
					$timeout(updateSheet, 200);

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
			}

			//  Create parent, color, and size columns and update data from last saved

			function updateSheet() {

				$rootScope.$emit('notifydialog', { text: 'Creating parent color and size columns...' });

				ProductsSheet.insertColumn(Products.FootPrint.ForTree.InsertParentIndex);
				ProductsSheet.columnWidth(Products.FootPrint.ForTree.InsertParentIndex, 100);
				ProductsSheet.insertColumn(Products.FootPrint.ForTree.InsertColorSizeIndex);
				ProductsSheet.columnWidth(Products.FootPrint.ForTree.InsertColorSizeIndex, 170);
				ProductsSheet.insertColumn(Products.FootPrint.ForTree.InsertColorSizeIndex);
				ProductsSheet.columnWidth(Products.FootPrint.ForTree.InsertColorSizeIndex, 170);

				ProductsSheet.range(Products.FootPrint.ForTree.ParentCellIndex + 1).value('Parent');
				ProductsSheet.range(Products.FootPrint.ForTree.ColorCellIndex + 1).value('Color');
				ProductsSheet.range(Products.FootPrint.ForTree.SizeCellIndex + 1).value('Size');

				Products.FootPrint.NoEdit.split('')
				.forEach(function(ColumnIndex) {

					var Range = ColumnIndex + '2:' + ColumnIndex + RowCount;
					ProductsSheet.range(Range).enable(false)
				});

				$rootScope.$emit('notifydialog', { text: 'Updating last saved parent, color & size data...' });
				
				var I = 1; // ROW Index

				function updateParentColorSizeRow() {

					var RowIndex = I+1;
					var SKUCell = 		ProductsSheet.range(Products.FootPrint.ForTree.SKUCellAfterInsertIndex + RowIndex);
					var SKU = SKUCell.value();					
					var ParentCell = 	ProductsSheet.range(Products.FootPrint.ForTree.ParentCellIndex + RowIndex);
					var ColorCell = 	ProductsSheet.range(Products.FootPrint.ForTree.ColorCellIndex + RowIndex);
					var SizeCell = 		ProductsSheet.range(Products.FootPrint.ForTree.SizeCellIndex + RowIndex);

					$rootScope.$emit('notifydialog', { text: 'Updating ' + I + ' - ' + SKU  });

					if(jQuery.trim(SKU) != '') {
						
						SKU = jQuery.trim(SKU).split(',').join('.'); // Correct sku
						SKUCell.value(SKU);

						var SKUCode = SKU.split('.');
						var ParentSKUCode = SKUCode[0] + '.' + SKUCode[1] + '.' + SKUCode[2];
						ParentCell.value(ParentSku.Data[SKU] || ParentSKUCode); // Pude ser nuevo
						ColorCell.value(ColorSize.Data[SKU] && ColorSize.Data[SKU].color || '');
						SizeCell.value(ColorSize.Data[SKU] && ColorSize.Data[SKU].size || '');
					}

					I++;

					if(I<RowCount + 1) {

						if(CanProcess) {

							return $timeout(updateParentColorSizeRow, 0);

						} else {
		
							$rootScope.$emit(
								'notifydialog', 
								{ 
									text: 'Process cancelled. Please load file again',
									close: function() {

										ProductsSheet.range(
											'A1:' + Products.FootPrint.ForTree.SizeCellIndex + RowCount
										).clear();
										$rootScope.$emit('closedialog');
									}
								}
							);

							$timeout(function() {		

								ProductsSheet.range(
									'A1:' + Products.FootPrint.ForTree.SizeCellIndex + RowCount
								).clear();
								$rootScope.$emit('closedialog');

							}, 5000);
						}

					} else {
					
						$rootScope.$emit('notifydialog', { text: 'Data updated, creating variations...' });

						ProductsSheet.range(
							'A2:' + 
							Products.FootPrint.ForTree.SizeCellIndex + 
							RowCount
						).sort(Products.FootPrint.ForTree.InsertParentIndex);

						$timeout(function() {

							I = 1; // Reset ROW Index

							processVariationsRow();
						}, 200);
					}
				}

				updateParentColorSizeRow();

				// Sort and colorize variations

				var SKUParent = '';
				var AlternateProduct = true;

				function processVariationsRow() {

					var RowIndex = I+1;
					var SKUCell = ProductsSheet.range(Products.FootPrint.ForTree.SKUCellAfterInsertIndex + RowIndex);
					var ParentCell = ProductsSheet.range(Products.FootPrint.ForTree.ParentCellIndex + RowIndex);
					var SKU = SKUCell.value();
					var Parent = ParentCell.value();

					if(jQuery.trim(SKU) != '') {						

						if(Parent != SKUParent) { 

							SKUParent = Parent;
							AlternateProduct = !AlternateProduct;
						}
						
						var ProductColor = AlternateProduct ? '#efefef' : '#ffffff';
						ProductsSheet.range(
							'A' + (I+1) + ':' + Products.FootPrint.ForTree.SizeCellIndex + (I+1)
						).background(ProductColor);
						
						$rootScope.$emit('notifydialog', { text: 'Grouping ' + I + ' - ' + SKU + ' > ' + SKUParent });

					} else {
						
						ProductsSheet.range(
							'A' + (I+1) + ':' + Products.FootPrint.ForTree.SizeCellIndex + (I+1)
						).background('#cc0000');
						ProductsSheet.range(
							'A' + (I+1) + ':' + Products.FootPrint.ForTree.SizeCellIndex + (I+1)
						).color('#ffffff');

						$rootScope.$emit('notifydialog', { text: 'Product without SKU' });
					}

					I++;

					if(I<RowCount + 1) {

						if(CanProcess) {

							return $timeout(processVariationsRow, 0);

						} else {
		
							$rootScope.$emit(
								'notifydialog', 
								{ 
									text: 'Process cancelled. Please load file again',
									close: function() {

										ProductsSheet.range(
											'A1:' + Products.FootPrint.ForTree.SizeCellIndex + RowCount
										).clear();
										$rootScope.$emit('closedialog');
									}
								}
							);

							$timeout(function() {		

								ProductsSheet.range(
									'A1:' + Products.FootPrint.ForTree.SizeCellIndex + RowCount
								).clear();
								$rootScope.$emit('closedialog');

							}, 5000);
						}

					} else {
				
						$rootScope.$emit('notifydialog', { text: 'Data processed' });

						$timeout(function() {

							$rootScope.$emit('closedialog');
							$scope.allowProcessing = true;
						}, 200);
					}
				}
			}

			/* Load last excel saved */

			$scope.loadData = function() {				

				$rootScope.$broadcast('opendialog', {
					Title: 'Loading Excel data'
				});
			
				$scope.allowProcessing = false;

				$http.get('/wp-json/poeticsoft/woo-agora-excel-data-read')
				.then(function(Response) {

					var Code = Response.data.Status.Code;
					if(Code == 'OK'){ 

						if(Response.data.Data.length == 0) {

							$rootScope.$emit('notifydialog', { text: 'No data' });

							return $timeout(function() {

								$rootScope.$emit('closedialog');
								
							}, 200);
						}

						var ProductsSheetData = Response.data.Data;
						delete ProductsSheetData.activeCell;
						delete ProductsSheetData.selection;

						$scope.AgoraDataKendoSpreadsheet.fromJSON({
							sheets: [ProductsSheetData]
						});				
						
						ProductsSheet = $scope.AgoraDataKendoSpreadsheet.activeSheet();
						RowCount = ProductsSheet._rows._count;
			
						$scope.allowProcessing = true;

						$rootScope.$emit('notifydialog', { text: Response.data.Status.Message });

						$timeout(function() {

							$rootScope.$emit('closedialog');

							/* DEBUG 
							$scope.generateWebProducts();*/
							
						}, 200);

					} else {

						Notifications.show({ errors: Response.data.Status.Reason });
					}
				});
			}

			/* Save excel data */

			$scope.saveData = function() {				

				$rootScope.$broadcast('opendialog', {
					Title: 'Saving Excel data'
				});

				var Data = {
					ProductsSheetData: ProductsSheet.toJSON(),
					ColorSizeData: {},
					ParentSKUData: {}
				};
				
				$rootScope.$emit('notifydialog', { text: 'Extracting parent, color and size...' });

				Data.ProductsSheetData.rows.forEach(function(Row) {

					var Parent = Row.cells[Products.FootPrint.ForData.ParentIndex].value;
					var SKU = Row.cells[Products.FootPrint.ForData.SKUIndex].value;
					var Color = Row.cells[Products.FootPrint.ForData.ColorIndex].value;
					var Size = Row.cells[Products.FootPrint.ForData.SizeIndex].value;

					Data.ColorSizeData[SKU] = {
						Color: Color,
						Size: Size
					};

					Data.ParentSKUData[SKU] = Parent;
				});

				$http.post(
					'/wp-json/poeticsoft/woo-agora-excel-data-update',
					Data
				)
				.then(function(Response) {

					var Code = Response.data.Status.Code;
					if(Code == 'OK'){

						$rootScope.$emit('closedialog');
						Notifications.show(Response.data.Status.Message);
						$scope.allowProcessing = true;
						$scope.dataChanged = false;

					} else {

						Notifications.show({ errors: Response.data.Status.Reason });
					}
				});
			}

			// Generate excel to web products action

			$scope.generateWebProducts = function() {	
				
				$scope.allowProcessing = false;
				var RowsRange = ProductsSheet.range('A2:' + Products.FootPrint.ForTree.SizeCellIndex + RowCount);					
				ExcelToWeb.processExcelData(RowsRange)
				.finally(function() {				
				
					$scope.allowProcessing = true;
				}); 
			}

			/* Spreadsheet config */
		
			$scope.AgoraDataSpreadsheetConfig = {
				toolbar: {
					home: false,
					insert: false,
					data: false
				},
				change: function() {
					
					$scope.$apply(function() {
						
						$scope.dataChanged = true;
					});
				}
			};

			// Load Agora Excel data
			
			$scope.$on("kendoWidgetCreated", function(event, widget){
      
        if (widget === $scope.AgoraDataKendoSpreadsheet) { 
					
					$scope.loadData();
				}
			});
		}

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller,
			template: `<div class="poeticsoft-woo-agora-data">
				<div class="SpreadsheetTools">
					<input kendo-upload="AgoraKendoUpload"
						     name="file"
						     type="file"
						     k-options="AgoraKendoUploadConfig"
					/>
					<div class="Actions">
						<button class="k-button"
										ng-click="generateWebProducts()"
										ng-disabled="!allowProcessing">
							Apply
						</button>
						<button class="k-button"
										ng-click="loadData()"
										ng-disabled="!dataChanged">
							Revert
						</button>
						<button class="k-button"
										ng-click="saveData()"
										ng-disabled="!dataChanged">
							Save
						</button>
					</div>
				</div>
				<div class="SpreadsheetView">
					<div kendo-spreadsheet="AgoraDataKendoSpreadsheet"
							 k-options="AgoraDataSpreadsheetConfig">
					</div>
				</div>
			</div>`
		};
	});