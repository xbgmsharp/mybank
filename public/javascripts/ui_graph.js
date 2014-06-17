$(document).ready(function() {

	function getdata() {
          var formData = new FormData(document.getElementById('filterForm'));
          $.ajax({
		 url: '/graph',
		 data: formData,
		 cache: false,
		 contentType: "text/plain",
		 processData: false,
		 type: 'POST',
		 success: function(data){
		       console.log(data);
		 }
	  });
	}

	document.getElementById('desc').value = "salaire";
	var data = getdata();
	console.log(data);

        // The data for the Line chart. Multiple lines are specified as seperate arrays.
        //var data = [10,4,17,50,25,19,20,25,30,29,30,29];
    
        // Create the Line chart object. The arguments are the canvas ID and the data array.
        var line = new RGraph.Line("chart_salaire", data)
        
        // The way to specify multiple lines is by giving multiple arrays, like this:
        //var line = new RGraph.Line("chart_salaire", [4,6,8], [8,4,6], [4,5,3])
       
            // Configure the chart to appear as you wish.
            .set('background.barcolor1', 'white')
            .set('background.barcolor2', 'white')
            .set('background.grid.color', 'rgba(238,238,238,1)')
            .set('colors', ['red'])
            .set('linewidth', 2)
            .set('filled', true)
            .set('hmargin', 5)
            .set('labels', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
            .set('gutter.left', 40)
        
            // Now call the .draw() method to draw the chart.
            .draw();

}); /* End DOM ready */
