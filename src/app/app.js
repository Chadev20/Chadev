angular.module("app",
[
    'ngRoute',
    'app.controller',
    'app.db'
])
.config(function($routeProvider)
{       
    $routeProvider
    .when("/",
    {
        templateUrl : "components/login/login.html"
    }) 
});

