
  APP.directive(
    'poeticsoftUtilsImages', 
  function() {

    function controller($scope, Errors, Images, $window) {

      $scope.imageGridConfig = {
        dataSource: Images.DS,
        height: '100%',
        editable: 'inline',
        sortable: true,
        autoBind: false,
        columns: [
          { 
            field: 'image', 
            title: '&nbsp;',
            template: '<img src="/product-images/thumb/#: name #" style="width:100%;"/>',           
            width: '200px'
          },
          { 
            field: 'name', 
            title: 'File name',
            attributes: {
              style:'vertical-align: top;'
            } 
          },
          { 
            field: 'size',
            title: 'Size',
            width: '100px',
            attributes: {
              style:'text-align:right; vertical-align: top;'
            } 
          },
          { 
            field: 'date',
            title: 'Date',
            format: '{0:M/d/yyyy h:mm tt}',
            width: '180px', 
            attributes:{
              style:'text-align:right; vertical-align: top;'
            } 
          },        
          { 
            command: ['destroy'], 
            title: '&nbsp;', 
            width: '100px',
            attributes: {
              style:'vertical-align: top;'
            }        
          }
        ],
        toolbar: [
          { 
            name: 'refresh', 
            template: '<button data-ng-click=\'refresh()\' class=\'k-button\'>Refresh</button>' 
          }
        ]
      }

      $scope.refresh = function() {

        Images.DS.read();
      }       

      function resize() {        

        $scope.ImageKendoGrid.resize();
      }

      angular.element($window).on('resize', resize);

      $scope.$on("kendoWidgetCreated", function(event, widget){
      
        if (widget === $scope.ImageKendoGrid) {
          
          resize();
        }
      });
    }

    return {
      restrict: 'E',
      replace: true,
      scope: true,
      controller: controller,
      template: `<div class="poeticsoft-utils-images">
        <div kendo-grid="ImageKendoGrid"
          k-options="imageGridConfig">
        </div>
      </div>`
    };
  });