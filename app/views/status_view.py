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