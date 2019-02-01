
	APP.directive(
		'poeticsoftUtilsExcel', 
	function() {

		function controller(
			$scope,
			$window,
			Errors,
			ExcelToWeb
		) {

			// Loading Excel file

			$scope.AgoraLoadConfig = {
				multiple: false,
				async: {
					saveUrl: '/product-images/upload.php',
					autoUpload: false
				},
				validation: {
					allowedExtensions: ['.xlsx'],
				},
				select: function(e) {
					
					$scope.AgoraKendoSpreadsheet.fromFile(e.files[0].rawFile);
					$scope.$apply(function() {

						$scope.allowProcessing = true;
					});
				}
			}        
		
			$scope.AgoraSpreadsheetConfig = {
				toolbar: {
					home: false,
					insert: false,
					data: false
				}
			};

			// Generate excel to web products action
			
			$scope.allowProcessing = true;

			$scope.generateWebProducts = function() {	
				
				var ProductsSheet = $scope.AgoraKendoSpreadsheet.sheetByName('Productos');

				if(!ProductsSheet) {

					return Errors.showErrors({ errors: 'Load an Excel file with a "Products" sheet' });
				}

				var Rows = ProductsSheet.toJSON().rows;
				
				$scope.allowProcessing = false;
				
				ExcelToWeb.mergeProducts(Rows)
				.finally(function() {
				
						$scope.allowProcessing = true;
				});
			}

			/* Resize */

			function resize() {                

				$scope.AgoraKendoSpreadsheet.resize();
			}

			angular.element($window).on('resize', resize);

			$scope.$on("kendoWidgetCreated", function(event, widget){
			
				if (widget === $scope.AgoraKendoSpreadsheet) {
					
					setTimeout(resize, 0);
				}
			});
		}

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller,
			template: `<div class="poeticsoft-utils-excel">
				<div class="SpreadsheetTools">
					<input kendo-upload="AgoraKendoUpload"
						     name="file"
						     type="file"
						     k-options="AgoraLoadConfig"
					/>
					<div class="Actions">
						<button class="Generate k-button"
										data-ng-click="generateWebProducts()"
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