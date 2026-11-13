# Builds Nick's desk corner for the website, to the measurements of his phone scan (see bl/MEASURE.md).
# Blender coordinates: x right, y toward the wall, z up, metres. glTF export turns this into y-up, z toward the viewer.
# Usage: Blender -b --python build.py -- <textures dir> <out.glb> [preview.png]
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
TEX, OUT = argv[0], argv[1]
PREVIEW = argv[2] if len(argv) > 2 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
COL = scene.collection
EXPORT = []

# ---------------------------------------------------------------- materials
IMAGES = {}
def image(name, colour=True):
    if name not in IMAGES:
        im = bpy.data.images.load(TEX + '/' + name)
        if not colour: im.colorspace_settings.name = 'Non-Color'
        IMAGES[name] = im
    return IMAGES[name]

def mat(name, color=(0.8, 0.8, 0.8), rough=0.5, metal=0.0, tex=None, rtex=None, emit=None, clearcoat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if clearcoat:
        b.inputs['Coat Weight'].default_value = clearcoat
    if tex:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = image(tex)
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if rtex:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = image(rtex, False)
        sep = nt.nodes.new('ShaderNodeSeparateColor')
        nt.links.new(t.outputs['Color'], sep.inputs['Color'])
        nt.links.new(sep.outputs['Red'], b.inputs['Roughness'])
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = 1.0
    return m

M = {
    'oak': mat('oak', (0.85, 0.66, 0.43), 0.45, tex='oak.jpg', rtex='oak_rough.jpg'),
    'oak_end': mat('oak_end', (0.78, 0.58, 0.36), 0.55, tex='oak.jpg'),
    'wall': mat('wall', (0.93, 0.9, 0.84), 0.9, tex='wall.jpg'),
    'floor': mat('floor', (0.36, 0.27, 0.2), 0.6),
    'paint': mat('trim', (0.95, 0.94, 0.9), 0.5),
    'fabric': mat('board_fabric', (0.55, 0.55, 0.53), 0.95, tex='fabric.jpg'),
    'paper': mat('print', (0.95, 0.94, 0.9), 0.7),
    'pin': mat('pin', (0.78, 0.12, 0.1), 0.25, clearcoat=0.6),
    'needle': mat('needle', (0.8, 0.8, 0.82), 0.25, 1.0),
    'brass': mat('brass', (0.86, 0.68, 0.4), 0.28, 1.0),
    'walnut': mat('walnut', (0.22, 0.12, 0.07), 0.35, clearcoat=0.4),
    'linen': mat('lamp_shade', (0.92, 0.86, 0.74), 0.9, tex='linen.jpg'),
    'bulb': mat('bulb', (1.0, 0.95, 0.85), 0.3, emit=(1.0, 0.85, 0.6)),
    'globe': mat('globe_glass', (0.97, 0.96, 0.93), 0.35),
    'alu': mat('space_gray', (0.34, 0.345, 0.36), 0.4, 0.9),
    'keys': mat('keycaps', (0.025, 0.025, 0.027), 0.55),
    'glass_black': mat('glass_black', (0.004, 0.004, 0.005), 0.06),
    'mbp_screen': mat('mbp_screen', (0.02, 0.02, 0.02), 0.08),
    'hinge': mat('hinge', (0.05, 0.05, 0.055), 0.45, 0.6),
    'grille': mat('grille', (0.15, 0.15, 0.16), 0.55, 0.5),
    'ti_desert': mat('ti_desert', (0.77, 0.68, 0.58), 0.32, 1.0),
    'ti_natural': mat('ti_natural', (0.74, 0.73, 0.7), 0.3, 1.0),
    'back_desert': mat('back_desert', (0.72, 0.62, 0.51), 0.55),
    'back_natural': mat('back_natural', (0.8, 0.79, 0.76), 0.55),
    'lens': mat('lens', (0.01, 0.012, 0.02), 0.04, clearcoat=1.0),
    'lens_ring': mat('lens_ring', (0.55, 0.55, 0.56), 0.3, 1.0),
    'screen_a': mat('phone_screen_a', (0.02, 0.02, 0.02), 0.08),
    'screen_b': mat('phone_screen_b', (0.02, 0.02, 0.02), 0.08),
    'ceramic': mat('ceramic', (0.95, 0.94, 0.91), 0.18, clearcoat=0.5),
    'tea': mat('tea', (0.32, 0.15, 0.06), 0.08),
    'tag': mat('tea_tag', (0.95, 0.5, 0.18), 0.6),
    'string': mat('string', (0.92, 0.9, 0.85), 0.8),
    'plane_white': mat('plane_white', (0.95, 0.95, 0.93), 0.22, clearcoat=0.8),
    'plane_coral': mat('plane_coral', (0.93, 0.42, 0.32), 0.25, clearcoat=0.8),
    'plane_navy': mat('plane_navy', (0.09, 0.14, 0.27), 0.3, clearcoat=0.6),
    'plane_window': mat('plane_window', (0.06, 0.08, 0.13), 0.15),
    'dresser_knob': mat('knob', (0.86, 0.68, 0.4), 0.3, 1.0),
    'grille_dark': mat('grille_dark', (0.07, 0.07, 0.07), 0.85),
    'groove': mat('groove', (0.2, 0.12, 0.06), 0.85),
    'granite': mat('granite', (0.62, 0.61, 0.6), 0.42, tex='granite.jpg'),
    'leaf': mat('leaf', (0.035, 0.1, 0.04), 0.36, clearcoat=0.35),
    'leaf_young': mat('leaf_young', (0.07, 0.17, 0.06), 0.4, clearcoat=0.3),
    'stem': mat('stem', (0.1, 0.13, 0.06), 0.6),
    'pot': mat('pot', (0.9, 0.9, 0.88), 0.45),
    'soil': mat('soil', (0.07, 0.05, 0.035), 1.0),
    'cap': mat('cap', (0.5, 0.5, 0.5), 0.95, tex='cap.jpg'),
    'tin': mat('tin', (0.72, 0.72, 0.71), 0.42, 0.45),
    'wax': mat('wax', (0.93, 0.86, 0.72), 0.5),
    'wick': mat('wick', (0.04, 0.035, 0.03), 0.9),
    'flame': mat('candle_flame', (1.0, 0.8, 0.45), 0.5, emit=(1.0, 0.62, 0.22)),
}

# ---------------------------------------------------------------- mesh helpers
def finish(name, bm, material, parent=None, smooth=True, sharp=35, weighted=False, export=True, mats=None):
    for f in bm.faces: f.smooth = smooth
    if smooth and sharp:
        for e in bm.edges:
            if e.is_manifold and e.calc_face_angle(0) > math.radians(sharp): e.smooth = False
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); COL.objects.link(o)
    if mats:
        for mm in mats: me.materials.append(mm)
    elif material: me.materials.append(material)
    if weighted:
        mod = o.modifiers.new('wn', 'WEIGHTED_NORMAL'); mod.keep_sharp = True; mod.mode = 'FACE_AREA'; mod.weight = 60
    if parent: o.parent = parent
    if export: EXPORT.append(o)
    return o

