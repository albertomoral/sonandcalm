/* main.js */

APP.directive(
  'poeticsoftWooAgoraMain', 
function() {

	function controller(
		$window
	) {

		var $$Window = jQuery($window);

		function resize() {

			jQuery('.poeticsoft-main')
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
		template: `<div class="poeticsoft-woo-agora">
			<div kendo-tab-strip>
				<ul>
					<li>Color Size</li>
					<li class="k-state-active">Agora</li>
					<li>Web</li>
				</ul>                      
				<poeticsoft-woo-agora-color-size></poeticsoft-woo-agora-color-size>                 
				<poeticsoft-woo-agora-excel></poeticsoft-woo-agora-excel> 
				<div class="Web">
					<div kendo-tab-strip>
						<ul>
							<li class="k-state-active">Products</li>
							<li>Categories</li>
							<li>Images</li>
						</ul>
						<poeticsoft-woo-agora-products></poeticsoft-woo-agora-products>                        
						<poeticsoft-woo-agora-categories></poeticsoft-woo-agora-categories>
						<poeticsoft-woo-agora-images></poeticsoft-woo-agora-images>
					</div>
				</div>
			</div>
			<poeticsoft-woo-agora-dialog></poeticsoft-woo-agora-dialog>
		</div>`
	};
});