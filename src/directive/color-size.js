/* excel.js */

APP.directive(
		'poeticsoftWooAgoraColorSize', 
	function() {

		function controller(
			$http,
			$rootScope,
			$scope,
			$timeout,
			Notifications,
			ColorSize
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

			function sheetLoaded() {
				
				CanProcess = true;

				$rootScope.$broadcast('opendialog', {
					Title: 'Color & Sizes process',
					cancel: function() {

						CanProcess = false;
						return false;
					}
				});

				// There is a sheet "ColorSize"

				$rootScope.$emit('notifydialog', { text: 'Searching Color  sheet...' });

				var ColorSizeSheet = $scope.AgoraKendoSpreadsheet.sheetByName('ColorSize');
				if(!ColorSizeSheet) {
					
					$rootScope.$emit('closedialog');
					return Notifications.show({ errors: 'Load an Excel file with a "Products" sheet' });
				}	

				// Extract data

				$rootScope.$emit('notifydialog', { text: 'Extracting data...' });

				$timeout(function() {				

					ColorSize.Data = {};

					var Rows = ColorSizeSheet.toJSON().rows;
					Rows.shift(); // Extract field names

					Rows.forEach(function(Row) {

						if(
							Row.cells.length == 3 && 
							$.trim(Row.cells[2].value) != ''
						){

							ColorSize.Data[Row.cells[2].value] = {
								color: Row.cells[0].value,
								size: Row.cells[1].value 
							}
						}
					});

					$rootScope.$emit('notifydialog', { text: 'Data Ready' });

					$timeout(function() {

						$scope.allowProcessing = true;
						$rootScope.$emit('closedialog');

					}, 200);

				}, 200);
			}
		
			$scope.AgoraSpreadsheetConfig = {
				toolbar: {
					home: false,
					insert: false,
					data: false
				}
			};

			// Generate excel to web products action

			$scope.saveData = function() {	
				
				$scope.allowProcessing = false;

				$rootScope.$broadcast('opendialog', {
					Title: 'Saving Color & Sizes data...'
				});

				$http.post(
          '/wp-json/poeticsoft/woo-products-color-size-update',
          ColorSize.Data
        )
        .then(function(Response) {

          var Code = Response.data.Status.Code;
          if(Code == 'OK'){ 

						$rootScope.$emit('notifydialog', { text: Response.data.Status.Message });
          } else {

						$rootScope.$emit('notifydialog', { text: 'Error: ' + Response.data.Status.Reason }); 
					}       

					$timeout(function() {

						$rootScope.$emit('closedialog');
						$scope.allowProcessing = true;
					});
        });				
			}
		}

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller,
			template: `<div class="poeticsoft-woo-agora-color-size">
				<div class="SpreadsheetTools">
					<input kendo-upload="AgoraKendoUpload"
						     name="file"
						     type="file"
						     k-options="AgoraKendoUploadConfig"
					/>
					<div class="Actions">
						<button class="Generate k-button"
										ng-click="saveData()"
										ng-disabled="!allowProcessing">
							Save Data
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