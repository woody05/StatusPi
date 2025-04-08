from flask import Blueprint, current_app, jsonify, render_template, request

bp = Blueprint('settings', __name__)

@bp.route('/settings', methods=['GET'])
def settings():

    return render_template('settings.html')