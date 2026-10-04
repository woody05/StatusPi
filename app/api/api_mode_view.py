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
    tags:
      - Mode
    produces:
      - application/json
    responses:
      200:
        description: Current operating mode
        schema:
          type: object
          properties:
            mode:
              type: string
              description: Current operating mode
              enum:
                - FLASHING
                - WAVE
                - SCATTER
              example: FLASHING
    """
    return jsonify({
        "mode": current_app.status_manager.mode.name
    }), 200


@bp.route('/api/mode', methods=['POST'])
def set_mode():
    """Set current operating mode.
    ---
    summary: Set operating mode
    tags:
      - Mode
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - name: body
        in: body
        required: true
        description: Operating mode to set
        schema:
          type: object
          required:
            - mode
          properties:
            mode:
              type: string
              description: The target operating mode
              enum:
                - FLASHING
                - WAVE
                - SCATTER
              example: FLASHING
    responses:
      200:
        description: Mode updated successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            mode:
              type: string
              enum:
                - FLASHING
                - WAVE
                - SCATTER
              example: FLASHING
      400:
        description: Invalid request data or invalid mode
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Invalid mode: INVALID"
    """
    data = request.get_json()

    mode = data.get("mode", None) if data else None

    print(f"Mode: {mode}")

    if mode is None:
        return jsonify({"error": "Invalid data"}), 400

    try:
        mode_enum = Mode[mode.upper()]
    except KeyError:
        return jsonify({"error": f"Invalid mode: {mode}"}), 400

    current_app.status_manager.set_status_mode(mode_enum)

    return jsonify({
        "status": "success",
        "mode": current_app.status_manager.mode.name
    }), 200


@bp.route('/api/modes', methods=['GET'])
def statuses():
    """Get all available operating modes.
    ---
    summary: Get list of all modes
    tags:
      - Mode
    produces:
      - application/json
    responses:
      200:
        description: List of available operating modes
        schema:
          type: array
          items:
            type: string
            enum:
              - FLASHING
              - WAVE
              - SCATTER
          example:
            - FLASHING
            - WAVE
            - SCATTER
      500:
        description: Failed to get modes
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Failed to get modes"
    """
    try:
        modes = current_app.status_manager.get_mode_list()

        return jsonify([mode for mode in modes]), 200

    except Exception as ex:
        return jsonify({
            "error": f"Failed to get modes: {ex}"
        }), 500


@bp.route('/api/mode/stream', methods=['GET'])
def mode_stream():
    """Stream operating mode updates.
    ---
    summary: Stream operating mode
    description: |
      Opens a Server-Sent Events connection that sends the current
      operating mode every second.
    tags:
      - Mode
    produces:
      - text/event-stream
    responses:
      200:
        description: Server-sent event stream containing the current mode
        schema:
          type: string
          example: 'data: {"mode":"FLASHING"}'
    """
    @stream_with_context
    def generate():
        while True:
            mode = {
                "mode": current_app.status_manager.mode.name
            }

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
    """Get or set mode intervals.
    ---
    summary: Get or set mode intervals
    description: |
      GET returns the configured interval for each mode.
      POST updates the interval for a specific mode.
    tags:
      - Mode
    produces:
      - application/json
    consumes:
      - application/json
    parameters:
      - name: body
        in: body
        required: false
        description: Required when using POST to update an interval.
        schema:
          type: object
          required:
            - mode
            - value
          properties:
            mode:
              type: string
              description: Mode whose interval should be changed
              enum:
                - FLASHING
                - WAVE
                - SCATTER
              example: FLASHING
            value:
              type: number
              format: float
              description: New interval value
              example: 1.5
    responses:
      200:
        description: Request completed successfully
        schema:
          type: object
          properties:
            FLASHING:
              type: number
              format: float
              description: Flashing interval
              example: 1.0
            WAVE:
              type: number
              format: float
              description: Wave interval
              example: 2.0
            SCATTER:
              type: number
              format: float
              description: Scatter interval
              example: 0.5
            success:
              type: boolean
              description: True when an interval was updated
              example: true
            value:
              type: number
              format: float
              description: Updated interval value
              example: 1.5
      400:
        description: Invalid request, mode, or value
        schema:
          type: object
          properties:
            error:
              type: string
              examples:
                missingMode:
                  value: "Must include Mode"
                missingValue:
                  value: "Must include value"
                invalidMode:
                  value: "Invalid mode: INVALID"
    """
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}

        mode = payload.get("mode")
        new_val = payload.get("value")

        if mode is None:
            return jsonify({"error": "Must include Mode"}), 400

        if new_val is None:
            return jsonify({"error": "Must include value"}), 400

        try:
            mode_enum = Mode[mode.upper()]
        except KeyError:
            return jsonify({
                "error": f"Invalid mode: {mode}"
            }), 400

        match mode_enum:
            case Mode.FLASHING:
                current_app.status_manager.set_flashing_intervals(new_val)

            case Mode.SCATTER:
                current_app.status_manager.set_scatter_intervals(new_val)

            case Mode.WAVE:
                current_app.status_manager.set_wave_intervals(new_val)

            case _:
                return jsonify({"error": "Unknown mode"}), 400

        return jsonify({
            "success": True,
            "value": new_val
        }), 200

    return jsonify({
        "FLASHING": current_app.status_manager.flashing_intervals,
        "WAVE": current_app.status_manager.wave_intervals,
        "SCATTER": current_app.status_manager.scatter_intervals
    }), 200


@bp.route('/api/mode/interval/stream', methods=['GET'])
def get_mode_interval_stream():
    """Stream mode interval updates.
    ---
    summary: Stream interval updates for a mode
    description: |
      Opens a Server-Sent Events connection that sends the selected
      mode's interval every second.

      Example:
        /api/mode/interval/stream?mode=FLASHING
    tags:
      - Mode
    produces:
      - text/event-stream
    parameters:
      - name: mode
        in: query
        required: true
        type: string
        enum:
          - FLASHING
          - WAVE
          - SCATTER
        description: Mode whose interval should be streamed
        example: FLASHING
    responses:
      200:
        description: Server-sent event stream containing the mode interval
        schema:
          type: string
          example: 'data: {"mode":"FLASHING","intervals":1.0}'
      400:
        description: Missing or invalid mode
        schema:
          type: object
          properties:
            error:
              type: string
              examples:
                missingMode:
                  value: "Missing mode"
                invalidMode:
                  value: "Invalid mode: INVALID"
    """
    mode_name = request.args.get("mode")

    if not mode_name:
        return jsonify({"error": "Missing mode"}), 400

    try:
        mode = Mode[mode_name.upper()]
    except KeyError:
        return jsonify({
            "error": f"Invalid mode: {mode_name}"
        }), 400

    @stream_with_context
    def generate():
        while True:
            intervals = 0

            match mode:
                case Mode.FLASHING:
                    intervals = current_app.status_manager.flashing_intervals

                case Mode.SCATTER:
                    intervals = current_app.status_manager.scatter_intervals

                case Mode.WAVE:
                    intervals = current_app.status_manager.wave_intervals

            result = {
                "mode": mode.name,
                "intervals": intervals
            }

            yield f"data: {json.dumps(result)}\n\n"

            time.sleep(1)

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )
