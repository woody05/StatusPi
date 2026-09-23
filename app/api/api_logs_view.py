import sqlite3
from flask import Blueprint, current_app, jsonify, request
from app.log_reader import LogReader  # adjust import to your project path

bp = Blueprint('logs_api', __name__)


@bp.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        limit = request.args.get("limit", default=50, type=int)
        page = request.args.get("page", default=1, type=int)
        level = request.args.get("level", type=str)
        start_date = request.args.get("start_date", type=str)
        end_date = request.args.get("end_date", type=str)

        reader = current_app.log_reader
        logs = reader.fetch_logs(
            limit=limit, 
            page=page, 
            level=level, 
            start_date=start_date, 
            end_date=end_date
        )

        return jsonify([log.to_dict() for log in logs]), 200

    except sqlite3.OperationalError as ex:
        current_app.logger.error(f"Database error reading logs: {ex}")
        return jsonify({"error": f"Database error: {str(ex)}"}), 500

    except Exception as ex:
        current_app.logger.error(f"Failed to fetch logs: {ex}")
        return jsonify({"error": f"Failed to get logs: {str(ex)}"}), 500