
APP.directive(
  'poeticsoftUtils', 
function() {

	function controller($scope, $window, Errors) {

		var $$Window = jQuery($window);

		function resize() {

				jQuery('.poeticsoft-utils')
				.css({
						height: $$Window.height() - 32
				}); 
		}

		angular.element($window).on('resize', resize);
		resize();
	}

	return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller,
			template: `<div class="poeticsoft-utils">
					<div kendo-tab-strip>
							<ul>
									<li class="k-state-active">Web Products</li>
									<li>Agora Excel</li>
									<li>Images</li>
									<li>Upload images</li>
							</ul>                    
							<poeticsoft-utils-products></poeticsoft-utils-products>   
							<poeticsoft-utils-excel></poeticsoft-utils-excel>    
							<poeticsoft-utils-images></poeticsoft-utils-images>
							<poeticsoft-utils-upload-images></poeticsoft-utils-upload-images>
					</div>
					<poeticsoft-utils-dialog></poeticsoft-utils-dialog>
					<div class="Status"></div>
			</div>`
	};
});