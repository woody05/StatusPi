from flask import Blueprint, Response, current_app, jsonify, request, stream_with_context
import json
import time
from app.status_manager import Mode

bp = Blueprint('mode api', __name__)

@bp.route('/api/mode', methods=['GET'])
def get_mode():
    """Get current operating mode.
    ---
    summary: Get current mode
    responses:
      "200":
        description: Current mode value
        schema:
          type: object
          properties:
            mode:
              type: string
    """
    return jsonify({"mode": current_app.status_manager.mode.name}), 200

@bp.route('/api/mode', methods=['POST'])
def set_mode():
    """Set current operating mode.
    ---
    summary: Set operating mode
    consumes:
      - application/json
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - mode
          properties:
            mode:
              type: string
              description: The target mode name
    responses:
      "200":
        description: Mode updated successfully
        schema:
          type: object
          properties:
            status:
              type: string
            mode:
              type: string
      "400":
        description: Invalid data or invalid mode string
    """
    data = request.get_json()

    mode = data.get("mode", None) if data else None

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

@bp.route('/api/modes', methods=['GET'])
def statuses():
    """Get all available operating modes.
    ---
    summary: Get list of all modes
    responses:
      "200":
        description: List of available modes
        schema:
          type: array
          items:
            type: string
      "500":
        description: Failed to get modes
    """
    try:
        modes = current_app.status_manager.get_mode_list()

        return jsonify([mode for mode in modes]), 200
    except Exception as ex:
        # Formatted as a JSON object with error message string
        return jsonify({"error": f"Failed to get modes: {ex}"}), 500

@bp.route('/api/mode/stream', methods=['GET'])
def mode_stream():
    """Stream operating mode updates.
    ---
    summary: Server-sent event stream of mode changes
    description: Emits the current mode object as an SSE `data:` event every second.
    responses:
      "200":
        description: text/event-stream of mode values
        schema:
          type: string
    """
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

@bp.route('/api/mode/interval', methods=['GET', 'POST'])
def set_mode_interval():
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}

        mode = payload.get("mode")
        new_val = payload.get("value")

        if mode is None:
            return jsonify({"error": "Must include Mode"}), 400

        if new_val is None:
            return jsonify({"error": "Must include value"}), 400

        try:
            # Convert the mode string to the Mode enum
            mode_enum = Mode[mode.upper()]  # Ensure case-insensitivity
        except KeyError:
            return jsonify({"error": f"Invalid mode: {mode}"}), 400

        match mode_enum:
            case Mode.FLASHING:
                current_app.status_manager.set_flashing_intervals(new_val)
            case Mode.SCATTER:
                current_app.status_manager.set_scatter_intervals(new_val)
            case Mode.WAVE:
                current_app.status_manager.set_wave_intervals(new_val)
            case _:
                return jsonify({"error": "Unknown mode"}), 400

        return jsonify({"success": True, "value": new_val}), 200

    return jsonify({
        "FLASHING": current_app.status_manager.flashing_intervals,
        "WAVE": current_app.status_manager.wave_intervals,
        "SCATTER": current_app.status_manager.scatter_intervals
    }), 200
