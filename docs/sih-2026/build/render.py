import pymupdf, sys, os
pdf = sys.argv[1]; outdir = sys.argv[2]; os.makedirs(outdir, exist_ok=True)
d = pymupdf.open(pdf); print("pages:", len(d), "size:", d[0].rect)
for i, p in enumerate(d):
    p.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5)).save(f"{outdir}/s{i+1}.png")