def box_bm(x0, x1, y0, y1, z0, z1, bevel=0.0, seg=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(x1 - x0, y1 - y0, z1 - z0), verts=bm.verts)
    bmesh.ops.translate(bm, vec=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), verts=bm.verts)
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, offset_type='OFFSET', segments=seg, profile=0.5, affect='EDGES', clamp_overlap=True)
    return bm

def box(name, x0, x1, y0, y1, z0, z1, material, bevel=0.0, seg=3, parent=None, uv=None):
    bm = box_bm(x0, x1, y0, y1, z0, z1, bevel, seg)
    if uv: box_uv(bm, *uv)
    return finish(name, bm, material, parent, smooth=bevel > 0, sharp=50, weighted=bevel > 0)

def box_uv(bm, scale=1.0, grain='x', offset=(0.0, 0.0)):
    """Planar UVs per face by its dominant axis; the grain runs along u."""
    uvl = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal; ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            c = l.vert.co
            if ax == 2: u, v = (c.x, c.y) if grain == 'x' else (c.y, c.x)
            elif ax == 1: u, v = (c.x, c.z) if grain != 'z' else (c.z, c.x)
            else: u, v = (c.y, c.z) if grain != 'z' else (c.z, c.y)
            l[uvl].uv = (u * scale + offset[0], v * scale + offset[1])

def rrect_pts(w, d, r, seg=10, cx=0.0, cy=0.0):
    pts = []
    for (qx, qy, a0) in [(w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)]:
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg); pts.append((cx + qx + r * math.cos(a), cy + qy + r * math.sin(a)))
    return pts

def slab_bm(pts, z0, z1, edge=0.0, seg=3):
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, z0)) for x, y in pts]
    f = bm.faces.new(vs)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    nv = [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, z1 - z0), verts=nv)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if edge > 0:
        rim = [e for e in bm.edges if (abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-7)]
        bmesh.ops.bevel(bm, geom=rim, offset=edge, offset_type='OFFSET', segments=seg, profile=0.5, affect='EDGES', clamp_overlap=True)
    return bm

def plate_bm(pts, z, uvbox=None):
    """A flat face from a 2D outline, facing +z, with UVs over uvbox = (x0, y0, w, h)."""
    bm = bmesh.new()
    f = bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])
    if f.normal.z < 0: f.normal_flip()
    if uvbox:
        uvl = bm.loops.layers.uv.verify()
        x0, y0, w, h = uvbox
        for l in f.loops: l[uvl].uv = ((l.vert.co.x - x0) / w, (l.vert.co.y - y0) / h)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    return bm

def lathe_bm(prof, seg=48):
    """prof: list of (radius, z); revolved about z."""
    bm = bmesh.new(); rings = []
    for r, z in prof:
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)])
    for a, b in zip(rings[:-1], rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            try: bm.faces.new((a[i], a[j], b[j], b[i]))
            except ValueError: pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-7)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges[:], dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm

def lathe(name, prof, material, seg=48, parent=None, loc=(0, 0, 0), sharp=40):
    bm = lathe_bm(prof, seg)
    bmesh.ops.translate(bm, vec=loc, verts=bm.verts)
    return finish(name, bm, material, parent, smooth=True, sharp=sharp)

def tube_bm(path, r, seg=12, closed=False):
    """A round tube along a list of points."""
    bm = bmesh.new(); rings = []
    for i, p in enumerate(path):
        p = Vector(p)
        a = Vector(path[max(0, i - 1)]); b = Vector(path[min(len(path) - 1, i + 1)])
        t = (b - a).normalized()
        n = t.orthogonal().normalized(); bn = t.cross(n)
        rings.append([bm.verts.new(p + (n * math.cos(2 * math.pi * k / seg) + bn * math.sin(2 * math.pi * k / seg)) * r) for k in range(seg)])
    for a, b in zip(rings[:-1], rings[1:]):
        for k in range(seg):
            j = (k + 1) % seg
            bm.faces.new((a[k], a[j], b[j], b[k]))
    if not closed:
        for ring in (rings[0], rings[-1]):
            bm.faces.new(ring)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm

def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None); COL.objects.link(o); o.location = loc
    if parent: o.parent = parent
    EXPORT.append(o)
    return o

# ================================================================ the room
WALL_Y = 0.33
RX = 0.9          # the right-hand wall, where the window is (the window itself stays out of the picture)
LX = -4.4         # far enough left that wide screens never run off the end of the room
bm = bmesh.new()
vs = [bm.verts.new(v) for v in [(LX, WALL_Y, 0), (RX, WALL_Y, 0), (RX, WALL_Y, 2.7), (LX, WALL_Y, 2.7)]]
f = bm.faces.new(vs); f.normal_update()
if f.normal.y > 0: f.normal_flip()
uvl = bm.loops.layers.uv.verify()
for l in f.loops: l[uvl].uv = (l.vert.co.x / 0.9, l.vert.co.z / 0.9)
finish('wall', bm, M['wall'], smooth=False)
bm = bmesh.new()
vs = [bm.verts.new(v) for v in [(RX, WALL_Y, 0), (RX, -3.0, 0), (RX, -3.0, 2.7), (RX, WALL_Y, 2.7)]]
f = bm.faces.new(vs); f.normal_update()
if f.normal.x > 0: f.normal_flip()
uvl = bm.loops.layers.uv.verify()
for l in f.loops: l[uvl].uv = (l.vert.co.y / 0.9, l.vert.co.z / 0.9)
finish('wall_right', bm, M['wall'], smooth=False)
bm = bmesh.new()
vs = [bm.verts.new(v) for v in [(LX, -3.0, 0), (RX, -3.0, 0), (RX, WALL_Y, 0), (LX, WALL_Y, 0)]]
bm.faces.new(vs)
finish('floor', bm, M['floor'], smooth=False)
box('baseboard', LX, RX, WALL_Y - 0.014, WALL_Y, 0, 0.1, M['paint'], bevel=0.002, seg=2)

# ================================================================ the radiator cover under the window, and its stone sill
RAD_X, SILL_Z, RAD_Y0 = 0.55, 0.835, -2.6
box('radiator_cover', RAD_X + 0.012, RX, RAD_Y0, WALL_Y, 0, SILL_Z, M['paint'])
box('radiator_kick', RAD_X + 0.006, RAD_X + 0.014, RAD_Y0, WALL_Y, 0, 0.07, M['paint'])
# a slotted grille just under the sill, and louvres down the front
box('radiator_grille_back', RAD_X + 0.008, RAD_X + 0.013, RAD_Y0, WALL_Y, 0.735, 0.815, M['grille_dark'])
bm = bmesh.new()
yv = WALL_Y - 0.01
while yv > -1.9:
    b = box_bm(RAD_X + 0.004, RAD_X + 0.012, yv - 0.0042, yv, 0.735, 0.815)
    me = bpy.data.meshes.new('tmp'); b.to_mesh(me); b.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
    yv -= 0.0125
finish('radiator_slats', bm, M['paint'], smooth=False)
box('radiator_rail', RAD_X + 0.003, RAD_X + 0.013, RAD_Y0, WALL_Y, 0.815, SILL_Z, M['paint'])
box('radiator_rail_low', RAD_X + 0.003, RAD_X + 0.013, RAD_Y0, WALL_Y, 0.715, 0.735, M['paint'])
box('radiator_louvre_back', RAD_X + 0.008, RAD_X + 0.013, RAD_Y0, WALL_Y, 0.09, 0.69, M['grille_dark'])
bm = bmesh.new()
for i in range(12):
    z0 = 0.095 + i * 0.05
    b = box_bm(RAD_X + 0.003, RAD_X + 0.011, RAD_Y0, WALL_Y, z0, z0 + 0.036, 0.0015, 2)
    me = bpy.data.meshes.new('tmp'); b.to_mesh(me); b.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
finish('radiator_louvres', bm, M['paint'], smooth=True, sharp=50)
box('sill', RAD_X - 0.022, RX, RAD_Y0, WALL_Y, SILL_Z, SILL_Z + 0.03, M['granite'], bevel=0.006, seg=4, uv=(1.6, 'x'))

# ================================================================ the desk (light oak, 42 x 24 in)
desk = empty('desk')
TOP = 0.76; X0, X1 = -0.535, 0.535; YF, YB = -0.305, 0.305
box('desk_top', X0, X1, YF, YB, TOP - 0.028, TOP, M['oak'], bevel=0.005, seg=4, parent=desk, uv=(0.83, 'x'))
# left end panel, right pedestal sides, back (modesty) panel, toe kick
box('desk_end_left', X0 + 0.004, X0 + 0.026, YF + 0.012, YB - 0.008, 0, TOP - 0.028, M['oak'], bevel=0.002, seg=2, parent=desk, uv=(0.83, 'z'))
PX0 = 0.105
box('pedestal_side_l', PX0, PX0 + 0.02, YF + 0.012, YB - 0.008, 0, TOP - 0.028, M['oak'], bevel=0.002, seg=2, parent=desk, uv=(0.83, 'z'))
box('pedestal_side_r', X1 - 0.026, X1 - 0.004, YF + 0.012, YB - 0.008, 0, TOP - 0.028, M['oak'], bevel=0.002, seg=2, parent=desk, uv=(0.83, 'z', (0.3, 0.1)))
box('modesty', X0 + 0.026, PX0, YB - 0.03, YB - 0.012, 0.36, TOP - 0.028, M['oak'], bevel=0.002, seg=2, parent=desk, uv=(0.83, 'x', (0.2, 0.4)))
box('toe_kick', PX0 + 0.02, X1 - 0.026, YF + 0.03, YF + 0.05, 0, 0.065, M['oak_end'], parent=desk)
# drawer fronts: a shallow pencil drawer over the kneehole, three in the pedestal; a pull groove under each top edge
def drawer(name, x0, x1, z0, z1, uvo):
    o = box(name, x0, x1, YF + 0.012, YF + 0.032, z0, z1, M['oak'], bevel=0.003, seg=3, parent=desk, uv=(0.83, 'x', uvo))
    box(name + '_pull', x0 + 0.02, x1 - 0.02, YF + 0.03, YF + 0.034, z1 - 0.026, z1 - 0.012, M['oak_end'], parent=desk)
    return o
drawer('drawer_pencil', X0 + 0.03, PX0 - 0.006, 0.626, TOP - 0.032, (0.1, 0.0))
drawer('drawer_1', PX0 + 0.004, X1 - 0.004, 0.555, TOP - 0.032, (0.4, 0.2))
drawer('drawer_2', PX0 + 0.004, X1 - 0.004, 0.335, 0.549, (0.7, 0.5))
drawer('drawer_3', PX0 + 0.004, X1 - 0.004, 0.07, 0.329, (0.2, 0.7))

# ================================================================ the dresser, to the left: taller than the desk, five drawers all the same height
dres = empty('dresser')
DX0, DX1, DTOP = -1.32, -0.555, 1.18
box('dresser_top', DX0, DX1, -0.24, 0.31, DTOP - 0.026, DTOP, M['oak'], bevel=0.004, seg=3, parent=dres, uv=(0.83, 'x', (0.5, 0.3)))
box('dresser_body', DX0 + 0.01, DX1 - 0.01, -0.225, 0.3, 0.0, DTOP - 0.026, M['oak'], bevel=0.002, seg=2, parent=dres, uv=(0.83, 'z', (0.1, 0.6)))
ZLO, ZHI, ND, GAP = 0.06, DTOP - 0.036, 5, 0.01
DH = (ZHI - ZLO - GAP * (ND - 1)) / ND
for i, (z0, z1) in enumerate([(ZLO + k * (DH + GAP), ZLO + k * (DH + GAP) + DH) for k in range(ND)]):
    box('dresser_drawer_%d' % i, DX0 + 0.02, DX1 - 0.02, -0.245, -0.225, z0, z1, M['oak'], bevel=0.003, seg=3, parent=dres, uv=(0.83, 'x', (0.13 * i, 0.4)))
    box('dresser_pull_%d' % i, DX0 + 0.05, DX1 - 0.05, -0.2454, -0.2449, z1 - 0.022, z1 - 0.013, M['groove'], parent=dres)

# ================================================================ the globe lamp on the dresser
glamp = empty('globe_lamp', (-0.73, 0.13, DTOP), dres)
lathe('globe_base', [(0, 0), (0.04, 0), (0.043, 0.004), (0.041, 0.02), (0.036, 0.025), (0.03, 0.024), (0, 0.022)], M['paint'], parent=glamp)
GR = 0.13
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=40, radius=GR)
bmesh.ops.translate(bm, vec=(0, 0, 0.025 + math.sqrt(GR * GR - 0.034 ** 2)), verts=bm.verts)
finish('globe_glass', bm, M['globe'], parent=glamp, sharp=0)

# ================================================================ the board on the wall, and the river print on it
board = empty('board', (-0.192, WALL_Y, 1.431))
BW, BH = 1.041, 0.738
fw = 0.032
for name, (x0, x1, z0, z1) in {
    'board_frame_top': (-BW / 2, BW / 2, BH / 2 - fw, BH / 2), 'board_frame_bottom': (-BW / 2, BW / 2, -BH / 2, -BH / 2 + fw),
    'board_frame_left': (-BW / 2, -BW / 2 + fw, -BH / 2 + fw, BH / 2 - fw), 'board_frame_right': (BW / 2 - fw, BW / 2, -BH / 2 + fw, BH / 2 - fw)}.items():
    box(name, x0, x1, -0.026, 0, z0, z1, M['oak'], bevel=0.004, seg=3, parent=board, uv=(0.83, 'z' if 'left' in name or 'right' in name else 'x', (0.3, 0.1)))
box('board_fabric', -BW / 2 + fw, BW / 2 - fw, -0.018, 0, -BH / 2 + fw, BH / 2 - fw, M['fabric'], parent=board, uv=(5.0, 'x'))
PW = 0.92; PH = PW * 41.0 / 66.0
bm = bmesh.new()
vs = [bm.verts.new(v) for v in [(-PW / 2, -0.0195, -PH / 2), (PW / 2, -0.0195, -PH / 2), (PW / 2, -0.0195, PH / 2), (-PW / 2, -0.0195, PH / 2)]]
f = bm.faces.new(vs); f.normal_update()
if f.normal.y > 0: f.normal_flip()
uvl = bm.loops.layers.uv.verify()
for l in f.loops: l[uvl].uv = ((l.vert.co.x + PW / 2) / PW, (l.vert.co.z + PH / 2) / PH)
finish('river_print', bm, M['paper'], parent=board, smooth=False)
for i, (px, pz) in enumerate([(-PW / 2 + 0.014, PH / 2 - 0.014), (PW / 2 - 0.014, PH / 2 - 0.014), (-PW / 2 + 0.014, -PH / 2 + 0.014), (PW / 2 - 0.014, -PH / 2 + 0.014)]):
    bm = lathe_bm([(0, 0.0), (0.0058, 0.0), (0.0062, 0.002), (0.0045, 0.004), (0.0035, 0.009), (0.0048, 0.0105), (0.0045, 0.0125), (0, 0.013)], 24)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, 'X'))
    bmesh.ops.translate(bm, vec=(px, -0.0198, pz), verts=bm.verts)
    finish('pin_%d' % i, bm, M['pin'], parent=board)

# ================================================================ the table lamp: brass base, walnut stem, linen drum shade
lamp = empty('table_lamp', (0.3755, 0.1645, TOP))
lathe('lamp_base', [(0, 0), (0.08, 0), (0.084, 0.004), (0.082, 0.011), (0.07, 0.015), (0.03, 0.019), (0.016, 0.024), (0.014, 0.05), (0, 0.05)], M['brass'], parent=lamp)
lathe('lamp_collar_low', [(0, 0.05), (0.017, 0.05), (0.018, 0.058), (0.015, 0.066), (0, 0.066)], M['brass'], parent=lamp)
lathe('lamp_stem', [(0, 0.066), (0.0125, 0.066), (0.0125, 0.33), (0, 0.33)], M['walnut'], parent=lamp, seg=32)
lathe('lamp_collar_high', [(0, 0.33), (0.016, 0.33), (0.017, 0.338), (0.011, 0.35), (0.009, 0.4), (0.014, 0.41), (0.014, 0.46), (0, 0.46)], M['brass'], parent=lamp)
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=20, radius=0.03)
bmesh.ops.scale(bm, vec=(1, 1, 1.25), verts=bm.verts); bmesh.ops.translate(bm, vec=(0, 0, 0.495), verts=bm.verts)
finish('lamp_bulb', bm, M['bulb'], parent=lamp, sharp=0)
# harp: two brass wires from the socket up to the finial
for s in (-1, 1):
    finish('lamp_harp_%d' % (s > 0), tube_bm([(s * 0.012, 0, 0.44), (s * 0.06, 0, 0.47), (s * 0.075, 0, 0.53), (s * 0.03, 0, 0.6), (0, 0, 0.615)], 0.0018, 8), M['brass'], parent=lamp)
lathe('lamp_finial', [(0, 0.61), (0.008, 0.612), (0.01, 0.622), (0.006, 0.632), (0, 0.634)], M['brass'], parent=lamp)
SH0, SH1, R0, R1 = 0.415, 0.625, 0.152, 0.138
bm = lathe_bm([(R0, SH0), (R0 + 0.0015, SH0 + 0.004), (R1 + 0.0015, SH1 - 0.004), (R1, SH1), (R1 - 0.0018, SH1 - 0.002), (R0 - 0.0018, SH0 + 0.002), (R0, SH0)], 72)
uvl = bm.loops.layers.uv.verify()
for f in bm.faces:
    for l in f.loops:
        c = l.vert.co; l[uvl].uv = ((math.atan2(c.y, c.x) / (2 * math.pi)) * 3.0, c.z * 3.0)
finish('lamp_shade', bm, M['linen'], parent=lamp, sharp=60)
finish('lamp_chain', tube_bm([(0.022, -0.01, 0.45), (0.024, -0.012, 0.36)], 0.0009, 6), M['brass'], parent=lamp)
lathe('lamp_chain_bead', [(0, 0.352), (0.003, 0.356), (0.0035, 0.362), (0.002, 0.366), (0, 0.367)], M['brass'], parent=lamp, loc=(0.024, -0.012, 0))

# ================================================================ MacBook Pro 16 (355.7 x 248.1 mm), space black
mbp = empty('macbook', (-0.2475, -0.1735 + 0.124, TOP))
W, D = 0.3557, 0.2481
BASE_H = 0.0098
bm = slab_bm(rrect_pts(W, D, 0.0105, 12), 0.0006, BASE_H, edge=0.0016, seg=3)
finish('mbp_base', bm, M['alu'], parent=mbp, sharp=50, weighted=True)
# feet
for fx, fy in [(-0.15, -0.1), (0.15, -0.1), (-0.15, 0.1), (0.15, 0.1)]:
    lathe('mbp_foot', [(0, 0.0), (0.006, 0.0), (0.0068, 0.0006), (0, 0.0007)], M['keys'], parent=mbp, loc=(fx, fy, 0), seg=16)
# keyboard: six rows; function row half height; keys sit slightly proud of a well
U = 0.0185; GAP = 0.0019; KW = 14.5 * U
kb_front = -D / 2 + 0.1175
rows = [
    (0.55, [1.45] + [1.0] * 12 + [1.05]),
    (1, [1.0] * 13 + [1.5]),
    (1, [1.5] + [1.0] * 13),
    (1, [1.8] + [1.0] * 11 + [1.7]),
    (1, [2.3] + [1.0] * 10 + [2.2]),
    (1, [1.0, 1.0, 1.0, 1.25, 5.0, 1.25, 1.0, 'arrows']),
]
bm = bmesh.new()
def key(x0, x1, y0, y1):
    k = box_bm(x0 + GAP / 2, x1 - GAP / 2, y0 + GAP / 2, y1 - GAP / 2, BASE_H - 0.0003, BASE_H + 0.0006, 0.0011, 2)
    me = bpy.data.meshes.new('tmp'); k.to_mesh(me); k.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
y = kb_front + 6 * U
row_heights = [r[0] for r in rows]
ytop = kb_front + sum(h * U for h in row_heights)
yy = ytop
for h, widths in rows:
    y1, y0 = yy, yy - h * U
    x = -KW / 2
    for w in widths:
        if w == 'arrows':
            aw = (KW / 2 - x) / 3
            key(x, x + aw, y0, y0 + U / 2); key(x + aw, x + 2 * aw, y0 + U / 2, y1); key(x + aw, x + 2 * aw, y0, y0 + U / 2); key(x + 2 * aw, x + 3 * aw, y0, y0 + U / 2)
            x += 3 * aw
            continue
        ww = w * U
        if widths is rows[0][1] and w == widths[-1]:
            ww = KW / 2 - x
        key(x, x + ww, y0, y1); x += ww
    yy = y0
finish('mbp_keys', bm, M['keys'], parent=mbp, sharp=50)
box('mbp_keywell', -KW / 2 - 0.003, KW / 2 + 0.003, kb_front - 0.003, ytop + 0.003, BASE_H - 0.0004, BASE_H - 0.00005, M['keys'], parent=mbp)
for s in (-1, 1):
    gx0 = KW / 2 + 0.008
    box('mbp_grille_%d' % (s > 0), min(s * gx0, s * (gx0 + 0.026)), max(s * gx0, s * (gx0 + 0.026)), kb_front, ytop, BASE_H - 0.00025, BASE_H + 0.00002, M['grille'], parent=mbp)
bm = slab_bm(rrect_pts(0.16, 0.1, 0.006, 8, 0, -D / 2 + 0.012 + 0.05), BASE_H - 0.00012, BASE_H + 0.00008)
finish('mbp_trackpad', bm, M['alu'], parent=mbp, sharp=50)
# the lid, hinged at the back edge, opened to about 108 degrees
lid = empty('mbp_lid', (0, D / 2 - 0.004, BASE_H + 0.002), mbp)
LH = 0.0068
bm = slab_bm(rrect_pts(W, D, 0.0105, 12, 0, D / 2), -LH, 0, edge=0.0014, seg=3)
finish('mbp_lid_shell', bm, M['alu'], parent=lid, sharp=50, weighted=True)
bm = plate_bm(rrect_pts(W - 0.002, D - 0.002, 0.0095, 12, 0, D / 2), 0.00005)
finish('mbp_bezel', bm, M['glass_black'], parent=lid, smooth=False)
SW, SHh = 0.3456, 0.2234
sy0 = 0.0157
bm = plate_bm([(-SW / 2, sy0), (SW / 2, sy0), (SW / 2, sy0 + SHh), (-SW / 2, sy0 + SHh)], 0.0001, (-SW / 2, sy0, SW, SHh))
uvl = bm.loops.layers.uv.verify()
for f in bm.faces:
    for l in f.loops: l[uvl].uv = ((l.vert.co.x + SW / 2) / SW, (l.vert.co.y - sy0) / SHh)
finish('mbp_screen', bm, M['mbp_screen'], parent=lid, smooth=False)
bm = plate_bm(rrect_pts(0.031, 0.0085, 0.0028, 6, 0, sy0 + SHh - 0.0035), 0.00016)
finish('mbp_notch', bm, M['glass_black'], parent=lid, smooth=False)
lid.rotation_euler = (math.radians(72), 0, 0)
finish('mbp_hinge', tube_bm([(-W / 2 + 0.035, D / 2 - 0.004, BASE_H + 0.002), (W / 2 - 0.035, D / 2 - 0.004, BASE_H + 0.002)], 0.0042, 16), M['hinge'], parent=mbp)

# ================================================================ iPhone 16 Pro Max-sized phones (163 x 77.6 x 8.25 mm) on oak stands
PWID, PLEN, PTH, PR = 0.0776, 0.1630, 0.00825, 0.0135
DW, DL = 0.0733, 0.1593
def phone(name, frame, back, screen_mat, loc, yaw):
    stand = empty(name + '_stand', loc)
    stand.rotation_euler = (0, 0, math.radians(yaw))
    # the stand: a low oak block with a slot and a back rest
    box(name + '_stand_base', -0.045, 0.045, -0.045, 0.04, 0, 0.014, M['oak'], bevel=0.003, seg=3, parent=stand, uv=(0.83, 'x', (0.2, 0.3)))
    box(name + '_stand_lip', -0.045, 0.045, -0.04, -0.028, 0.014, 0.022, M['oak'], bevel=0.002, seg=2, parent=stand, uv=(0.83, 'x', (0.6, 0.1)))
    rest = empty(name + '_stand_rest_pivot', (0, -0.012, 0.014), stand)
    rest.rotation_euler = (math.radians(-20), 0, 0)
    box(name + '_stand_rest', -0.04, 0.04, -0.004, 0.006, 0, 0.11, M['oak'], bevel=0.003, seg=3, parent=rest, uv=(0.83, 'z', (0.4, 0.6)))
    # the phone leans on the rest at 70 degrees, its bottom edge in the slot
    ph = empty(name, (0, -0.0172, 0.0122), stand)
    ph.rotation_euler = (math.radians(70), 0, 0)
    body = slab_bm(rrect_pts(PWID, PLEN, PR, 14, 0, PLEN / 2), 0, PTH, edge=0.0022, seg=4)
    finish(name + '_frame', body, frame, parent=ph, sharp=50, weighted=True)
    bm = plate_bm(rrect_pts(PWID - 0.0012, PLEN - 0.0012, PR - 0.0006, 14, 0, PLEN / 2), PTH + 0.00005)
    finish(name + '_glass', bm, M['glass_black'], parent=ph, smooth=False)
    pts = rrect_pts(DW, DL, 0.0108, 14, 0, PLEN / 2)
    bm = plate_bm(pts, PTH + 0.0001, (-DW / 2, PLEN / 2 - DL / 2, DW, DL))
    finish(name + '_screen', bm, screen_mat, parent=ph, smooth=False)
    bm = plate_bm(rrect_pts(0.0205, 0.006, 0.003, 8, 0, PLEN / 2 + DL / 2 - 0.0058), PTH + 0.00015)
    finish(name + '_island', bm, M['glass_black'], parent=ph, smooth=False)
    bm = plate_bm(rrect_pts(PWID - 0.0012, PLEN - 0.0012, PR - 0.0006, 14, 0, PLEN / 2), -0.00005)
    bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    finish(name + '_back', bm, back, parent=ph, smooth=False)
    # camera plateau and three lenses on the back
    cx, cy = -PWID / 2 + 0.0255, PLEN - 0.0255
    bm = slab_bm(rrect_pts(0.043, 0.043, 0.009, 8, cx, cy), -0.0011, 0, edge=0.0006, seg=2)
    finish(name + '_plateau', bm, back, parent=ph, sharp=50)
    for lx, ly in [(-0.0095, 0.0095), (-0.0095, -0.0095), (0.0095, 0.0)]:
        bm = lathe_bm([(0, -0.0024), (0.0058, -0.0024), (0.0071, -0.002), (0.0072, -0.0012), (0.0062, -0.0011), (0, -0.0011)], 28)
        bmesh.ops.translate(bm, vec=(cx + lx, cy + ly, 0), verts=bm.verts)
        finish(name + '_lens_ring', bm, M['lens_ring'], parent=ph)
        bm = lathe_bm([(0, -0.0026), (0.0052, -0.0024), (0.0055, -0.0022), (0, -0.0022)], 28)
        bmesh.ops.translate(bm, vec=(cx + lx, cy + ly, 0), verts=bm.verts)
        finish(name + '_lens', bm, M['lens'], parent=ph)
    # buttons on the frame
    for (bx, by, bl) in [(-PWID / 2 - 0.0006, PLEN - 0.042, 0.01), (-PWID / 2 - 0.0006, PLEN - 0.06, 0.018), (-PWID / 2 - 0.0006, PLEN - 0.083, 0.018), (PWID / 2 + 0.0006, PLEN - 0.07, 0.026), (PWID / 2 + 0.0006, PLEN - 0.115, 0.016)]:
        box(name + '_button', bx - 0.0007, bx + 0.0007, by - bl / 2, by + bl / 2, PTH * 0.3, PTH * 0.7, frame, bevel=0.0003, seg=2, parent=ph)
    return stand
phone('iphone_filuma', M['ti_desert'], M['back_desert'], M['screen_a'], (0.012, -0.085, TOP), -12)
phone('iphone_meds', M['ti_natural'], M['back_natural'], M['screen_b'], (0.15, -0.035, TOP), -22)

# ================================================================ the mug, with a tea bag
mug = empty('mug', (0.305, -0.15, TOP))
lathe('mug_body', [(0, 0.0), (0.034, 0.0), (0.0385, 0.0025), (0.0405, 0.012), (0.0412, 0.09), (0.0408, 0.0955), (0.0385, 0.0962), (0.0372, 0.0925), (0.0368, 0.012), (0.03, 0.0085), (0, 0.008)], M['ceramic'], parent=mug, seg=64)
arc = [(0.0405 + 0.019 * math.sin(math.radians(a)) * 1.05, 0, 0.051 + 0.026 * math.cos(math.radians(a))) for a in range(-150, 151, 10)]
arc = [(0.034 + 0.026 * math.cos(math.radians(a)) * 0.9, 0, 0.052 + 0.027 * math.sin(math.radians(a))) for a in range(-70, 71, 7)]
finish('mug_handle', tube_bm(arc, 0.0055, 16), M['ceramic'], parent=mug)
lathe('mug_tea', [(0, 0.074), (0.0369, 0.074), (0, 0.0741)], M['tea'], parent=mug, seg=48)
string = [(-0.026, 0.026, 0.096), (-0.029, 0.029, 0.0985), (-0.033, 0.033, 0.094), (-0.036, 0.036, 0.075), (-0.036, 0.036, 0.055)]
finish('tea_string', tube_bm(string, 0.0005, 6), M['string'], parent=mug)
tag = empty('tea_tag', (-0.036, 0.0362, 0.044), mug)
tag.rotation_euler = (0, 0, math.radians(-45))
box('tea_tag_paper', -0.009, 0.009, -0.0003, 0.0003, -0.011, 0.011, M['tag'], parent=tag)

# ================================================================ the Aloft toy plane: a chunky white airliner with a coral tail
toy = empty('toy_plane', (0.0, 0.0, 1.25))
# fuselage along +y (nose), a fat capsule with the tail swept up
prof = [(0.0, -0.088), (0.006, -0.086), (0.011, -0.078), (0.014, -0.062), (0.0155, -0.04), (0.016, 0.0), (0.0158, 0.04), (0.0148, 0.058), (0.0125, 0.07), (0.009, 0.078), (0.0045, 0.0835), (0.0, 0.085)]
bm = lathe_bm([(r, z) for r, z in prof], 40)
bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(-90), 3, 'X'))
for v in bm.verts:
    if v.co.y < -0.035: v.co.z += (-(v.co.y + 0.035)) ** 2 * 3.2
finish('toy_fuselage', bm, M['plane_white'], parent=toy, sharp=0)
# windows and a navy cheatline
for side in (-1, 1):
    for k in range(10):
        yk = 0.045 - k * 0.0085
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=0.0019)
        bmesh.ops.scale(bm, vec=(0.5, 1.1, 1.3), verts=bm.verts)
        bmesh.ops.translate(bm, vec=(side * 0.0153, yk, 0.0045), verts=bm.verts)
        finish('toy_window', bm, M['plane_window'], parent=toy, sharp=0)
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=6, radius=0.003)
    bmesh.ops.scale(bm, vec=(0.6, 1.5, 0.8), verts=bm.verts)
    bmesh.ops.translate(bm, vec=(side * 0.006, 0.073, 0.0085), verts=bm.verts)
    finish('toy_cockpit', bm, M['plane_window'], parent=toy, sharp=0)
def wing(name, root_y, root_c, tip_c, span, sweep, thick, z, material, dihedral=0.06, mirror=True, vertical=False):
    for s in ((-1, 1) if mirror else (1,)):
        pts = [(0, root_y + root_c / 2), (s * span, root_y - sweep + tip_c / 2), (s * span, root_y - sweep - tip_c / 2), (0, root_y - root_c / 2)]
        if s < 0: pts = list(reversed(pts))
        bm = slab_bm(pts, -thick / 2, thick / 2, edge=thick * 0.45, seg=3)
        for v in bm.verts: v.co.z += abs(v.co.x) * dihedral + z
        if vertical:
            bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, z), matrix=Matrix.Rotation(math.radians(-90), 3, 'Y'))
        finish(name + ('_r' if s > 0 else '_l'), bm, material, parent=toy, sharp=55)
wing('toy_wing', 0.002, 0.042, 0.016, 0.082, 0.032, 0.0042, -0.006, M['plane_white'])
wing('toy_stab', -0.074, 0.02, 0.01, 0.032, 0.012, 0.003, 0.014, M['plane_white'], dihedral=0.1)
# the fin: a trapezoid standing up from the tail, in coral
pts = [(-0.084, 0.012), (-0.06, 0.012), (-0.072, 0.05), (-0.088, 0.05)]
bm = bmesh.new()
f = bm.faces.new([bm.verts.new((0, y_, z_)) for y_, z_ in pts])
ext = bmesh.ops.extrude_face_region(bm, geom=[f]); nv = [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]
bmesh.ops.translate(bm, vec=(0.0034, 0, 0), verts=nv); bmesh.ops.translate(bm, vec=(-0.0017, 0, 0), verts=bm.verts)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.0012, offset_type='OFFSET', segments=2, profile=0.5, affect='EDGES', clamp_overlap=True)
finish('toy_fin', bm, M['plane_coral'], parent=toy, sharp=55)
for s in (-1, 1):
    bm = lathe_bm([(0, -0.016), (0.0062, -0.0155), (0.0078, -0.012), (0.008, 0.006), (0.0074, 0.012), (0.0064, 0.0125), (0.006, 0.006), (0, 0.004)], 28)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(-90), 3, 'X'))
    bmesh.ops.translate(bm, vec=(s * 0.036, 0.012, -0.0125), verts=bm.verts)
    finish('toy_engine', bm, M['plane_coral'], parent=toy, sharp=55)
    finish('toy_pylon', box_bm(s * 0.036 - 0.0012, s * 0.036 + 0.0012, 0.0, 0.016, -0.007, -0.002, 0.0006, 2), M['plane_white'], parent=toy, sharp=50)


# ================================================================ helpers for the soft things
def merge(dst, src):
    me = bpy.data.meshes.new('tmp'); src.to_mesh(me); src.free(); dst.from_mesh(me); bpy.data.meshes.remove(me)

def spline(pts, n=10):
    """Catmull-Rom through the points, n samples per span."""
    P = [Vector(p) for p in pts]; P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2])
    return out

# ================================================================ his Red Sox cap, tipped back on the dresser
CA, CB, CH = 0.088, 0.099, 0.112
bm = bmesh.new(); uvl = bm.loops.layers.uv.verify()
NT, NP = 72, 14
ring = []
for j in range(NP + 1):
    ph = (math.pi / 2) * j / NP
    row = []
    for i in range(NT):
        th = 2 * math.pi * i / NT
        # six panels: a faint dip along each seam
        seam = 1 - 0.014 * (1 if i % 12 == 0 else 0) * math.sin(ph * 2) ** 0.5
        x = CA * math.cos(th) * math.cos(ph) * seam; y = CB * math.sin(th) * math.cos(ph) * seam
        z = CH * math.sin(ph) ** 0.85
        if y < 0: z += 0.012 * (-y / CB) * math.sin(ph)        # the front stands a little taller
        row.append(bm.verts.new((x, y, z)))
    ring.append(row)
top = bm.verts.new((0, -0.006, CH + 0.004))
for j in range(NP):
    for i in range(NT):
        k = (i + 1) % NT
        bm.faces.new((ring[j][i], ring[j][k], ring[j + 1][k], ring[j + 1][i]))
for i in range(NT):
    bm.faces.new((ring[NP][i], ring[NP][(i + 1) % NT], top))
bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-6)
crown_faces = bm.faces[:]
# the bill: from the front of the crown, curved down at the sides
NB, NR = 28, 6
inner, outer = [], []
bill = []
for i in range(NB + 1):
    th = math.radians(198 + 144 * i / NB)
    ix, iy = CA * math.cos(th), CB * math.sin(th)
    reach = 0.078 * math.sin(math.pi * i / NB) ** 0.6
    row = []
    for r in range(NR + 1):
        q = r / NR
        x = ix * (1 + 0.1 * q); y = iy - reach * q
        z = 0.004 - 0.7 * x * x
        row.append((x, y, z))
    bill.append(row)
BT = 0.0035
for side in (0, 1):
    vs = [[bm.verts.new((x, y, z + (BT if side == 0 else 0))) for (x, y, z) in row] for row in bill]
    for i in range(NB):
        for r in range(NR):
            q = (vs[i][r], vs[i + 1][r], vs[i + 1][r + 1], vs[i][r + 1])
            bm.faces.new(q if side == 0 else tuple(reversed(q)))
    if side == 0: up = vs
    else: dn = vs
for i in range(NB):
    bm.faces.new((up[i][NR], up[i + 1][NR], dn[i + 1][NR], dn[i][NR]))
