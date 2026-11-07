import fitz
import os

pdf_path = r"Inspirações/Ordem 2/Ordem Paranormal II - Playtest Alpha v1.1 (sobreviventes).pdf"
output_dir = r"public/uploads/idolo_pedra/pontos"
os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"Total pages: {len(doc)}")

# Pages with points of interest: 32 to 60 (0-indexed: 31 to 59)
extracted = 0
for pno in range(30, 61):
    page = doc[pno]
    image_list = page.get_images(full=True)
    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        width = base_image["width"]
        height = base_image["height"]
        
        # Only save significant images (ignore tiny icons or full-page backgrounds if too large or small)
        if width > 150 and height > 150:
            filename = f"page_{pno+1}_img_{img_index}_{width}x{height}.{image_ext}"
            file_path = os.path.join(output_dir, filename)
            with open(file_path, "wb") as f:
                f.write(image_bytes)
            print(f"Extracted: {filename}")
            extracted += 1

print(f"Total images extracted: {extracted}")
