
APP.factory('Errors', function ($q, $timeout) {

    var Self = {};    

    Self.showErrors = function(Error) {

        jQuery('.poeticsoft-utils .Status')
        .addClass('Error')
        .html(Error.errors);;
    }

    return Self;
});
        