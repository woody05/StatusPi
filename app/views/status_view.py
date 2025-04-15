from flask import Blueprint, current_app, jsonify, render_template, request

bp = Blueprint('status', __name__)

@bp.route('/', methods=['GET'])
def index():
    status = current_app.status_manager.status
    available_statuses = current_app.status_manager.get_available_statuses()

    return render_template('index.html', status=status, available_statuses=available_statuses)

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
    \

@bp.route('/flashing', methods=['GET', 'POST'])
def flashing():
    if request.method == 'POST':
        data = request.get_json()

        flashing = data.get("flashing", None)

        print(f"Flashing: {flashing}")
        
        if flashing is None or not isinstance(flashing, bool):
            return jsonify({"error": "Invalid data"}), 400

        if flashing:
            current_app.status_manager.set_flashing_status()
        else:
            current_app.status_manager.stop_flashing()

        return jsonify({"status": "success"}), 200
    
    return jsonify({"Flashing": current_app.status_manager.is_flashing}), 200