$(document).ready(function() {

	function getgraphdata() {
          var formData = new FormData(document.getElementById('filterForm'));
          $.ajax({
		 url: '/graph',
		 data: formData,
		 cache: false,
		 dataType: "json",
		 contentType: false,
		 processData: false,
		 type: 'POST',
		 success: function(data){
			console.log(data);
			graphhighcharts1(data);
			graphhighcharts2(data);
		 }
	  });
	}

	document.getElementById('desc').value = "salaire";
	document.getElementById('date1').value = "2011-01-01";
	document.getElementById('date2').value = "2011-12-31";
	getgraphdata();


$(function () {

    // Register a parser for the American date format used by Google
    Highcharts.Data.prototype.dateFormats['m/d/Y'] = {
        regex: '^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{2})$',
        parser: function (match) {
            return Date.UTC(+('20' + match[3]), match[1] - 1, +match[2]);
        }
    };

    // Get the CSV and create the chart
    $.getJSON('http://www.highcharts.com/samples/data/jsonp.php?filename=analytics.csv&callback=?', function (csv) {
        $('#graph_salaire').highcharts({

            data: {
                csv: csv
            },

            title: {
                text: 'Daily visits at www.highcharts.com'
            },

            subtitle: {
                text: 'Source: Google Analytics'
            },

            xAxis: {
                type: 'datetime',
                tickInterval: 7 * 24 * 3600 * 1000, // one week
                tickWidth: 0,
                gridLineWidth: 1,
                labels: {
                    align: 'left',
                    x: 3,
                    y: -3
                }
            },

            yAxis: [{ // left y axis
                title: {
                    text: null
                },
                labels: {
                    align: 'left',
                    x: 3,
                    y: 16,
                    formatter: function() {
                        return Highcharts.numberFormat(this.value, 0);
                    }
                },
                showFirstLabel: false
            }, { // right y axis
                linkedTo: 0,
                gridLineWidth: 0,
                opposite: true,
                title: {
                    text: null
                },
                labels: {
                    align: 'right',
                    x: -3,
                    y: 16,
                    formatter: function() {
                        return Highcharts.numberFormat(this.value, 0);
                    }
                },
                showFirstLabel: false
            }],

            legend: {
                align: 'left',
                verticalAlign: 'top',
                y: 20,
                floating: true,
                borderWidth: 0
            },

            tooltip: {
                shared: true,
                crosshairs: true
            },

            plotOptions: {
                series: {
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: function() {
                                hs.htmlExpand(null, {
                                    pageOrigin: {
                                        x: this.pageX,
                                        y: this.pageY
                                    },
                                    headingText: this.series.name,
                                    maincontentText: Highcharts.dateFormat('%A, %b %e, %Y', this.x) +':<br/> '+
                                        this.y +' visits',
                                    width: 200
                                });
                            }
                        }
                    },
                    marker: {
                        lineWidth: 1
                    }
                }
            },

            series: [{
                name: 'All visits',
                lineWidth: 4,
                marker: {
                    radius: 4
                }
            }, {
                name: 'New visitors'
            }]
        });
    });

});


function graphhighcharts1(data)
{
 console.log(data);

$(function () {
        $('#graph_salaire1').highcharts({
            chart: {
                type: 'line'
            },
            title: {
                text: 'Monthly Average Salary'
            },
            subtitle: {
                text: 'Source: my bank'
            },
            xAxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },
            yAxis: {
                title: {
                    text: 'Salary (€)'
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: false
                }
            },
            series: [{
                name: 'Tokyo',
                data: data
            }, {
                name: 'London',
                data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
            }]
        });
    });

}

function graphhighcharts2(data)
{
 console.log(data);

$(function () {
        $('#graph_salaire2').highcharts({
            chart: {
                type: 'line'
            },
            title: {
                text: 'Monthly Salary',
                x: -20 //center
            },
            subtitle: {
                text: 'Monthly Salary evolution',
                x: -20
            },
            xAxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },
            yAxis: {
                title: {
                    text: 'Salary (€)'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                valueSuffix: '€'
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 0
            },
            series: [{
                name: 'current',
                data: data
            }]
        });
    });
    
}

}); /* End DOM ready */
