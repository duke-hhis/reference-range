app.controller(
    'MainController', [
        '$scope',
        function ($scope) {
            $scope.csv_data = [];  // all the data
            $scope.filtered_data = [];  // data filtered by chosen parameter
            $scope.displayed_data = [];  // used for pagination
            $scope.patients = null;
            $scope.race_groups = null;
            $scope.sex_groups = null;
            $scope.age_groups = null;
            $scope.panels = null;
            $scope.params = null;

            // plot options
            $scope.compare_by = 'none';
            $scope.group_by_age = false;
            $scope.group_by_race = false;
            $scope.group_by_sex = false;
            $scope.selected_param = null;
            $scope.selected_panel = null;
            $scope.panel_parameters = {};  // holds cell subsets for each panel
            $scope.parameter_uri_map = {};  // to find the param URI for selected param
            $scope.param_unit = null;  // for display only

            // pagination stuff for data table
            $scope.current_page = 1;
            $scope.items_per_page = 5;

            function set_totals () {
                $scope.total_items = $scope.csv_data.length;
                $scope.displayed_items = $scope.filtered_data.length;
                $scope.current_page = 1;
                setPage();
            }

            $scope.$watch('filtered_data', function () {
                set_totals();
            });

            $scope.$watch('selected_panel', function () {
                if ($scope.selected_panel === 'Cytokines') {
                    $scope.param_unit = 'pg/ml';
                } else {
                    $scope.param_unit = 'Rel Freq';
                }
            });

            $scope.$watch('selected_param', function () {
                $scope.param_has_uri = $scope.selected_param in $scope.parameter_uri_map;
            });

            function filter_data () {
                var tmp_filtered_data = [];

                if ($scope.selected_param === null) {
                    return;
                }

                $scope.csv_data.forEach(function (d) {
                    if (d['Population name'] === $scope.selected_param && d['Panel'] === $scope.selected_panel) {
                        tmp_filtered_data.push(d);
                    }
                });

                $scope.filtered_data = tmp_filtered_data;
            }

            // gather user input to generate plot
            $scope.apply_plot_options = function () {
                // filter data
                filter_data();

                // break up traces by 'compare_by' option
                // this is a radio input so only one category to compare by
                var traces = {};
                var compare_by_list = null;
                var compare_by_col = null;

                switch ($scope.compare_by) {
                    case 'age':
                        compare_by_list = $scope.age_groups;
                        compare_by_col = 'AGEGR1C';
                        break;
                    case 'race':
                        compare_by_list = $scope.race_groups;
                        compare_by_col = 'RACEGRP';
                        break;
                    case 'sex':
                        compare_by_list = $scope.sex_groups;
                        compare_by_col = 'SEXC';
                        break;
                }

                if (compare_by_list === null) {
                    traces['all'] = {
                        x: [],
                        y: [],
                        name: 'all',
                        type: 'box',
                        boxpoints: 'all',
                        pointpos: 0
                    };
                } else {
                    compare_by_list.forEach(function (o) {
                        traces[o] = {
                            x: [],
                            y: [],
                            name: o,
                            type: 'box',
                            boxpoints: 'all',
                            pointpos: 0,
                            opacity: 1.0,
                            marker: {
                                opacity: 1.0
                            }
                        };
                    });
                }

                // Now we have all our traces, next we will iterate through
                // the filtered data and populate the traces.
                // The group by options dictate the x values,
                // the y array contains the values
                var x_string;
                var x_list;
                var trace;
                $scope.filtered_data.forEach(function (d) {
                    x_list = [];
                    if ($scope.group_by_age) {
                        x_list.push(d['AGEGR1C'])
                    }
                    if ($scope.group_by_race) {
                        x_list.push(d['RACEGRP'])
                    }
                    if ($scope.group_by_sex) {
                        x_list.push(d['SEXC'])
                    }

                    if (x_list.length === 0) {
                        x_string = 'All';
                    } else {
                        x_string = x_list.join(' - ');
                    }

                    if (compare_by_col === null) {
                        trace = traces['all'];
                    } else {
                        trace = traces[d[compare_by_col]];
                    }
                    trace.x.push(x_string);
                    trace.y.push(d['Value']);
                });

                $scope.sample_plots = Object.values(traces);
                $scope.plot_title = $scope.selected_param;
            };

            $scope.$watch("current_page", function() {
                setPage();
            });

            function setPage() {
                $scope.displayed_data = $scope.filtered_data.slice(
                    ($scope.current_page - 1) * $scope.items_per_page,
                    ($scope.current_page - 1) * $scope.items_per_page + $scope.items_per_page
                );
            }

            // parse CSV file
            Papa.parse("data/grifols_data_final.csv", {
                header: true,
                download: true,
                complete: function (results) {
                    $scope.csv_data = [];

                    $scope.patients = [];
                    $scope.age_groups = [];
                    $scope.race_groups = [];
                    $scope.sex_groups = [];
                    $scope.panels = [];
                    $scope.rf_params = [];
                    $scope.abc_params = [];
                    $scope.med_params = [];
                    
                    results.data.forEach(function (obj) {
                        if ($scope.patients.indexOf(obj['Subject ID']) === -1) {
                            $scope.patients.push(
                                obj['Subject ID']
                            );
                        }
                        if ($scope.age_groups.indexOf(obj['AGEGR1C']) === -1) {
                            $scope.age_groups.push(
                                obj['AGEGR1C']
                            );
                        }
                        if ($scope.race_groups.indexOf(obj['RACEGRP']) === -1) {
                            $scope.race_groups.push(
                                obj['RACEGRP']
                            );
                        }
                        if ($scope.sex_groups.indexOf(obj['SEXC']) === -1) {
                            $scope.sex_groups.push(
                                obj['SEXC']
                            );
                        }
                        if (!(obj['Panel'] in $scope.panel_parameters)) {
                            $scope.panel_parameters[obj['Panel']] = [];
                        }

                        if (obj['Unit'] === '%') {
                            if ($scope.panel_parameters[obj['Panel']].indexOf(obj['Population name']) === -1)  {
                                $scope.panel_parameters[obj['Panel']].push(obj['Population name']);
                            }

                            // add URI map for parameter if we haven't already seen it
                            if (!(obj['Population name'] in $scope.parameter_uri_map) && obj['URI'] !== '') {
                                $scope.parameter_uri_map[obj['Population name']] = obj['URI'];
                            }

                            $scope.csv_data.push(obj);
                        }

                    });
                    set_totals();
                    $scope.$apply();
                }
            });
        }
    ]
);


app.controller(
    'ExportController',
    [
        '$scope', '$window',
        function ($scope, $window) {
            $scope.create_export = function () {
                // use angular.toJson, removes ng internal props like $$hashkey
                var exported_csv = Papa.unparse(
                    {
                        fields: [
                            "SUBJECT ID",
                            "AGEGR1C",
                            "RACEGRP",
                            "SEXC",
                            "PANEL",
                            "CELL SUBSET",
                            "VALUE",
                            "URI"
                        ],
                        data: angular.toJson($scope.filtered_data)
                    }
                );
                $window.location.assign("data:text/csv;charset=utf-8," + encodeURIComponent(exported_csv));
            };
        }
    ]
);