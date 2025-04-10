
class Status {

    static updateStatus(selector, status_id) {
        var selector = $(selector);

        $.ajax({
            url: '/status', // Endpoint to call
            type: 'POST', // HTTP method
            contentType: 'application/json', // Sending JSON data
            data: JSON.stringify({ status_id: status_id }), // Data to send
            success: function(response) {
                console.log('Status updated successfully:', response);
                // Optionally update the UI based on the response

                var color = response.status.color; // Convert the color string to RGBresponse.status.color; // Get the color from the response

                console.log('Color:', color); // Log the color for debugging
                var text = response.status.name; // Get the text from the response

                selector.html(text); // Update the HTML of the selector with the response
                selector.css('background-color', color); // Update the background color of the selector
            },
            error: function(xhr, status, error) {
                console.error('Error updating status:', error);
                // Optionally handle errors
            }
        });
    }
}