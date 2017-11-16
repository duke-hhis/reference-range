var app = angular.module(
    'GrifolsApp',
    [
        'ngRoute',
        'ui.bootstrap'
    ]
);

app.config(function($routeProvider) {
    $routeProvider.when(
        '/',
        {
            templateUrl: 'ng-app/partials/plot.html',
            controller: 'MainController'
        }
    ).otherwise({ redirectTo: '/' });
});
