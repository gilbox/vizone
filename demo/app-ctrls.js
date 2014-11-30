var app = angular.module('app');

app.controller('MainCtrl', function MainCtrl($scope, $location, appStore, actionCreator) {
  $scope.store = appStore;
  console.log("scope.store-->: ", $scope.store);

  actionCreator.initFaces();

  $scope.clickPhoto = function(photo) {
    actionCreator.selectPhoto(photo);
  };

  $scope.pct = function() {
    return ~~(100*appStore.totalVoteCount / appStore.maxVotes) + '%';
  };

});

app.controller('HomeCtrl', function($scope, appStore, actionCreator) {

});

app.controller('TestCtrl', function($scope, appStore, actionCreator) {

});

app.controller('ResultsCtrl', function($scope, appStore, actionCreator) {

});