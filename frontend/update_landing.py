import re

with open("app/(marketing)/landing/page.tsx", "r") as f:
    content = f.read()

# I will just write a new page.tsx using write_to_file because it's easier to ensure no regex messes up.
