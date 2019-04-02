/* dialog.js */

APP.directive(
    'poeticsoftWooAgoraDialog', 
  function() {

    function controller(
			$scope, 
			$rootScope, 
			$document
		) {

			var Buttons = {
				Pause: null,
				Continue: null,
				Cancel: null
			};

			var cancelAction = function() { console.log('No cancel function'); }
			function cancel() { return cancelAction(); }

			$scope.KendoDialogOptions = {
				title: 'Dialog',
				width: '450',
				closable: false,
				actions: [
					{ 
						text: 'Cancel',
						action: cancel
					}
				],
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

				var $ButtonGroup = jQuery($document).find('.k-window.k-dialog .k-dialog-buttongroup');

				if(Data.cancel) {

					$ButtonGroup.addClass('CanCancel');
					cancelAction = Data.cancel;

				} else {

					$ButtonGroup.removeClass('CanCancel');
				}

				$scope.KendoDialog.title(Data.Title);
				$scope.KendoDialog.open();
			});

			$rootScope.$on('notifydialog', function($event, Data) {	

				$scope.KendoDialog.content(Data.text || '...');				

				if(Data.close) {
					
					var $ButtonGroup = jQuery($document).find('.k-window.k-dialog .k-dialog-buttongroup');

					$ButtonGroup.addClass('CanCancel');
					cancelAction = Data.close;
				}
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