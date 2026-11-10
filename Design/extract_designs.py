import json
import re
import base64
import gzip
import os

extracted_dir = r"D:\ЗуевК\Code\FlowForge\Design\extracted"

for fname in os.listdir(extracted_dir):
    if fname.endswith(".html") and not fname.endswith("_rendered.html"):
        filepath = os.path.join(extracted_dir, fname)
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()

        manifest_match = re.search(r'<script type="__bundler/manifest">(.*?)</script>', text, re.DOTALL)
        template_match = re.search(r'<script type="__bundler/template">(.*?)</script>', text, re.DOTALL)

        if manifest_match and template_match:
            manifest = json.loads(manifest_match.group(1).strip())
            template = json.loads(template_match.group(1).strip())
            base_name = fname[:-5]

            # In bundler, files from manifest are referenced in template
            # For each manifest item, convert data to base64 data uri or save asset
            # Replace references in template: e.g. src="about:blank#asset-id" or similar
            for asset_id, asset_info in manifest.items():
                mime = asset_info.get("mime", "application/octet-stream")
                data_b64 = asset_info["data"]
                if asset_info.get("compressed"):
                    raw = gzip.decompress(base64.b64decode(data_b64))
                    data_b64 = base64.b64encode(raw).decode("ascii")
                data_uri = f"data:{mime};base64,{data_b64}"
                template = template.replace(f"about:blank#{asset_id}", data_uri)
                template = template.replace(f"#{asset_id}", data_uri)
                template = template.replace(asset_id, data_uri)

            out_path = os.path.join(extracted_dir, f"{base_name}_rendered.html")
            with open(out_path, "w", encoding="utf-8") as out_f:
                out_f.write(template)
            print(f"Created {base_name}_rendered.html (size: {len(template)})")
