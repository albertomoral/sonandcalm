
  APP.directive(
    'poeticsoftUtilsImages', 
  function() {

    function controller(
      $http,
      $scope, 
      Notifications, 
      Products,
      Images, 
      $window
    ) {

      /* UPLOAD */
      
      $scope.imageUploadConfig = {
        async: {
          saveUrl: '/wp-json/poeticsoft/woo-images-upload',
          autoUpload: true
        },
        success: function(result) {

          if(result.response.Status.Code == 'KO') {

            return Notifications.show({ errors: result.response.Status.Reason });
          }

          $scope.imageGridConfig.dataSource.read();
        },
        validation: {
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.tif', '.tiff'],          
          maxFileSize: 1
        },
        dropZone: '.Images .Upload'
      }

      $scope.clearUploadList = function() { 

        $scope.ImageKendoUpload.clearAllFiles();
      }

      /* LIST */

      $scope.haveProduct = function(SKU) {

        return Products.DS.get(SKU) ? 'k-icon k-i-check-circle' : 'k-icon k-i-close-circle';
      }

      $scope.imageGridConfig = {
        dataSource: Images.DS,
        height: '100%',
        editable: 'inline',
        sortable: true,
        columns: [
          { 
            field: 'image', 
            title: '&nbsp;',
            template: '<img src="https://sonandcalm.kaldeera.com/wp-content/product-images/thumb/#: name #" ' +
                           'style="display: block; width:100%;"/>',           
            width: '100px'
          },
          { 
            field: 'name', 
            title: 'File name'
          },
          { 
            field: 'date',
            title: 'Date',
            format: '{0:M/d/yyyy h:mm tt}',
            width: '150px'
          },
          { 
            field: 'sku',
            title: 'Product',
            template: '<div class="{{ haveProduct(dataItem.sku) }}"></div>',
            width: '65px',
            attributes: {
              class: 'Product'
            }
          }/*,
          { 
            field: 'size',
            title: 'Size',
            width: '100px',
            attributes: {
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
          */
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
      
        if (widget === $scope.ImageKendoUpload) {

          $http.get(
            '/wp-json/poeticsoft/get-max-upload-size'
          )
          .then(function(Response) {
    
            var Code = Response.data.Status.Code;
            if(Code == 'OK'){            
    
              $scope.ImageKendoUpload.options.validation.maxFileSize = Response.data.Data.MaxSize;
    
            } else {
    
              Notifications.show({ errors: Response.data.Status.Reason });
            }
          });
        }
      });
    }

    return {
      restrict: 'E',
      replace: true,
      scope: true,
      controller: controller,
      template: `<div class="poeticsoft-utils-images">
        <div class="Images">
          <div class="Upload">
            <div class="UploadImageTools">           
              <input type="button" 
                value="Clear" 
                class="k-button" 
                ng-click="clearUploadList()"  
              />
            </div>
            <input kendo-upload="ImageKendoUpload"
              name="image"
              type="file"
              k-options="imageUploadConfig"
            />
          </div>
          <div class="List">
            <div kendo-grid="ImageKendoGrid"
              k-options="imageGridConfig">
            </div>
          </div>
        </div>
      </div>`
    };
  });