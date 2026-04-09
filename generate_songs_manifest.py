import json
import os

base = 'Songs'
manifest = []
for folder in sorted(os.listdir(base)):
    path = os.path.join(base, folder)
    if not os.path.isdir(path):
        continue
    info = {'title': folder, 'description': ''}
    info_path = os.path.join(path, 'info.json')
    if os.path.exists(info_path):
        with open(info_path, 'r', encoding='utf-8') as f:
            try:
                info.update(json.load(f))
            except Exception as e:
                print('info parse error', folder, e)
    tracks = [filename for filename in sorted(os.listdir(path)) if filename.lower().endswith('.mp3')]
    cover = 'cover.jpg' if os.path.exists(os.path.join(path, 'cover.jpg')) else None
    manifest.append({
        'folder': folder,
        'title': info.get('title', ''),
        'description': info.get('description', ''),
        'cover': cover,
        'tracks': tracks,
    })

with open('songs.json', 'w', encoding='utf-8') as f:
    json.dump({'albums': manifest}, f, indent=2, ensure_ascii=False)

print(f'generated songs.json with {len(manifest)} albums')