import json
import numpy as np
import cv2
import fitz

# 1. Carregar coordenadas calculadas com homografia
doc = fitz.open('Inspirações/Ordem 2/Ordem Paranormal II - Playtest Alpha v1.1 (sobreviventes).pdf')
p = doc[33]
words = p.get_text('words')

pin_boxes = {}
for w in words:
    text = w[4].strip()
    if text.isdigit():
        num = int(text)
        if 1 <= num <= 24 and w[1] < 500:
            cx = (w[0] + w[2]) / 2.0
            cy = (w[1] + w[3]) / 2.0
            pin_boxes[num] = (cx, cy)

M = np.load('scratch/homography_p34_to_map.npy')
MAP_W = 3537.0
MAP_H = 3750.0

coordenadas_calibradas = {}
for num in sorted(pin_boxes.keys()):
    cx, cy = pin_boxes[num]
    px = cx * (1211.0 / p.rect.width)
    py = cy * (1625.0 / p.rect.height)
    
    pt = np.array([[[px, py]]], dtype=np.float32)
    dst = cv2.perspectiveTransform(pt, M)[0][0]
    
    map_x = dst[0]
    map_y = dst[1]
    
    pct_x = round(float(map_x / MAP_W) * 100.0, 1)
    pct_y = round(float(map_y / MAP_H) * 100.0, 1)
    
    coordenadas_calibradas[num] = (pct_x, pct_y)
    print(f"Pin {num:02d}: x={pct_x}%, y={pct_y}%")

# 2. Carregar campanhas.json
with open('campanhas.json', 'r', encoding='utf-8') as f:
    campanhas = json.load(f)

campanha = next(x for x in campanhas if x.get('id') == 'a-maldicao-do-idolo-de-pedra')

atualizados = 0
for loc in campanha.get('locais', []):
    for com in loc.get('comodos', []):
        for pin in com.get('pins', []):
            num = pin.get('numero')
            if num in coordenadas_calibradas:
                antigo_x, antigo_y = pin.get('x'), pin.get('y')
                novo_x, novo_y = coordenadas_calibradas[num]
                pin['x'] = novo_x
                pin['y'] = novo_y
                print(f"Atualizado Pin {num:02d} ({pin.get('titulo')}): ({antigo_x}, {antigo_y}) -> ({novo_x}, {novo_y})")
                atualizados += 1

with open('campanhas.json', 'w', encoding='utf-8') as f:
    json.dump(campanhas, f, indent=2, ensure_ascii=False)

print(f"\nTotal de pins atualizados com sucesso em campanhas.json: {atualizados}")
