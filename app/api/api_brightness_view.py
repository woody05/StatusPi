from flask import Blueprint, current_app, jsonify, request, Response, stream_with_context
import json
import time

bp = Blueprint('brightness_api', __name__)


@bp.route('/api/brightness', methods=['GET'])
def get_brightness():
    """Get current LED brightness.
    ---
    summary: Get current brightness
    responses:
      "200":
        description: Current brightness value
        schema:
          type: object
          properties:
            brightness:
              type: integer
              minimum: 0
              maximum: 255
    """
    brightness_val = current_app.status_manager.get_brightness()
    return jsonify({"brightness": brightness_val}), 200


@bp.route('/api/brightness', methods=['POST'])
def set_brightness():
    """Set LED brightness.
    ---
    summary: Set brightness
    consumes:
      - application/json
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - brightness
          properties:
            brightness:
              type: integer
              minimum: 0
              maximum: 255
              description: The target brightness level
    responses:
      "200":
        description: Brightness set successfully
        schema:
          type: object
          properties:
            status:
              type: string
            brightness:
              type: integer
      "400":
        description: Invalid or missing brightness value
    """
    data = request.get_json()
    brightness_val = data.get("brightness", None) if data else None

    if not data or brightness_val is None:
        return jsonify({"error": "Invalid data"}), 400

    current_app.status_manager.set_brightness(brightness_val)
    return jsonify({
        "status": "success",
        "brightness": brightness_val
    }), 200


@bp.route('/api/brightness/stream', methods=['GET'])
def brightness_stream():
    """Stream brightness updates.
    ---
    summary: Server-sent event stream of brightness changes
    description: Emits the current brightness object as an SSE `data:` event every second.
    responses:
      "200":
        description: text/event-stream of brightness values
        schema:
          type: string
    """
    @stream_with_context
    def generate():
        while True:
            brightness_val = current_app.status_manager.get_brightness()
            yield f"data: {json.dumps({'brightness': brightness_val})}\n\n"
            time.sleep(1)

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )