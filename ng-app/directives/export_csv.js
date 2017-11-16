app.directive('exportCsv', function() {
    return {
        controller: 'ExportController',
        restrict: 'E',
        replace: true,
        templateUrl: 'ng-app/directives/export_csv.html'
    };
});