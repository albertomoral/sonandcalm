/* excel.js */

APP.directive(
		'poeticsoftWooAgoraExcel', 
	function() {

		function controller(
			$http,
			$rootScope,
			$scope,
			$timeout,
			$window,
			Notifications,
			Products,
			ColorSize,
			ExcelToWeb
		) {
			
			$scope.allowProcessing = false;

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
					
					$scope.AgoraKendoSpreadsheet
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

				ProductsSheet = $scope.AgoraKendoSpreadsheet.sheetByName('Productos');
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
					$timeout(processSheet, 200);

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

			function processSheet() {

				$rootScope.$emit('notifydialog', { text: 'Creating variations, color and sizes...' });

				ProductsSheet.range(
					'A2:' + 
					Products.FootPrint.ForTree.MaxCellIndex + 
					RowCount
				).sort(Products.FootPrint.ForTree.InsertParentIndex);

				ProductsSheet.insertColumn(Products.FootPrint.ForTree.InsertParentIndex);
				ProductsSheet.columnWidth(Products.FootPrint.ForTree.InsertParentIndex, 170);
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

				var SKUParentCode = '';
				var SKUParent = '';
				var I = 1;
				var AlternateProduct = true;

				function parseRow() {

					var ParentCell = ProductsSheet.range(Products.FootPrint.ForTree.ParentCellIndex + (I+1));
					var SKUCell = ProductsSheet.range(Products.FootPrint.ForTree.SKUCellAfterInsertIndex + (I+1));
					var SKU = SKUCell.value();

					if($.trim(SKU) != '') {

						SKU = SKU.split(',').join('.');
						SKUCell.value(SKU);

						var Code = SKU.split('.');
						var ParentCode = Code[0] + '.' + Code[1] + '.' + Code[2];

						if(ParentCode != SKUParentCode) { 

							SKUParent = SKU;
							SKUParentCode = ParentCode;
							AlternateProduct = !AlternateProduct;
						}

						ParentCell.value(SKUParent);
						var ProductColor = AlternateProduct ? '#efefef' : '#ffffff';
						ProductsSheet.range(
							'A' + (I+1) + ':' + Products.FootPrint.ForTree.SizeCellIndex + (I+1)
						).background(ProductColor);

						if(ColorSize.Data[SKU]) {
							
							ProductsSheet.range(
								Products.FootPrint.ForTree.ColorCellIndex + (I+1)
							).value(ColorSize.Data[SKU].color);
							ProductsSheet.range(
								Products.FootPrint.ForTree.SizeCellIndex + (I+1)
							).value(ColorSize.Data[SKU].size);
						}
						
						$rootScope.$emit('notifydialog', { text: I + ' - ' + SKU + ' > ' + SKUParent });

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

							return $timeout(parseRow, 0);

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

						
						$rootScope.$emit('notifydialog', { text: 'Saving data...' });

						$http.post(
							'/wp-json/poeticsoft/woo-agora-excel-data-update',
							ProductsSheet.toJSON()
						)
						.then(function(Response) {
		
							var Code = Response.data.Status.Code;
							if(Code == 'OK'){

								$rootScope.$emit('closedialog');
								Notifications.show(Response.data.Status.Message);
								$scope.allowProcessing = true;

							} else {
		
								Notifications.show({ errors: Response.data.Status.Reason });
							}
						});
					}
				}

				parseRow();
			}
		
			$scope.AgoraSpreadsheetConfig = {
				toolbar: {
					home: false,
					insert: false,
					data: false
				}
			};

			// Generate excel to web products action

			$scope.generateWebProducts = function() {	
				
				$scope.allowProcessing = false;
				var RowsRange = ProductsSheet.range('A2:' + Products.FootPrint.ForTree.SizeCellIndex + RowCount);					
				ExcelToWeb.process(RowsRange)
				.finally(function() {				
				
					$scope.allowProcessing = true;
				}); 
			}

			// Load Agora Excel data
			
			$scope.$on("kendoWidgetCreated", function(event, widget){
      
        if (widget === $scope.AgoraKendoSpreadsheet) {

					$http.get('/wp-json/poeticsoft/woo-agora-excel-data-read')
					.then(function(Response) {

						var Code = Response.data.Status.Code;
						if(Code == 'OK'){ 

							var ProductsSheetData = Response.data.Data;
							delete ProductsSheetData.activeCell;
							delete ProductsSheetData.selection;

							$scope.AgoraKendoSpreadsheet.fromJSON({
								sheets: [ProductsSheetData]
							});				
							
							ProductsSheet = $scope.AgoraKendoSpreadsheet.activeSheet();
							RowCount = ProductsSheet._rows._count;
				
							$scope.allowProcessing = true;

							/* DEBUG */

							$timeout($scope.generateWebProducts, 10);

						} else {

							return Notifications.show({ errors: Response.data.Status.Reason });
						}
					});
				}
			});
		}

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller,
			template: `<div class="poeticsoft-woo-agora-excel">
				<div class="SpreadsheetTools">
					<input kendo-upload="AgoraKendoUpload"
						     name="file"
						     type="file"
						     k-options="AgoraKendoUploadConfig"
					/>
					<div class="Actions">
						<button class="Generate k-button"
										ng-click="generateWebProducts()"
										ng-disabled="!allowProcessing">
							Generate web products
						</button>
					</div>
				</div>
				<div class="SpreadsheetView">
					<div kendo-spreadsheet="AgoraKendoSpreadsheet"
							 k-options="AgoraSpreadsheetConfig">
					</div>
				</div>
			</div>`
		};
	});