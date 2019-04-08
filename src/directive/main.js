/* main.js */

APP.directive(
  'poeticsoftWooAgoraMain', 
function() {

	function controller(
		$rootScope,
		$timeout,
		$window
	) {

		var $$Window = jQuery($window);

		function resize() {

			jQuery('.poeticsoft-woo-agora')
			.css({
				height: $$Window.height() - 32
			}); 
		}

		angular.element($window).on('resize', resize);
		resize();		

		$timeout(function() {

			/* Load process */
						
			$rootScope.$broadcast('opendialog', {
				Title: 'Loading data...'
			});
		});

		$rootScope.$on('loader_products_excel_ready', function() {

			$rootScope.$broadcast('closedialog');
		});
	}

	return {
		restrict: 'E',
		replace: true,
		scope: true,
		controller: controller,
		template: `<div class="poeticsoft-woo-agora">
			<div kendo-tab-strip>
				<ul>
					<li class="k-state-active">Web</li>
					<li>Agora</li>
				</ul>
				<div class="Web">
					<div kendo-tab-strip>
						<ul>
							<li>Products</li>
							<li>Categories</li>
							<li class="k-state-active">Images</li>
						</ul>
						<poeticsoft-woo-agora-products></poeticsoft-woo-agora-products>                        
						<poeticsoft-woo-agora-categories></poeticsoft-woo-agora-categories>
						<poeticsoft-woo-agora-images></poeticsoft-woo-agora-images>
					</div>
				</div> 
				<div class="Agora"> 
					<div kendo-tab-strip>
						<ul>
							<!-- li>Color Size</li -->
							<li>Products</li>
							<li class="k-state-active">Stock</li>
						</ul>                                     
						<!-- poeticsoft-woo-agora-color-size></poeticsoft-woo-agora-color-size --> 
						<poeticsoft-woo-agora-data></poeticsoft-woo-agora-data>                      
						<poeticsoft-woo-agora-stock></poeticsoft-woo-agora-stock> 
					</div>
				</div>
			</div>
			<poeticsoft-woo-agora-dialog></poeticsoft-woo-agora-dialog>
		</div>`
	};
});