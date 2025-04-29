from flask import Blueprint, current_app, jsonify, render_template, request

bp = Blueprint('battery', __name__)

@bp.route('/battery/percentage', methods=['GET'])
def battery_percentage_view():
    """
    View function to get the battery percentage.
    """
    try:
        battery_percentage = current_app.ina219_manager.getPowerPercent()

        return jsonify({"battery_percentage": battery_percentage}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500