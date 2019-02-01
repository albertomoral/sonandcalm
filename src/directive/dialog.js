
  APP.directive(
    'poeticsoftUtilsDialog', 
  function() {

    function controller($scope, $rootScope, $timeout, ExcelToWeb) {

			var Buttons = {
				Pause: null,
				Continue: null,
				Cancel: null
			};

			$scope.KendoDialogOptions = {
				title: 'Dialog',
				width: '450',
				closable: false,
				/*
				actions: [
					{ 
						text: 'Pause',
						action: function() {

							ExcelToWeb.pauseProcess();
							Buttons.Continue.removeAttr('disabled');
							Buttons.Pause.attr('disabled', 'disabled');
							return false;
						}
					},
					{ 
						text: 'Continue',
						action: function() {
							
							ExcelToWeb.continueProcess();
							Buttons.Pause.removeAttr('disabled');
							Buttons.Continue.attr('disabled', 'disabled');
							return false;
						}
					},
					{ 
						text: 'Cancel',
						action: function() {
							
							ExcelToWeb.cancelProcess();
							return false;
						}
					}
				],
				*/
				modal: true,
				visible: false,
				open: function(E) {

					var $Buttons = E.sender.element.parent('.k-dialog').find('.k-button-group button');

					Buttons.Pause = $Buttons.eq(0);
					Buttons.Continue = $Buttons.eq(1);
					Buttons.Cancel = $Buttons.eq(2);

					Buttons.Continue.attr('disabled', 'disabled');
				}
			};	
			
			$rootScope.$on('opendialog', function($event, Data) {

				$scope.KendoDialog.title(Data.Title);
				$scope.KendoDialog.open();
			});

			$rootScope.$on('notifydialog', function($event, Text) {	

				$scope.KendoDialog.content(Text);
			});	
			
			$rootScope.$on('closedialog', function($event, Data) {

				$scope.KendoDialog.close();
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
 			</div>`
    };
  });