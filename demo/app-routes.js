var app = angular.module('app');

// think of $routeProvider as part of the view
app.config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'home.html',
      controller: 'HomeCtrl'
    })
    .when('/test', {
      templateUrl: 'test.html',
      controller: 'TestCtrl'
    })
    .when('/results', {
      templateUrl: 'results.html',
      controller: 'ResultsCtrl'
    });

  $locationProvider.html5Mode(true);
});

// think of $location as part of the view
app.run(function ($location, $rootScope, routeStore) {
  $rootScope.$on('route:new', function (event, route) {
    $location.url(route);
  });
});