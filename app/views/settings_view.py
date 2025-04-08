from flask import Blueprint, current_app, jsonify, render_template, request

bp = Blueprint('settings', __name__)

@bp.route('/settings', methods=['GET'])
def settings():

    available_statuses = current_app.status_manager.get_available_statuses()

    return render_template('settings.html', available_statuses=available_statuses)

@bp.route('/settings/update/statuses', methods=['POST'])
def update_settings():

    data = request.get_json()

    try:
        current_app.status_manager.update_statuses(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"status": "success"}), 200