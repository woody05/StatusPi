from flask import Blueprint, current_app, jsonify, render_template, request

from app.status_manager import Mode

bp = Blueprint('status', __name__)

@bp.route('/', methods=['GET'])
def index():
    status = current_app.status_manager.status
    available_statuses = current_app.status_manager.get_available_statuses()

    mode = current_app.status_manager.mode

    return render_template('index.html', status=status, available_statuses=available_statuses, mode=mode)

@bp.route('/status', methods=['GET', 'POST'])
def status():
    if request.method == 'POST':

        data = request.get_json()

        status_id = data.get("status_id", None)

        if not data or not status_id:
            return jsonify({"error": "Invalid data"}), 400
        
        status = current_app.status_manager.get_available_status_by_id(status_id)

        if status is None:
            return jsonify({"error": "Status not found"}), 404

        current_app.status_manager.set_status(status)
    
    return jsonify({"status": current_app.status_manager.status.to_dict()}), 200

@bp.route('/change/mode', methods=['GET', 'POST'])
def change_mode():
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

        return jsonify({"status": "success"}), 200
    
    return jsonify({"mode": current_app.status_manager.mode.name}), 200