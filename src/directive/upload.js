
  APP.directive(
    'poeticsoftUtilsUploadImages', 
  function() {

    function controller($scope) {

      $scope.imageUploadConfig = {
        async: {
          saveUrl: '/product-images/upload.php',
          autoUpload: false
        },
        success: function(result) {

          if(result.response.Status.Code == 'KO') {

            showErrors({ errors: result.response.Status.Reason });
          }
        },
        validation: {
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
        }
      }

      $scope.clearUploadList = function() {

        $scope.ImageKendoUpload.clearAllFiles();
      }
    }

    return {
      restrict: 'E',
      replace: true,
      scope: true,
      controller: controller,
      template: `<div class="poeticsoft-utils-upload-images">
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
      </div>`
    };
  });