print("var preloadedFonts = [")
for i in range(0, 12):
    with open("VGA{}.SFN".format(i), "rb") as f:
        data = "".join("\\x{:02x}".format(ord(c)) for c in f.read())
        print('"{}:'.format(len(data) * 2) + data + '",')

print("];")
