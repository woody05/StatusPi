from flask import Blueprint, current_app, jsonify, render_template, request

from app.status_manager import Mode

bp = Blueprint('status', __name__)

@bp.route('/', methods=['GET'])
def index():
    status = current_app.status_manager.status
    available_statuses = current_app.status_manager.get_available_statuses()
    modes = current_app.status_manager.get_mode_list()

    mode = current_app.status_manager.mode

    return render_template('index.html', status=status, available_statuses=available_statuses, mode=mode, modes=modes)