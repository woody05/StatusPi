from flask import Blueprint, current_app, jsonify, request, Response, stream_with_context
import json
import time

bp = Blueprint('brightness api', __name__)

@bp.route('/api/brightness', methods=['GET', 'POST'])
def brightness():
    if request.method == 'POST':

        data = request.get_json()

        brightness = data.get("brightness", None)

        print(f"id {brightness}")

        if not data or not brightness:
            return jsonify({"error": "Invalid data"}), 400

        current_app.status_manager.set_brightness(brightness)

        return jsonify(brightness)

    brightness = current_app.status_manager.get_brightness()
    return jsonify(brightness), 200


@bp.route('/api/brightness/stream', methods=['GET'])
def brightness_stream():

    @stream_with_context
    def generate():
        while True:
            brightness = current_app.status_manager.get_brightness()

            yield f"data: {json.dumps(brightness)}\n\n"

            time.sleep(1)

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )