# The desk on /nicholas/

`assets/nicholas/desk.glb` is built by `build.py` in Blender, to the measurements of a phone scan of the real desk
(the scan itself isn't in the repo). Rebuild it with:

    python3 textures.py out/tex            # oak, linen, board fabric and wall textures (needs numpy and Pillow)
    Blender -b --python build.py -- out/tex ../../assets/nicholas/desk.glb [out/preview.png]

The screens, the print and the lights are set up in `assets/js/nicholas.js`.
