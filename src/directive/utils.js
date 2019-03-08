
APP.directive(
  'poeticsoftUtils', 
function() {

	function controller($scope, $window) {

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
							<li class="k-state-active">Agora</li>
							<li>Web</li>
					</ul>                   
					<poeticsoft-utils-excel></poeticsoft-utils-excel> 
					<div class="Web">
						<div kendo-tab-strip>
							<ul>
								<li class="k-state-active">Products</li>
								<li>Categories</li>
								<li>Images</li>
							</ul>
							<poeticsoft-utils-products></poeticsoft-utils-products>                        
							<poeticsoft-utils-categories></poeticsoft-utils-categories>
							<poeticsoft-utils-images></poeticsoft-utils-images>
						</div>
					</div>
			</div>
			<poeticsoft-utils-dialog></poeticsoft-utils-dialog>
			<div class="Notifications"></div>
		</div>`
	};
});