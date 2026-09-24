# app/views/docs_view.py
import os
from flask import Blueprint, send_from_directory, current_app

bp = Blueprint("docs", __name__)


@bp.route("/openapi.json")
def openapi_spec():
    static_dir = os.path.join(current_app.root_path, "api")
    print(static_dir)
    return send_from_directory(static_dir, "openapi.json")


@bp.route("/redoc")
def redoc_html():
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{current_app.config.get('APP_NAME', 'API')} - ReDoc</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="shortcut icon" href="https://fastapi.tiangolo.com/img/favicon.png">
        <style>body {{ margin: 0; padding: 0; }}</style>
    </head>
    <body>
        <noscript>ReDoc requires Javascript to function. Please enable it to browse the documentation.</noscript>
        <redoc spec-url="/openapi.json"></redoc>
        <script src="https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js"></script>
    </body>
    </html>
    """