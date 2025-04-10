from flask import Blueprint, current_app, jsonify, render_template, request

bp = Blueprint('settings', __name__)

@bp.route('/settings', methods=['GET'])
def settings():

    available_statuses = current_app.status_manager.get_available_statuses()
    brightness = current_app.settings_manager.get_settings().brightness

    return render_template('settings.html', available_statuses=available_statuses, brightness=brightness)

@bp.route('/settings/update/settings', methods=['POST'])
def update_settings():

    data = request.get_json()

    try:
        current_app.settings_manager.update_settings(data)
        current_app.status_manager.set_brightness(data.get("brightness", 25))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"status": "success"}), 200