for r in range(NR):
    bm.faces.new((up[0][r], up[0][r + 1], dn[0][r + 1], dn[0][r]))
    bm.faces.new((up[NB][r + 1], up[NB][r], dn[NB][r], dn[NB][r + 1]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
# the B: projected onto the front panels only
for f in bm.faces:
    front = f in crown_faces and f.calc_center_median().y < -0.02 and f.normal.y < -0.2
    for l in f.loops:
        c = l.vert.co
        l[uvl].uv = (0.5 + c.x / (2 * CA) * 0.92, 0.04 + c.z / CH * 0.96) if front else (0.04, 0.04)
# the button on top
b = bmesh.new(); bmesh.ops.create_uvsphere(b, u_segments=16, v_segments=8, radius=0.0075)
bmesh.ops.scale(b, vec=(1, 1, 0.45), verts=b.verts); bmesh.ops.translate(b, vec=(0, -0.006, CH + 0.005), verts=b.verts)
uv2 = b.loops.layers.uv.verify()
for f in b.faces:
    for l in f.loops: l[uv2].uv = (0.04, 0.04)
merge(bm, b)
# it sits flat on its band, the bill's curved edges resting on the dresser; then it's turned to show the B
for v in bm.verts:
    if v.co.z < 0.0005: v.co.z = 0.0005
cap = empty('cap', (-0.706, -0.1, DTOP), dres)
cap.rotation_euler = (0, 0, math.radians(48))
finish('cap_body', bm, M['cap'], parent=cap, smooth=True, sharp=70)

# ================================================================ the candle: a plain tin on the window sill, standing on its own lid, lit
cnd = empty('candle', (0.66, -0.16, SILL_Z + 0.03))
lathe('candle_lid', [(0, 0), (0.0405, 0), (0.0418, 0.0015), (0.0418, 0.0095), (0.0405, 0.011), (0, 0.011)], M['tin'], parent=cnd, seg=56)
lathe('candle_tin', [(0, 0.011), (0.039, 0.011), (0.0398, 0.0125), (0.0398, 0.042), (0.0392, 0.0436), (0.0398, 0.0452), (0.0398, 0.054), (0.0405, 0.0552), (0.0398, 0.0565), (0.0385, 0.0555), (0.0384, 0.02), (0, 0.02)], M['tin'], parent=cnd, seg=56)
lathe('candle_wax', [(0, 0.046), (0.0384, 0.046), (0.0384, 0.0455), (0, 0.0455)], M['wax'], parent=cnd, seg=48)
lathe('candle_wick', [(0, 0.046), (0.0011, 0.046), (0.0011, 0.053), (0.0006, 0.0545), (0, 0.0547)], M['wick'], parent=cnd, seg=8)
lathe('candle_flame', [(0, 0.053), (0.003, 0.0545), (0.0046, 0.059), (0.0042, 0.066), (0.0026, 0.0735), (0.0009, 0.0805), (0, 0.083)], M['flame'], parent=cnd, seg=16)

# ================================================================ the plant on the sill: a hoya in a white pot
PX, PY, PZ = 0.705, 0.17, SILL_Z + 0.03
import random
rnd = random.Random(11)
POT_Z = PZ
lathe('pot', [(0, POT_Z), (0.034, POT_Z), (0.036, POT_Z + 0.004), (0.044, POT_Z + 0.07), (0.046, POT_Z + 0.072), (0.046, POT_Z + 0.076), (0.042, POT_Z + 0.076), (0.04, POT_Z + 0.06), (0, POT_Z + 0.06)], M['pot'], loc=(PX, PY, 0), seg=40)
lathe('pot_soil', [(0, POT_Z + 0.066), (0.0405, POT_Z + 0.066), (0, POT_Z + 0.0665)], M['soil'], loc=(PX, PY, 0), seg=32)
SOIL = POT_Z + 0.066
stems = [
    [(PX, PY, SOIL), (PX + 0.005, PY - 0.004, SOIL + 0.05), (PX + 0.02, PY - 0.02, SOIL + 0.1), (PX + 0.035, PY - 0.03, SOIL + 0.125)],
    [(PX - 0.01, PY + 0.01, SOIL), (PX - 0.02, PY + 0.03, SOIL + 0.04), (PX - 0.035, PY + 0.06, SOIL + 0.08), (PX - 0.04, PY + 0.075, SOIL + 0.1)],
    [(PX + 0.01, PY + 0.01, SOIL), (PX + 0.03, PY + 0.03, SOIL + 0.03), (PX + 0.065, PY + 0.05, SOIL + 0.05), (PX + 0.095, PY + 0.065, SOIL + 0.055)],
    # three that trail over the sill and down onto the desk
    [(PX - 0.02, PY - 0.02, SOIL), (PX - 0.05, PY - 0.04, SOIL + 0.022), (PX - 0.105, PY - 0.06, SOIL + 0.005), (0.548, PY - 0.07, 0.905), (0.521, PY - 0.075, 0.85), (0.509, PY - 0.08, 0.8), (0.497, PY - 0.09, 0.772), (0.47, PY - 0.11, 0.764)],
    [(PX - 0.02, PY + 0.0, SOIL), (PX - 0.055, PY + 0.03, SOIL + 0.02), (PX - 0.115, PY + 0.05, SOIL + 0.0), (0.54, PY + 0.06, 0.9), (0.518, PY + 0.065, 0.84), (0.511, PY + 0.07, 0.79), (0.504, PY + 0.08, 0.765)],
    [(PX - 0.015, PY - 0.03, SOIL), (PX - 0.045, PY - 0.07, SOIL + 0.015), (PX - 0.105, PY - 0.13, SOIL - 0.005), (0.55, PY - 0.17, 0.905), (0.523, PY - 0.19, 0.85), (0.511, PY - 0.2, 0.8), (0.5, PY - 0.21, 0.767), (0.46, PY - 0.24, 0.763), (0.42, PY - 0.25, 0.763)],
]
stem_bm = bmesh.new(); leaves = bmesh.new(); young = bmesh.new()
def add_leaf(dst, base, d, n, L, Wd, fold=0.32, curl=0.22):
    d = d.normalized(); n = (n - d * n.dot(d)).normalized(); sd = n.cross(d)
    NU, NV = 9, 3
    grid = []
    for i in range(NU + 1):
        t = i / NU
        hw = max(0.0004, Wd / 2 * math.sin(math.pi * t ** 0.85) ** 0.7)
        row = []
        for j in range(-NV, NV + 1):
            v = j / NV
            p = base + d * (t * L) + sd * (v * hw) + n * (fold * abs(v) * hw - curl * L * t * t)
            row.append(dst.verts.new(p))
        grid.append(row)
    for i in range(NU):
        for j in range(2 * NV):
            dst.faces.new((grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
UP = Vector((0, 0, 1)); FACE = Vector((-0.35, -0.55, 0.75)).normalized()
for si, ctrl in enumerate(stems):
    path = spline(ctrl, 8)
    merge(stem_bm, tube_bm([tuple(p) for p in path], 0.0019 if si < 3 else 0.0016, 6))
    # leaves in opposite pairs along the stem
    acc, nxt, flip = 0.0, 0.028, 0
    for i in range(1, len(path)):
        seg = (path[i] - path[i - 1]).length; acc += seg
        if acc < nxt: continue
        nxt += 0.034 + rnd.random() * 0.012
        t = (path[min(i + 1, len(path) - 1)] - path[i - 1]).normalized()
        side = t.cross(UP)
        if side.length < 0.2: side = t.cross(Vector((0, -1, 0)))
        side.normalize()
        flip ^= 1
        for sgn in (1, -1):
            d = side * sgn * 0.9 + t * 0.45 + UP * (0.35 if si < 3 else -0.05)
            d.rotate(Matrix.Rotation(rnd.uniform(-0.35, 0.35), 3, t))
            size = rnd.uniform(0.85, 1.12) * (0.82 if acc < 0.06 else 1.0)
            n = (FACE if si >= 3 else UP * 0.7 + FACE * 0.3)
            add_leaf(young if (si < 3 and acc > 0.09) or rnd.random() < 0.15 else leaves, path[i] + d.normalized() * 0.002, d, n, 0.046 * size, 0.034 * size)
    # a last leaf at the tip of the uprights
    if si < 3:
        t = (path[-1] - path[-2]).normalized()
        add_leaf(young, path[-1], t + UP * 0.3, FACE, 0.04, 0.03)
finish('plant_stems', stem_bm, M['stem'], sharp=0)
finish('plant_leaves', leaves, M['leaf'], sharp=0)
finish('plant_leaves_young', young, M['leaf_young'], sharp=0)

# ================================================================ export
for o in bpy.data.objects: o.select_set(o in EXPORT)
bpy.context.view_layer.objects.active = EXPORT[0]
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                          export_texcoords=True, export_normals=True, export_materials='EXPORT', export_image_format='JPEG',
                          export_cameras=False, export_lights=False)
print('EXPORTED', OUT)

# ================================================================ a preview render
if PREVIEW:
    scene.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 1400; scene.render.resolution_y = 875
    w = bpy.data.worlds.new('w'); scene.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.5, 0.52, 0.56, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.5
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.0; sun.color = (1.0, 0.82, 0.62)
    so = bpy.data.objects.new('sun', sun); COL.objects.link(so); so.rotation_euler = (math.radians(62), math.radians(0), math.radians(105))
    area = bpy.data.lights.new('fill', 'AREA'); area.energy = 60; area.size = 2
    ao = bpy.data.objects.new('fill', area); COL.objects.link(ao); ao.location = (-0.6, -2.0, 1.8); ao.rotation_euler = (math.radians(60), 0, math.radians(-15))
    cam = bpy.data.cameras.new('cam'); cam.lens = 30
    co = bpy.data.objects.new('cam', cam); COL.objects.link(co); scene.camera = co
    import os
    shots = {'overview': ((-0.35, -1.75, 1.55), (-0.08, 0.1, 1.0), 30), 'macbook': ((-0.3, -0.62, 1.02), (-0.24, 0.0, 0.84), 40),
             'phones': ((0.12, -0.42, 0.93), (0.08, -0.05, 0.83), 45), 'lamp': ((0.6, -0.7, 1.2), (0.37, 0.16, 1.1), 40),
             'plane': ((0.2, -0.35, 1.32), (0.0, 0.0, 1.25), 55)}
    for name, (loc, tgt, lens) in shots.items():
        co.location = loc; cam.lens = lens
        d = Vector(tgt) - Vector(loc); co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = os.path.join(os.path.dirname(PREVIEW), name + '.png')
        bpy.ops.render.render(write_still=True)
    print('PREVIEWED')
