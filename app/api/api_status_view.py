from flask import Blueprint, Response, current_app, jsonify, request, stream_with_context
from app.models.status import Status
import json
import time

bp = Blueprint('status api', __name__)


@bp.route('/api/status', methods=['GET', 'POST'])
def status():

    if request.method == 'POST':
        data = request.get_json()

        if not data:
            return jsonify({"error": "Invalid data"}), 400

        status_id = data.get("id")

        if not status_id:
            return jsonify({"error": "Invalid data"}), 400

        print(f"id {status_id}")

        status = current_app.status_manager.get_available_status_by_id(status_id)

        if status is None:
            return jsonify({"error": "Status not found"}), 404

        current_app.status_manager.set_status(status)

    return jsonify(current_app.status_manager.status.to_dict()), 200


@bp.route('/api/statuses', methods=['GET'])
def statuses():

    try:
        available_statuses = current_app.status_manager.get_available_statuses()

        available_statuses = [
            Status(
                status.get('id'),
                status.get('name'),
                status.get('value')
            )
            for status in available_statuses
        ]

        return jsonify([
            status.to_dict()
            for status in available_statuses
        ]), 200

    except Exception as ex:
        return jsonify({
            "error": f"Failed to get statuses: {ex}"
        }), 500


@bp.route('/api/status/stream', methods=['GET'])
def status_stream():

    @stream_with_context
    def generate():
        while True:
            status = current_app.status_manager.status.to_dict()

            yield f"data: {json.dumps(status)}\n\n"

            time.sleep(1)

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )