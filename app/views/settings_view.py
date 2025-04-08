from flask import Blueprint, current_app, jsonify, render_template, request

bp = Blueprint('settings', __name__)

@bp.route('/settings', methods=['GET'])
def settings():

    available_statuses = current_app.status_manager.get_available_statuses()

    return render_template('settings.html', available_statuses=available_statuses)
