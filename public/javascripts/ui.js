$(document).ready(function() {

	function uploadFile(filetoupload) {
          var formData = new FormData();
          formData.append('upfile', filetoupload);
		$.ajax({
		    url: '/import',
		    data: formData,
		    cache: false,
		    contentType: false,
		    processData: false,
		    type: 'POST',
		    success: function(data){
		        console.log(data);
		    }
		});
	}

	function handlefile(objfiles) {
		for (var i in objfiles)
		{
				var file = objfiles[i];
                                // Only process text or unknow file type.
                                if (file.type && !file.type.match('text*') && file.type != "") {
                                        document.getElementById('list').innerHTML = '<ul style="background-color: red;"> Only text file are supported </ul>';
                                        return;
                                }
				// Only process file below 256k
				if (file.size >= 262144) { // 256kb
					document.getElementById('list').innerHTML += '<ul style="background-color: red;"> Only file below 256Kb are supported </ul>';
					return;
				}

                                // file is a File objects. List some properties.
                                var output = [];
                                output.push('<li><strong>', escape(file.name), '</strong> (', file.type || 'n/a', ') - ',
                                        file.size, ' bytes, last modified: ',
                                        file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a',
                                        '</li>');

                                var reader = new FileReader();
                                // Closure to capture the file information.
                                reader.onload = (function(theFile) {
                                        return function(e) {
                                                        var content = e.target.result;
                                                        //$("#embed").val(content);
                                                        if (content.indexOf("Compte") === -1) {
                                                                document.getElementById('list').innerHTML +=
                                                                        '<ul style="background-color: red;"> Not a valid supported file </ul>';
                                                       }
                                                };
                                })(file);

                                // Read in the text file as Text.
                                reader.readAsText(file);
				document.getElementById('embedfile').files[0] = file;
				uploadFile(file);

                               document.getElementById('list').innerHTML += '<ul>' + output.join('') + '</ul>';
		}			
	}


        /* Input file */
        $(function() {
                function handleFileSelect(evt) {
			handlefile(evt.target.files);
                }
                document.getElementById('embedfile').addEventListener('change', handleFileSelect, false);
        });

        /* Drop file zone */
        $(function() {
                function handleFileSelect(evt) {
                                evt.stopPropagation();
                                evt.preventDefault();
                                handlefile(evt.dataTransfer.files);
                        }

                        function handleDragOver(evt) {
                                evt.stopPropagation();
                                evt.preventDefault();
                                evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
                        }

                // Setup the dnd listeners.
                var dropZone = document.getElementById('drop_zone');
                dropZone.addEventListener('dragover', handleDragOver, false);
                dropZone.addEventListener('drop', handleFileSelect, false);
        });

        // Check for the various File API support.
        if (!window.File && !window.FileReader) {
                alert('The File APIs are not fully supported by your browser.');
        }
}); /* End DOM ready */
