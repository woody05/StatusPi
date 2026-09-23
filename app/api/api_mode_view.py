from flask import Blueprint, Response, current_app, jsonify, request, stream_with_context
import json
import time
from app.status_manager import Mode

bp = Blueprint('mode api', __name__)

@bp.route('/api/mode', methods=['GET', 'POST'])
def mode():
    if request.method == 'POST':
        data = request.get_json()

        mode = data.get("mode", None)

        print(f"Mode: {mode}")

        if mode is None:
            return jsonify({"error": "Invalid data"}), 400

        try:
            # Convert the mode string to the Mode enum
            mode_enum = Mode[mode.upper()]  # Ensure case-insensitivity
        except KeyError:
            return jsonify({"error": f"Invalid mode: {mode}"}), 400

        current_app.status_manager.set_status_mode(mode_enum)

        return jsonify({"status": "success", "mode": current_app.status_manager.mode.name}), 200

    return jsonify({"mode": current_app.status_manager.mode.name}), 200

@bp.route('/api/modes', methods=['GET'])
def statuses():
    try:
        modes = current_app.status_manager.get_mode_list()

        return jsonify([mode for mode in modes]), 200
    except Exception as ex:
        # Formatted as a JSON object with error message string
        return jsonify({"error": f"Failed to get modes: {ex}"}), 500

@bp.route('/api/mode/stream', methods=['GET'])
def mode_stream():

    @stream_with_context
    def generate():
        while True:
            mode = {"mode": current_app.status_manager.mode.name}

            yield f"data: {json.dumps(mode)}\n\n"

            time.sleep(1)

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )