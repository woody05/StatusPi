# app/api/routes.py
from flask import Blueprint, jsonify, request
from app.database.settings_models import SettingsGroup, SettingValueType
from app.database.db_manager import DatabaseManager as DB

# Define the blueprint (Registered in app.py with url_prefix='/api')
bp = Blueprint("settings_api", __name__)


# =====================================================================
#  Helper Function for Custom Endpoints
# =====================================================================

def _handle_setting_endpoint(key: str):
    """Generic GET/POST handler for setting endpoints."""
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        # Expect payload like {"value": ...} or raw payload
        new_val = payload.get("value", payload) if isinstance(payload, dict) else payload

        if DB.update_setting_value(key, new_value=new_val.upper()):
            return jsonify({"status": "success", "key": key, "value": new_val.upper()}), 200
        return jsonify({"error": f"Setting '{key}' not found"}), 404

    # GET Request
    setting = DB.get_setting_by_key(key)
    if setting:
        return jsonify({"key": key, "value": setting.value}), 200
    return jsonify({"error": f"Setting '{key}' not found"}), 404


# =====================================================================
#  Custom Setting Endpoints (All 8 Preserved)
# =====================================================================

@bp.route("/settings/default/brightness", methods=["GET", "POST"])
def brightness():
    """Get or update default brightness setting.
    ---
    get:
      summary: Get default brightness
      responses:
        "200":
          description: Setting value retrieved
          schema:
            type: object
            properties:
              key:
                type: string
              value:
                type: string
        "404":
          description: Setting not found
    post:
      summary: Update default brightness
      consumes:
        - application/json
      parameters:
        - name: body
          in: body
          required: true
          schema:
            type: object
            properties:
              value:
                type: string
      responses:
        "200":
          description: Setting updated successfully
        "404":
          description: Setting not found
    """
    return _handle_setting_endpoint("default_brightness")


@bp.route("/settings/default/mode", methods=["GET", "POST"])
def default_mode():
    """Get or update default operating mode setting.
    ---
    get:
      summary: Get default operating mode
      responses:
        "200":
          description: Setting value retrieved
          schema:
            type: object
            properties:
              key:
                type: string
              value:
                type: string
        "404":
          description: Setting not found
    post:
      summary: Update default operating mode
      consumes:
        - application/json
      parameters:
        - name: body
          in: body
          required: true
          schema:
            type: object
            properties:
              value:
                type: string
      responses:
        "200":
          description: Setting updated successfully
        "404":
          description: Setting not found
    """
    return _handle_setting_endpoint("default_mode")


@bp.route("/settings/mode/intervals/flash", methods=["GET", "POST"])
def flash_intervals():
    """Get or update flash interval setting.
    ---
    get:
      summary: Get flash intervals
      responses:
        "200":
          description: Setting value retrieved
          schema:
            type: object
            properties:
              key:
                type: string
              value:
                type: string
        "404":
          description: Setting not found
    post:
      summary: Update flash intervals
      consumes:
        - application/json
      parameters:
        - name: body
          in: body
          required: true
          schema:
            type: object
            properties:
              value:
                type: string
      responses:
        "200":
          description: Setting updated successfully
        "404":
          description: Setting not found
    """
    return _handle_setting_endpoint("default_flash_intervals")


@bp.route("/settings/mode/intervals/wave", methods=["GET", "POST"])
def wave_intervals():
    """Get or update wave interval setting.
    ---
    get:
      summary: Get wave intervals
      responses:
        "200":
          description: Setting value retrieved
          schema:
            type: object
            properties:
              key:
                type: string
              value:
                type: string
        "404":
          description: Setting not found
    post:
      summary: Update wave intervals
      consumes:
        - application/json
      parameters:
        - name: body
          in: body
          required: true
          schema:
            type: object
            properties:
              value:
                type: string
      responses:
        "200":
          description: Setting updated successfully
        "404":
          description: Setting not found
    """
    return _handle_setting_endpoint("default_wave_intervals")


@bp.route("/settings/mode/intervals/scatter", methods=["GET", "POST"])
def scatter_intervals():
    """Get or update scatter interval setting.
    ---
    get:
      summary: Get scatter intervals
      responses:
        "200":
          description: Setting value retrieved
          schema:
            type: object
            properties:
              key:
                type: string
              value:
                type: string
        "404":
          description: Setting not found
    post:
      summary: Update scatter intervals
      consumes:
        - application/json
      parameters:
        - name: body
          in: body
          required: true
          schema:
            type: object
            properties:
              value:
                type: string
      responses:
        "200":
          description: Setting updated successfully
        "404":
          description: Setting not found
    """
    return _handle_setting_endpoint("default_scatter_intervals")


@bp.route("/settings/status/available", methods=["GET", "POST"])
def available_status():
    """Get or update available status setting.
    ---
    get:
      summary: Get available status setting
      responses:
        "200":
          description: Setting value retrieved
          schema:
            type: object
            properties:
              key:
                type: string
              value:
                type: string
        "404":
          description: Setting not found
    post:
      summary: Update available status setting
      consumes:
        - application/json
      parameters:
        - name: body
          in: body
          required: true
          schema:
            type: object
            properties:
              value:
                type: string
      responses:
        "200":
          description: Setting updated successfully
        "404":
          description: Setting not found
    """
    return _handle_setting_endpoint("available_status")


@bp.route("/settings/status/busy", methods=["GET", "POST"])
def busy_status():
    """Get or update busy status setting.
    ---
    get:
      summary: Get busy status setting
      responses:
        "200":
          description: Setting value retrieved
          schema:
            type: object
            properties:
              key:
                type: string
              value:
                type: string
        "404":
          description: Setting not found
    post:
      summary: Update busy status setting
      consumes:
        - application/json
      parameters:
        - name: body
          in: body
          required: true
          schema:
            type: object
            properties:
              value:
                type: string
      responses:
        "200":
          description: Setting updated successfully
        "404":
          description: Setting not found
    """
    return _handle_setting_endpoint("busy_status")


@bp.route("/settings/status/away", methods=["GET", "POST"])
def away_status():
    """Get or update away status setting.
    ---
    get:
      summary: Get away status setting
      responses:
        "200":
          description: Setting value retrieved
          schema:
            type: object
            properties:
              key:
                type: string
              value:
                type: string
        "404":
          description: Setting not found
    post:
      summary: Update away status setting
      consumes:
        - application/json
      parameters:
        - name: body
          in: body
          required: true
          schema:
            type: object
            properties:
              value:
                type: string
      responses:
        "200":
          description: Setting updated successfully
        "404":
          description: Setting not found
    """
    return _handle_setting_endpoint("away_status")


# =====================================================================
#  Status Collection Endpoints
# =====================================================================

@bp.route("/settings/status", methods=["GET", "POST"])
def handle_statuses():
    """GET all statuses or POST a new status to the Statuses group.
    ---
    get:
      summary: Get all statuses
      responses:
        "200":
          description: List of statuses retrieved
          schema:
            type: array
            items:
              type: object
        "404":
          description: Statuses group not found
    post:
      summary: Add a new status
      consumes:
        - application/json
      parameters:
        - name: body
          in: body
          required: true
          schema:
            type: object
            required:
              - name
              - setting_key
              - value
            properties:
              name:
                type: string
              setting_key:
                type: string
              value:
                type: string
              description:
                type: string
      responses:
        "201":
          description: Status added successfully
        "400":
          description: Missing required fields
        "409":
          description: Setting key already exists
        "404":
          description: Statuses group does not exist
    """
    if request.method == "GET":
        statuses = DB.get_statuses()
        if statuses is None:
            return jsonify({"error": "Statuses group not found"}), 404
        return jsonify(statuses), 200

    # POST Method
    data = request.get_json(silent=True) or {}
    required_fields = ["name", "setting_key", "value"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    setting_key = data["setting_key"]
    if DB.get_setting_by_key(setting_key):
        return jsonify({"error": f"Setting key '{setting_key}' already exists"}), 409

    result = DB.add_status(
        name=data["name"],
        setting_key=setting_key,
        value=data["value"],
        description=data.get("description")
    )
    if not result:
        return jsonify({"error": "Statuses group does not exist in the database. Please seed first."}), 404

    return jsonify({"message": "Status added successfully", "status": result}), 201


# =====================================================================
#  Generic CRUD & Seed Endpoints
# =====================================================================

@bp.route("/seed", methods=["GET"])
def seed():
    """Populate database with flat default settings mapped to 3 distinct groups.
    ---
    summary: Seed database
    responses:
      "200":
        description: Database seeded or already seeded
    """
    if DB.seed_database():
        return jsonify({"message": "Database seeded successfully!"}), 200
    return jsonify({"message": "Database already seeded!"}), 200


@bp.route("/settings", methods=["GET"])
def get_settings():
    """Fetch all settings groups with nested settings matching your structured JSON output.
    ---
    summary: Get all settings groups and settings
    responses:
      "200":
        description: List of groups with nested settings
        schema:
          type: array
          items:
            type: object
    """
    groups = DB.get_all_groups_with_settings()
    return jsonify([group.to_dict(include_settings=True) for group in groups]), 200


@bp.route("/settings/<key>", methods=["GET"])
def get_setting_by_key(key: str):
    """Fetch any single setting dynamically by key using to_dict().
    ---
    summary: Get setting by key
    parameters:
      - name: key
        in: path
        required: true
        type: string
        description: Setting key identifier
    responses:
      "200":
        description: Setting found
        schema:
          type: object
      "404":
        description: Setting not found
    """
    setting = DB.get_setting_by_key(key)
    if not setting:
        return jsonify({"error": f"Setting '{key}' not found"}), 404

    return jsonify(setting.to_dict()), 200


@bp.route("/groups/<int:group_id>", methods=["DELETE"])
def delete_group(group_id: int):
    """Delete a setting group (cascades to associated settings).
    ---
    summary: Delete setting group
    parameters:
      - name: group_id
        in: path
        required: true
        type: integer
        description: Group ID to delete
    responses:
      "200":
        description: Group deleted successfully
      "404":
        description: Group not found
    """
    if DB.delete(SettingsGroup, group_id):
        return jsonify({"message": f"Group {group_id} deleted successfully."}), 200
    return jsonify({"error": f"Group {group_id} not found"}), 404


# =====================================================================
#  Dynamic Creation Endpoints (POST)
# =====================================================================

@bp.route("/groups", methods=["POST"])
def create_group():
    """Create a new Settings Group.
    ---
    summary: Create settings group
    consumes:
      - application/json
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - name
          properties:
            name:
              type: string
            description:
              type: string
    responses:
      "201":
        description: Group created successfully
      "400":
        description: Field name is required
      "409":
        description: Group already exists
    """
    data = request.get_json(silent=True) or {}
    name = data.get("name")

    if not name:
        return jsonify({"error": "Field 'name' is required"}), 400

    if DB.get_group_by_name(name):
        return jsonify({"error": f"Group '{name}' already exists"}), 409

    response_data = DB.create_group(name=name, description=data.get("description", ""))
    return jsonify({"message": "Group created successfully", "group": response_data}), 201


@bp.route("/settings", methods=["POST"])
def create_setting():
    """Create a new individual Setting.
    ---
    summary: Create individual setting
    consumes:
      - application/json
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - name
            - setting_key
            - value
            - settings_group_id
          properties:
            name:
              type: string
            setting_key:
              type: string
            value:
              type: string
            settings_group_id:
              type: integer
            value_type:
              type: string
            description:
              type: string
    responses:
      "201":
        description: Setting created successfully
      "400":
        description: Missing required fields or invalid value_type
      "404":
        description: Group ID not found
      "409":
        description: Setting key already exists
    """
    data = request.get_json(silent=True) or {}

    required_fields = ["name", "setting_key", "value", "settings_group_id"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    setting_key = data["setting_key"]
    if DB.get_setting_by_key(setting_key):
        return jsonify({"error": f"Setting key '{setting_key}' already exists"}), 409

    if not DB.get_by_id(SettingsGroup, data["settings_group_id"]):
        return jsonify({"error": f"Group ID {data['settings_group_id']} not found"}), 404

    raw_type = data.get("value_type", "string").lower()
    try:
        v_type = SettingValueType(raw_type) if isinstance(raw_type, int) else SettingValueType[raw_type]
    except (KeyError, ValueError):
        valid_types = [t.name for t in SettingValueType]
        return jsonify({"error": f"Invalid value_type. Must be one of: {valid_types}"}), 400

    response_data = DB.create_setting(
        name=data["name"],
        description=data.get("description", ""),
        setting_key=setting_key,
        value_type=v_type,
        value=data["value"],
        settings_group_id=data["settings_group_id"]
    )
    return jsonify({"message": "Setting created successfully", "setting": response_data}), 201