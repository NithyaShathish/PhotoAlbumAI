
var apigClient = apigClientFactory.newClient();
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition

function voiceSearch() {
    if ('SpeechRecognition' in window) {
        console.log("SpeechRecognition is Working");
    } else {
        console.log("SpeechRecognition is Not Working");
    }

    var inputSearchQuery = document.getElementById("search_query");
    const recognition = new window.SpeechRecognition();
    //recognition.continuous = true;

    micButton = document.getElementById("mic_search");

    if (micButton.innerHTML == "mic") {
        recognition.start();
    } else if (micButton.innerHTML == "mic_off") {
        recognition.stop();
    }

    recognition.addEventListener("start", function () {
        micButton.innerHTML = "mic_off";
        console.log("Recording.....");
    });

    recognition.addEventListener("end", function () {
        console.log("Stopping recording.");
        micButton.innerHTML = "mic";
    });

    recognition.addEventListener("result", resultOfSpeechRecognition);
    function resultOfSpeechRecognition(event) {
        const current = event.resultIndex;
        transcript = event.results[current][0].transcript;
        inputSearchQuery.value = transcript;
        console.log("transcript : ", transcript)
    }
}




function textSearch() {
    var searchText = document.getElementById('search_query');
    if (!searchText.value) {
        alert('Please enter a valid text or voice input!');
    } else {
        searchText = searchText.value.trim().toLowerCase();
        console.log('Searching Photos....');
        searchPhotos(searchText);
    }

}

function searchPhotos(searchText) {

    console.log(searchText);
    document.getElementById('search_query').value = searchText;
    document.getElementById('photos_search_results').innerHTML = "<h4 style=\"text-align:center\">";

    var params = {
        'q': searchText
    };
    apigClient.searchGet(params, {}, {})
        .then(function (result) {
            console.log("Result : ", result);

            image_paths = result["data"]["imagePaths"];
            console.log("image_paths : ", image_paths);

            var photosDiv = document.getElementById("photos_search_results");
            photosDiv.innerHTML = "";

            var n;
            for (n = 0; n < image_paths.length; n++) {
                images_list = image_paths[n].split('/');
                imageName = images_list[images_list.length - 1];

                photosDiv.innerHTML += '<figure><img src="' + image_paths[n] + '" style="width:25%"><figcaption>' + imageName + '</figcaption></figure>';
            }

        }).catch(function (result) {
            console.log(result);
        });
}

function uploadPhoto() {
    var filePath = document.getElementById('uploaded_file').value

    if (!filePath) {
        alert("Please upload a valid .png/.jpg/.jpeg file!");
        return
    }
    filePath = filePath.split("\\");
    var fileName = filePath[filePath.length - 1];
    if (!['png', 'jpg', 'jpeg'].includes(fileName.split(".")[1])) {
        alert("Please upload a valid .png/.jpg/.jpeg file!");
        return
    }

    var customLabels = ""
    if (!(document.getElementById('custom_labels').value == "")){
        customLabels = document.getElementById('custom_labels').value
    }
    var reader = new FileReader();
    var file = document.getElementById('uploaded_file').files[0];
    console.log('File : ', file);
    document.getElementById('uploaded_file').value = "";

    reader.onload = function (e) {
        var src = e.target.result;
        var newImage = document.createElement("img");
        newImage.src = src;
        encoded = newImage.outerHTML;

        last_index_quote = encoded.lastIndexOf('"');

        encodedStr = encoded.substring(33, last_index_quote);

        var params = {
            "object": file.name,
            "bucket": "photo-album-bucket-050853423703",
            "Content-Type": file.type,
            "x-amz-meta-customLabels": customLabels,
        };

        var additionalParams = {
            headers: {
                // 'Access-Control-Allow-Origin': '*',
                // 'Access-Control-Allow-Headers': '*'
            }
        };

        apigClient.uploadBucketObjectPut(params, encodedStr, additionalParams)
            .then(function (result) {
                console.log(result);
                console.log('success OK');
                alert("Photo Uploaded Successfully");
            }).catch(function (result) {
                console.log(result);
            });
    }
    reader.readAsDataURL(file);



    // var params = {
    //     headers: {
    //         'Access-Control-Allow-Origin': '*',
    //         'Content-Type': file.type
    //     }
    // };
    // var additionalParams = {
    //     // headers: {
    //     //     'Access-Control-Allow-Origin': '*',
    //     //     'Content-Type': file.type
    //     // }
    // };

}