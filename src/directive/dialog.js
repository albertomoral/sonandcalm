
  APP.directive(
    'poeticsoftUtilsDialog', 
  function() {

    function controller($scope, $rootScope, DataSource) {

			$scope.KendoDialogOptions = {
				title: 'Dialog',
				width: '450',
				actions: [
					{ 
						text: 'Stop', 
						primary: true,
						action: DataSource.stopProcess
					}
				],
				modal: true,
				visible: false
			};	
			
			$rootScope.$on('opendialog', function($event, Data) {

				$scope.KendoDialog.title(Data.Title);
				$scope.KendoDialog.open();
			});

			$rootScope.$on('contentdialog', function($event, Data) {

				$scope.KendoDialog.content(Data.Text);
			});
    }

    return {
      restrict: 'E',
      replace: true,
      scope: true,
      controller: controller,
			template: `<div 
				kendo-dialog="KendoDialog" 
				k-options="KendoDialogOptions">
		 		<p>DIALOG<p>
 			</div>`
    };
  });