import json
import re
from flasgger import Swagger
from app import create_app

def export_spec():
    app = create_app()
    swagger = Swagger(app)

    with app.app_context():
        with app.test_request_context():
            spec_data = swagger.get_apispecs()
            
            # Automatically group and tag endpoints by their Flask Blueprint name
            if "paths" in spec_data:
                for rule in app.url_map.iter_rules():
                    # Skip static routes or built-in endpoints without a blueprint
                    if not rule.endpoint or "." not in rule.endpoint:
                        continue
                    
                    blueprint_name = rule.endpoint.split(".")[0]
                    
                    # Convert Flask path format (<variable> or <type:variable>) to OpenAPI format ({variable})
                    openapi_path = re.sub(r'<([^>:]+:)?([^>]+)>', r'{\2}', rule.rule)
                    
                    if openapi_path in spec_data["paths"]:
                        methods = rule.methods or []
                        for method in methods:
                            method_lower = method.lower()
                            if method_lower in spec_data["paths"][openapi_path]:
                                operation = spec_data["paths"][openapi_path][method_lower]
                                
                                # Initialize tags if not present
                                if "tags" not in operation:
                                    operation["tags"] = []
                                    
                                # Add blueprint name as a tag if it isn't already there
                                if blueprint_name not in operation["tags"]:
                                    operation["tags"].insert(0, blueprint_name)

            with open("app/api/openapi.json", "w") as f:
                json.dump(spec_data, f, indent=2)
                
    print("Successfully generated openapi.json grouped by blueprints!")

if __name__ == "__main__":
    export_spec()