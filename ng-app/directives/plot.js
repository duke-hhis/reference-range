app.directive('plot', [function () {
    function linkFunc(scope, element, attrs) {
        scope.$watch('plotData', function (plots) {
            Plotly.newPlot(
                element[0],
                plots,
                {
                    width: 990,
                    height: 430,
                    margin: {
                        t: 48,
                        l: 32,
                        b: 96,
                        r: 0,
                        pad: 0
                    },
                    boxmode: 'group',
                    title: scope.title
                }
            );
        });
    }

    return {
        scope: {
            plotData: '=',
            title: '='
        },
        link: linkFunc
    };
}]);